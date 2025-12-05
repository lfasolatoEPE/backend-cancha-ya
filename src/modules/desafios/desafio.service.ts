import { In } from 'typeorm';
import { AppDataSource } from '../../database/data-source';
import { Desafio, EstadoDesafio, LadoDesafio } from '../../entities/Desafio.entity';
import { Deporte } from '../../entities/Deporte.entity';
import { Reserva } from '../../entities/Reserva.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Persona } from '../../entities/Persona.entity';
import { Auditoria } from '../../entities/Auditoria.entity';
import { EloHistory } from '../../entities/EloHistory.entity';
import { RankingStrategy } from '../ranking/ranking-strategy';
import { EloTeamStrategy } from '../ranking/elo-team.strategy';

import { CrearDesafioDto } from './dto/crear-desafio.dto';
import { AgregarJugadoresDto } from './dto/agregar-jugadores.dto';
import { FinalizarDesafioDto } from './dto/finalizar-desafio.dto';
import { FiltroDesafioDto } from './dto/filtro-desafio.dto';

const desafioRepo = AppDataSource.getRepository(Desafio);
const personaRepo = AppDataSource.getRepository(Persona);
const deporteRepo = AppDataSource.getRepository(Deporte);
const reservaRepo = AppDataSource.getRepository(Reserva);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const auditoriaRepo = AppDataSource.getRepository(Auditoria);
const eloHistoryRepo = AppDataSource.getRepository(EloHistory);

export class DesafioService {
  private ELO_INICIAL = 1200;
  private rankingStrategy: RankingStrategy = new EloTeamStrategy();

  // 🧷 CREAR DESAFÍO
  async crearDesafio(dto: CrearDesafioDto, creadorPersonaId: string) {
    const { reservaId, deporteId, invitadosDesafiadosIds, jugadoresCreadorIds = [] } = dto;

    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['disponibilidad', 'disponibilidad.cancha', 'disponibilidad.horario'],
    });
    if (!reserva) throw new Error('❌ Reserva no encontrada');

    if (await desafioRepo.findOne({ where: { reserva: { id: reservaId } } })) {
      throw new Error('⚠️ Ya hay un desafío en esta reserva');
    }
    if (new Date(reserva.fechaHora) <= new Date()) {
      throw new Error('⚠️ No se puede crear un desafío con una reserva pasada');
    }

    const deporte = await deporteRepo.findOne({ where: { id: deporteId } });
    if (!deporte) throw new Error('❌ Deporte no encontrado');

    const jugadoresCreador = await personaRepo.find({
      where: { id: In([creadorPersonaId, ...jugadoresCreadorIds]) },
    });
    if (!jugadoresCreador.find((j) => j.id === creadorPersonaId)) {
      throw new Error('❌ El creador debe ser parte del desafío');
    }

    const invitados = await personaRepo.find({
      where: { id: In(invitadosDesafiadosIds) },
    });
    if (invitados.length !== invitadosDesafiadosIds.length) {
      throw new Error('❌ Uno o más invitados no existen');
    }

    const desafio = desafioRepo.create({
      reserva,
      deporte,
      creador: jugadoresCreador.find((j) => j.id === creadorPersonaId)!,
      jugadoresCreador,
      invitadosCreador: [], 
      invitadosDesafiados: invitados,
      jugadoresDesafiados: [],
      estado: EstadoDesafio.Pendiente,
    });

    const creado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'crear_desafio',
        descripcion: `Desafío creado por ${desafio.creador?.nombre ?? 'creador'} en cancha ${
          reserva.disponibilidad.cancha.nombre
        }`,
        entidad: 'desafio',
        entidadId: creado.id,
      })
    );

    // 🔕 Email / push se podrían agregar acá, pero para el TP alcanza
    // con que el invitado lo vea en GET /desafios.

    return creado;
  }

  // ✅ ACEPTAR DESAFÍO (mover de invitados → jugadoresDesafiados)
  async aceptarDesafio(desafioId: string, personaId: string) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: [
        'invitadosCreador',
        'invitadosDesafiados',
        'jugadoresCreador',
        'jugadoresDesafiados',
        'reserva',
        'reserva.disponibilidad',
        'reserva.disponibilidad.cancha',
        'reserva.disponibilidad.horario',
        'creador',
      ],
    });
    if (!desafio) throw new Error('❌ Desafío no encontrado');

    if (new Date(desafio.reserva.fechaHora) <= new Date()) {
      throw new Error('⚠️ La reserva ya pasó, no se puede aceptar');
    }

    const invitadoLadoCreador = desafio.invitadosCreador.find((p) => p.id === personaId);
    const invitadoLadoDesafiado = desafio.invitadosDesafiados.find((p) => p.id === personaId);

    const yaEnCreador = desafio.jugadoresCreador.some((p) => p.id === personaId);
    const yaEnDesafiado = desafio.jugadoresDesafiados.some((p) => p.id === personaId);

    if (yaEnCreador || yaEnDesafiado) {
      throw new Error('⚠️ Esta persona ya había aceptado el desafío');
    }

    if (!invitadoLadoCreador && !invitadoLadoDesafiado) {
      throw new Error('❌ La persona no estaba invitada a este desafío');
    }

    let lado: 'creador' | 'desafiado';
    if (invitadoLadoCreador) {
      lado = 'creador';
      desafio.invitadosCreador = desafio.invitadosCreador.filter((p) => p.id !== personaId);
      desafio.jugadoresCreador.push(invitadoLadoCreador);
    } else {
      lado = 'desafiado';
      desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter((p) => p.id !== personaId);
      desafio.jugadoresDesafiados.push(invitadoLadoDesafiado!);

      // solo tiene sentido cambiar a Aceptado cuando ya hay desafiados confirmados
      if (desafio.estado === EstadoDesafio.Pendiente) {
        desafio.estado = EstadoDesafio.Aceptado;
      }
    }

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'aceptar_invitacion',
        descripcion: `La persona ${invitadoLadoCreador?.nombre ?? invitadoLadoDesafiado?.nombre
          } aceptó la invitación en el lado ${lado}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    return actualizado;
  }

  // 🚫 RECHAZAR DESAFÍO
  async rechazarDesafio(desafioId: string, personaId: string) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: [
        'invitadosCreador',
        'invitadosDesafiados',
        'jugadoresDesafiados',
        'jugadoresCreador',
      ],
    });
    if (!desafio) throw new Error('Desafío no encontrado');

    const invitadoCreador = desafio.invitadosCreador.find((p) => p.id === personaId);
    const invitadoDesafiado = desafio.invitadosDesafiados.find((p) => p.id === personaId);

    if (!invitadoCreador && !invitadoDesafiado) {
      const yaAceptado =
        desafio.jugadoresCreador.some((p) => p.id === personaId) ||
        desafio.jugadoresDesafiados.some((p) => p.id === personaId);
      if (yaAceptado) {
        throw new Error('No se puede rechazar un desafío ya aceptado');
      }
      throw new Error('La persona no estaba invitada a este desafío');
    }

    let lado: 'creador' | 'desafiado';
    let nombre = '';

    if (invitadoCreador) {
      lado = 'creador';
      nombre = invitadoCreador.nombre;
      desafio.invitadosCreador = desafio.invitadosCreador.filter((p) => p.id !== personaId);
      // No tocamos estado global por esto
    } else {
      lado = 'desafiado';
      nombre = invitadoDesafiado!.nombre;
      desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter((p) => p.id !== personaId);

      // Si no queda nadie en el lado desafiado, se cancela el desafío
      if (
        desafio.jugadoresDesafiados.length === 0 &&
        desafio.invitadosDesafiados.length === 0
      ) {
        desafio.estado = EstadoDesafio.Cancelado;
      }
    }

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'rechazar_invitacion',
        descripcion: `${nombre} rechazó la invitación del lado ${lado}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    return actualizado;
  }

  async cancelarDesafio(desafioId: string, solicitanteId: string, esAdmin: boolean) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: ['creador'],
    });
    if (!desafio) throw new Error('Desafío no encontrado');

    if ([EstadoDesafio.Finalizado, EstadoDesafio.Cancelado].includes(desafio.estado)) {
      throw new Error('El desafío ya no puede cancelarse');
    }

    const esCreador = desafio.creador.id === solicitanteId;

    if (!esCreador && !esAdmin) {
      throw new Error('No tenés permisos para cancelar este desafío');
    }

    desafio.estado = EstadoDesafio.Cancelado;
    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'cancelar_desafio',
        descripcion: `Desafío cancelado por ${esCreador ? 'creador' : 'admin'}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    return actualizado;
  }

  // ➕ AGREGAR JUGADORES
  async agregarJugadores(
    desafioId: string,
    solicitanteId: string,
    esAdmin: boolean,
    dto: AgregarJugadoresDto,
  ) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: [
        'jugadoresCreador',
        'jugadoresDesafiados',
        'invitadosCreador',
        'invitadosDesafiados',
        'creador',
      ],
    });
    if (!desafio) throw new Error('Desafío no encontrado');

    const estadosPermitidos = [EstadoDesafio.Pendiente, EstadoDesafio.Aceptado];
    if (!estadosPermitidos.includes(desafio.estado)) {
      throw new Error('No se pueden gestionar jugadores en este estado');
    }

    const nuevos = await personaRepo.find({ where: { id: In(dto.jugadoresIds) } });
    if (nuevos.length !== dto.jugadoresIds.length) {
      throw new Error('Uno o más jugadores no existen');
    }

    // Permisos
    const esCreador = desafio.creador.id === solicitanteId;
    const perteneceCreador = desafio.jugadoresCreador.some((j) => j.id === solicitanteId);
    const perteneceDesafiado = desafio.jugadoresDesafiados.some((j) => j.id === solicitanteId);

    if (!esAdmin) {
      if (dto.lado === 'creador' && !(esCreador || perteneceCreador)) {
        throw new Error('No estás autorizado para gestionar jugadores del lado creador');
      }
      if (dto.lado === 'desafiado' && !perteneceDesafiado) {
        throw new Error('No estás autorizado para gestionar jugadores del lado desafiado');
      }
    }

    const idsCreador = new Set(desafio.jugadoresCreador.map((j) => j.id));
    const idsDesafiado = new Set(desafio.jugadoresDesafiados.map((j) => j.id));
    const idsInvCreador = new Set(desafio.invitadosCreador.map((j) => j.id));
    const idsInvDesafiado = new Set(desafio.invitadosDesafiados.map((j) => j.id));

    if (dto.accion === 'invitar') {
      // Evitar duplicados y cruces de lado
      const candidatos = nuevos.filter((n) => {
        if (idsCreador.has(n.id) || idsDesafiado.has(n.id)) {
          throw new Error(`El jugador ${n.nombre} ya es parte del desafío en otro lado`);
        }
        if (idsInvCreador.has(n.id) || idsInvDesafiado.has(n.id)) {
          // ya invitado, no lo duplicamos
          return false;
        }
        return true;
      });

      if (dto.lado === 'creador') {
        desafio.invitadosCreador = [...desafio.invitadosCreador, ...candidatos];
      } else {
        desafio.invitadosDesafiados = [...desafio.invitadosDesafiados, ...candidatos];
      }

      const actualizado = await desafioRepo.save(desafio);

      await auditoriaRepo.save(
        auditoriaRepo.create({
          accion: 'invitar_jugadores',
          descripcion: `Se invitaron ${candidatos.length} jugador(es) al lado ${dto.lado}`,
          entidad: 'desafio',
          entidadId: actualizado.id,
        })
      );

      return actualizado;
    }

    // accion === 'remover'
    const idsAEliminar = new Set(dto.jugadoresIds);

    if (dto.lado === 'creador') {
      // admin puede sacar también confirmados
      desafio.invitadosCreador = desafio.invitadosCreador.filter(
        (p) => !idsAEliminar.has(p.id),
      );
      if (esAdmin) {
        desafio.jugadoresCreador = desafio.jugadoresCreador.filter(
          (p) => !idsAEliminar.has(p.id),
        );
      }
    } else {
      desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter(
        (p) => !idsAEliminar.has(p.id),
      );
      if (esAdmin) {
        desafio.jugadoresDesafiados = desafio.jugadoresDesafiados.filter(
          (p) => !idsAEliminar.has(p.id),
        );

        // si no queda nadie en lado desafiado, el desafío se cancela
        if (
          desafio.jugadoresDesafiados.length === 0 &&
          desafio.invitadosDesafiados.length === 0
        ) {
          desafio.estado = EstadoDesafio.Cancelado;
        }
      }
    }

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'remover_jugadores',
        descripcion: `Se removieron jugadores del lado ${dto.lado}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    return actualizado;
  }

  // 🏁 FINALIZAR DESAFÍO (ELO + stats + historial)
  async finalizarDesafio(
    id: string,
    solicitanteId: string,
    dto: FinalizarDesafioDto
  ) {
    const desafio = await desafioRepo.findOne({
      where: { id },
      relations: [
        'jugadoresCreador',
        'jugadoresDesafiados',
        'reserva',
        'reserva.disponibilidad',
        'reserva.disponibilidad.cancha',
      ],
    });
    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado) {
      throw new Error('Solo se pueden finalizar desafíos aceptados');
    }

    if (new Date(desafio.reserva.fechaHora) > new Date()) {
      throw new Error('Aún no se puede finalizar: el partido no ocurrió');
    }

    const participantes = new Set(
      [...desafio.jugadoresCreador, ...desafio.jugadoresDesafiados].map((j) => j.id)
    );
    if (!participantes.has(solicitanteId)) {
      throw new Error('Solo participantes del desafío pueden finalizarlo');
    }

    // Parse resultado
    let golesC: number | null = null;
    let golesD: number | null = null;
    if (dto.resultado) {
      const [a, b] = dto.resultado.split('-').map((n) => parseInt(n.trim(), 10));
      if ([a, b].some((n) => Number.isNaN(n))) {
        throw new Error('Formato de resultado inválido. Usa "3-2"');
      }
      golesC = a;
      golesD = b;
    }

    const ganadores =
      dto.ganadorLado === 'creador' ? desafio.jugadoresCreador : desafio.jugadoresDesafiados;
    const perdedores =
      dto.ganadorLado === 'creador' ? desafio.jugadoresDesafiados : desafio.jugadoresCreador;

    // 1) Actualizar ELO + historial
    await this.actualizarRankingEloPorLadosConHistorial(ganadores, perdedores, desafio);

    // 2) Actualizar estadísticas de desempeño
    await this.actualizarStatsPorLados(desafio, dto.ganadorLado, golesC, golesD);

    // 3) Guardar resultado + ganador + valoración
    desafio.estado = EstadoDesafio.Finalizado;
    desafio.ganador =
      dto.ganadorLado === 'creador' ? LadoDesafio.Creador : LadoDesafio.Desafiado;
    desafio.golesCreador = golesC;
    desafio.golesDesafiado = golesD;

    this.aplicarValoracionSiCorresponde(
      desafio,
      dto.valoracion,
      dto.ganadorLado,
      solicitanteId
    );

    const finalizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'finalizar_desafio',
        descripcion: `Desafío finalizado en ${
          desafio.reserva.disponibilidad.cancha.nombre
        } – ganador: ${dto.ganadorLado}${dto.resultado ? ` (${dto.resultado})` : ''}`,
        entidad: 'desafio',
        entidadId: desafio.id,
      })
    );

    return finalizado;
  }

  private aplicarValoracionSiCorresponde(
    desafio: Desafio,
    valoracion?: number,
    ladoGanador?: 'creador' | 'desafiado',
    solicitanteId?: string
  ) {
    if (!valoracion || valoracion < 1 || valoracion > 5) return;

    const esGanador =
      ladoGanador === 'creador'
        ? desafio.jugadoresCreador.some((j) => j.id === solicitanteId)
        : desafio.jugadoresDesafiados.some((j) => j.id === solicitanteId);

    if (esGanador) {
      if (ladoGanador === 'creador') desafio.valoracionCreador = valoracion;
      else desafio.valoracionDesafiado = valoracion;
    } else {
      if (ladoGanador === 'creador') desafio.valoracionDesafiado = valoracion;
      else desafio.valoracionCreador = valoracion;
    }
  }

  // 📬 LISTAR DESAFÍOS "MI BANDEJA"
  async listarDesafios(personaId: string, filtro: FiltroDesafioDto, esAdmin: boolean) {
    // si NO es admin, siempre ve sólo sus propios desafíos
    const jugadorId = esAdmin && filtro.jugadorId ? filtro.jugadorId : personaId;

    const qb = desafioRepo
      .createQueryBuilder('desafio')
      .leftJoinAndSelect('desafio.deporte', 'deporte')
      .leftJoinAndSelect('desafio.reserva', 'reserva')
      .leftJoinAndSelect('reserva.disponibilidad', 'disponibilidad')
      .leftJoinAndSelect('disponibilidad.cancha', 'cancha')
      .leftJoinAndSelect('desafio.creador', 'creador')
      .leftJoinAndSelect('desafio.jugadoresCreador', 'jugC')
      .leftJoinAndSelect('desafio.jugadoresDesafiados', 'jugD')
      .leftJoinAndSelect('desafio.invitadosCreador', 'invC')
      .leftJoinAndSelect('desafio.invitadosDesafiados', 'invD')
      .orderBy('reserva.fechaHora', 'DESC');

    // donde la persona participa o está invitada
    qb.where(
      'creador.id = :jugadorId ' +
        'OR jugC.id = :jugadorId ' +
        'OR jugD.id = :jugadorId ' +
        'OR invC.id = :jugadorId ' +
        'OR invD.id = :jugadorId',
      { jugadorId },
    );

    if (filtro.estado) {
      qb.andWhere('desafio.estado = :estado', {
        estado: filtro.estado as EstadoDesafio,
      });
    }

    if (filtro.deporteId) {
      qb.andWhere('deporte.id = :deporteId', {
        deporteId: filtro.deporteId,
      });
    }

    return qb.getMany();
  }


  // ---------- ELO + HISTORIAL ----------

  private async actualizarRankingEloPorLados(
    ganadores: Persona[],
    perdedores: Persona[]
  ) {
    const obtenerPerfiles = async (personas: Persona[]) =>
      await perfilRepo.find({
        where: personas.map((p) => ({ usuario: { persona: { id: p.id } } })),
        relations: ['usuario', 'usuario.persona'],
      });

    const perfilesGanadores = await obtenerPerfiles(ganadores);
    const perfilesPerdedores = await obtenerPerfiles(perdedores);

    const faltan = (grupo: Persona[], perfiles: PerfilCompetitivo[]) =>
      grupo.filter((p) => !perfiles.find((per) => per.usuario.persona.id === p.id));

    // crear perfiles faltantes con ELO inicial
    perfilesGanadores.push(
      ...faltan(ganadores, perfilesGanadores).map((p) =>
        perfilRepo.create({
          ranking: this.ELO_INICIAL,
          usuario: { persona: p } as any,
          activo: true,
        })
      )
    );
    perfilesPerdedores.push(
      ...faltan(perdedores, perfilesPerdedores).map((p) =>
        perfilRepo.create({
          ranking: this.ELO_INICIAL,
          usuario: { persona: p } as any,
          activo: true,
        })
      )
    );

    const rankingGanadores = perfilesGanadores.map((p) => p.ranking);
    const rankingPerdedores = perfilesPerdedores.map((p) => p.ranking);

    const { nuevosGanadores, nuevosPerdedores } =
      this.rankingStrategy.calcularNuevoRankingEquipos({
        rankingGanadores,
        rankingPerdedores,
      });

    perfilesGanadores.forEach((p, i) => {
      p.ranking = nuevosGanadores[i];
    });
    perfilesPerdedores.forEach((p, i) => {
      p.ranking = nuevosPerdedores[i];
    });

    await perfilRepo.save([...perfilesGanadores, ...perfilesPerdedores]);
  }

  private async actualizarRankingEloPorLadosConHistorial(
    ganadores: Persona[],
    perdedores: Persona[],
    desafio?: Desafio
  ) {
    const obtenerPerfiles = async (personas: Persona[]) =>
      await perfilRepo.find({
        where: personas.map((p) => ({ usuario: { persona: { id: p.id } } })),
        relations: ['usuario', 'usuario.persona'],
      });

    const perfilesGanadores = await obtenerPerfiles(ganadores);
    const perfilesPerdedores = await obtenerPerfiles(perdedores);

    const faltan = (grupo: Persona[], perfiles: PerfilCompetitivo[]) =>
      grupo.filter((p) => !perfiles.find((per) => per.usuario.persona.id === p.id));

    // crear perfiles faltantes con ELO inicial
    perfilesGanadores.push(
      ...faltan(ganadores, perfilesGanadores).map((p) =>
        perfilRepo.create({
          ranking: this.ELO_INICIAL,
          usuario: { persona: p } as any,
          activo: true,
        })
      )
    );
    perfilesPerdedores.push(
      ...faltan(perdedores, perfilesPerdedores).map((p) =>
        perfilRepo.create({
          ranking: this.ELO_INICIAL,
          usuario: { persona: p } as any,
          activo: true,
        })
      )
    );

    const rankingGanadores = perfilesGanadores.map((p) => p.ranking);
    const rankingPerdedores = perfilesPerdedores.map((p) => p.ranking);

    const { nuevosGanadores, nuevosPerdedores } =
      this.rankingStrategy.calcularNuevoRankingEquipos({
        rankingGanadores,
        rankingPerdedores,
      });

    const historiales: EloHistory[] = [];

    perfilesGanadores.forEach((p, i) => {
      const prev = p.ranking;
      const nuevo = nuevosGanadores[i];

      p.ranking = nuevo;

      historiales.push(
        eloHistoryRepo.create({
          perfil: p,
          desafio,
          rankingAnterior: prev,
          rankingNuevo: nuevo,
          delta: nuevo - prev,
        })
      );
    });

    perfilesPerdedores.forEach((p, i) => {
      const prev = p.ranking;
      const nuevo = nuevosPerdedores[i];

      p.ranking = nuevo;

      historiales.push(
        eloHistoryRepo.create({
          perfil: p,
          desafio,
          rankingAnterior: prev,
          rankingNuevo: nuevo,
          delta: nuevo - prev,
        })
      );
    });

    await perfilRepo.save([...perfilesGanadores, ...perfilesPerdedores]);
    await eloHistoryRepo.save(historiales);

    return historiales;
  }

  // 📊 STATS PERFIL COMPETITIVO
  private async actualizarStatsPorLados(
    desafio: Desafio,
    ganadorLado: 'creador' | 'desafiado',
    golesC: number | null,
    golesD: number | null
  ) {
    const golesCreador = typeof golesC === 'number' ? golesC : 0;
    const golesDesafiado = typeof golesD === 'number' ? golesD : 0;

    const afectar = async (
      personas: Persona[],
      {
        gano,
        empato,
        gf,
        gc,
      }: { gano: boolean; empato: boolean; gf: number; gc: number }
    ) => {
      const perfiles = await perfilRepo.find({
        where: personas.map((p) => ({ usuario: { persona: { id: p.id } } })),
        relations: ['usuario', 'usuario.persona'],
      });

      const faltan = personas.filter(
        (p) => !perfiles.find((x) => x.usuario.persona.id === p.id)
      );
      if (faltan.length) {
        perfiles.push(
          ...faltan.map((p) =>
            perfilRepo.create({
              ranking: this.ELO_INICIAL,
              usuario: { persona: p } as any,
              activo: true,
            })
          )
        );
      }

      perfiles.forEach((perfil) => {
        perfil.partidosJugados = (perfil.partidosJugados ?? 0) + 1;
        perfil.golesFavor = (perfil.golesFavor ?? 0) + gf;
        perfil.golesContra = (perfil.golesContra ?? 0) + gc;

        if (empato) {
          perfil.empates = (perfil.empates ?? 0) + 1;
          perfil.racha = 0;
        } else if (gano) {
          perfil.victorias = (perfil.victorias ?? 0) + 1;
          perfil.racha = (perfil.racha ?? 0) >= 0 ? (perfil.racha ?? 0) + 1 : 1;
        } else {
          perfil.derrotas = (perfil.derrotas ?? 0) + 1;
          perfil.racha = (perfil.racha ?? 0) <= 0 ? (perfil.racha ?? 0) - 1 : -1;
        }
      });

      await perfilRepo.save(perfiles);
    };

    const empate =
      typeof golesC === 'number' &&
      typeof golesD === 'number' &&
      golesC === golesD;
    const ganoCreador = !empate && ganadorLado === 'creador';
    const ganoDesafiado = !empate && ganadorLado === 'desafiado';

    await afectar(desafio.jugadoresCreador, {
      gano: ganoCreador,
      empato: empate,
      gf: golesCreador,
      gc: golesDesafiado,
    });

    await afectar(desafio.jugadoresDesafiados, {
      gano: ganoDesafiado,
      empato: empate,
      gf: golesDesafiado,
      gc: golesCreador,
    });
  }
}
