import { In } from 'typeorm';
import { AppDataSource } from '../../database/data-source';
import { Desafio, EstadoDesafio, LadoDesafio } from '../../entities/Desafio.entity';
import { Deporte } from '../../entities/Deporte.entity';
import { Reserva } from '../../entities/Reserva.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Persona } from '../../entities/Persona.entity';
import { Auditoria } from '../../entities/Auditoria.entity';
import { EmailService } from '../../services/email.service';


const desafioRepo = AppDataSource.getRepository(Desafio);
const personaRepo = AppDataSource.getRepository(Persona);
const deporteRepo = AppDataSource.getRepository(Deporte);
const reservaRepo = AppDataSource.getRepository(Reserva);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const auditoriaRepo = AppDataSource.getRepository(Auditoria);

export class DesafioService {
  private K = 32; // K-factor ELO
  private ELO_INICIAL = 1200;

  async crearDesafio(dto: {
    reservaId: string;
    deporteId: string;
    invitadosDesafiadosIds: string[];
    jugadoresCreadorIds?: string[];
  }, creadorPersonaId: string) {
    const { reservaId, deporteId, invitadosDesafiadosIds, jugadoresCreadorIds = [] } = dto;
    console.log('🔁 Iniciando creación de desafío...');
    console.log('➡️ DTO recibido:', dto);
    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['disponibilidad', 'disponibilidad.cancha'],
    });

    if (!reserva) throw new Error('❌ Reserva no encontrada');
    console.log(`📆 Reserva encontrada: ${reserva.id}`);

    if (await desafioRepo.findOne({ where: { reserva: { id: reservaId } } })) {
      throw new Error('⚠️ Ya hay un desafío en esta reserva');
    }

    if (new Date(reserva.fechaHora) <= new Date()) {
      throw new Error('⚠️ No se puede crear un desafío con una reserva pasada');
    }

    const deporte = await deporteRepo.findOne({ where: { id: deporteId } });
    if (!deporte) throw new Error('❌ Deporte no encontrado');
    console.log(`⚽ Deporte encontrado: ${deporte.nombre}`);

    const jugadoresCreador = await personaRepo.find({ where: { id: In([creadorPersonaId, ...jugadoresCreadorIds]) } });
    if (!jugadoresCreador.find(j => j.id === creadorPersonaId)) {
      throw new Error('❌ El creador debe ser parte del desafío');
    }
    console.log(`👥 Jugadores del creador cargados: ${jugadoresCreador.map(j => j.nombre).join(', ')}`);

    const invitados = await personaRepo.find({ where: { id: In(invitadosDesafiadosIds) } });
    if (invitados.length !== invitadosDesafiadosIds.length) {
      throw new Error('❌ Uno o más invitados no existen');
    }
    console.log(`✉️ Invitados a desafiar encontrados: ${invitados.map(i => i.email).join(', ')}`);

    const desafio = desafioRepo.create({
      reserva,
      deporte,
      creador: jugadoresCreador.find(j => j.id === creadorPersonaId)!,
      jugadoresCreador,
      invitadosDesafiados: invitados,
      jugadoresDesafiados: [],
      estado: EstadoDesafio.Pendiente,
    });
    const creado = await desafioRepo.save(desafio);
    console.log(`✅ Desafío guardado con ID: ${creado.id}`);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'crear_desafio',
        descripcion: `Desafío creado por ${desafio.creador?.nombre ?? 'creador'} en cancha ${reserva.disponibilidad.cancha.nombre}`,
        entidad: 'desafio',
        entidadId: creado.id,
      })
    );
    console.log('📝 Auditoría registrada');

    EmailService.enviarInvitacionesDesafio(creado, invitados).catch(err => {
      console.error('❌ Error al enviar mails:', err);
    });

    return creado;
  }

  async aceptarDesafio(desafioId: string, personaId: string) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: [
        'invitadosDesafiados',
        'jugadoresDesafiados',
        'reserva',
        'reserva.disponibilidad',
        'reserva.disponibilidad.cancha',
        'creador'
      ]
    });

    if (!desafio) throw new Error('❌ Desafío no encontrado');

    if (new Date(desafio.reserva.fechaHora) <= new Date()) {
      throw new Error('⚠️ La reserva ya pasó, no se puede aceptar');
    }

    const invitado = desafio.invitadosDesafiados.find(p => p.id === personaId);
    const yaAceptado = desafio.jugadoresDesafiados.find(p => p.id === personaId);

    if (yaAceptado) {
      throw new Error('⚠️ Esta persona ya había aceptado el desafío');
    }

    if (!invitado) {
      throw new Error('❌ La persona no estaba invitada a este desafío');
    }

    // TODO: validar deuda si aplica

    // Mover de invitados a jugadores
    desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter(p => p.id !== personaId);
    desafio.jugadoresDesafiados.push(invitado);

    if (desafio.estado === EstadoDesafio.Pendiente) {
      desafio.estado = EstadoDesafio.Aceptado;
    }

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'aceptar_invitacion',
        descripcion: `${invitado.nombre} aceptó el desafío en cancha ${desafio.reserva.disponibilidad.cancha.nombre}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    EmailService.enviarAceptacionDesafio(actualizado, invitado).catch(err => {
      console.error('❌ Error al enviar mail de aceptación:', err);
    });

    console.log(`✅ ${invitado.nombre} se unió al desafío ${desafio.id}`);

    return actualizado;
  }

  async rechazarDesafio(desafioId: string, personaId: string) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: ['invitadosDesafiados', 'jugadoresDesafiados']
    });
    if (!desafio) throw new Error('Desafío no encontrado');

    const invitado = desafio.invitadosDesafiados.find(p => p.id === personaId);

    if (!invitado) {
      const yaAceptado = desafio.jugadoresDesafiados.find(p => p.id === personaId);
      if (yaAceptado) throw new Error('No se puede rechazar un desafío ya aceptado');
      throw new Error('La persona no estaba invitada a este desafío');
    }

    desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter(p => p.id !== personaId);

    if (desafio.jugadoresDesafiados.length === 0 && desafio.invitadosDesafiados.length === 0) {
      desafio.estado = EstadoDesafio.Cancelado;
    }

    const actualizado = await desafioRepo.save(desafio);

    console.log(`🚫 ${invitado.nombre} rechazó el desafío ${desafio.id}`);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'rechazar_invitacion',
        descripcion: `${invitado.nombre} rechazó el desafío`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    return actualizado;
  }

  async agregarJugadores(
    desafioId: string,
    solicitanteId: string,
    dto: { lado: 'creador' | 'desafiado'; jugadoresIds: string[] }
  ) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: ['jugadoresCreador', 'jugadoresDesafiados', 'creador']
    });
    if (!desafio) throw new Error('Desafío no encontrado');

    const estadosPermitidos = [EstadoDesafio.Pendiente, EstadoDesafio.Aceptado];
    if (!estadosPermitidos.includes(desafio.estado)) {
      throw new Error('No se pueden agregar jugadores en este estado');
    }

    const nuevos = await personaRepo.find({ where: { id: In(dto.jugadoresIds) } });
    if (nuevos.length !== dto.jugadoresIds.length) {
      throw new Error('Uno o más jugadores no existen');
    }

    const esCreador = desafio.creador.id === solicitanteId;
    const perteneceCreador = desafio.jugadoresCreador.some(j => j.id === solicitanteId);
    const perteneceDesafiado = desafio.jugadoresDesafiados.some(j => j.id === solicitanteId);

    if (dto.lado === 'creador' && !(esCreador || perteneceCreador)) {
      throw new Error('No estás autorizado para agregar jugadores al lado creador');
    }
    if (dto.lado === 'desafiado' && !perteneceDesafiado) {
      throw new Error('No estás autorizado para agregar jugadores al lado desafiado');
    }

    const idsCreador = new Set(desafio.jugadoresCreador.map(j => j.id));
    const idsDesafiado = new Set(desafio.jugadoresDesafiados.map(j => j.id));

    const jugadoresFiltrados = nuevos.filter(n => {
      if (dto.lado === 'creador' && idsDesafiado.has(n.id)) {
        throw new Error(`El jugador ${n.nombre} ya está en el lado desafiado`);
      }
      if (dto.lado === 'desafiado' && idsCreador.has(n.id)) {
        throw new Error(`El jugador ${n.nombre} ya está en el lado creador`);
      }
      return true;
    });

    if (dto.lado === 'creador') {
      desafio.jugadoresCreador = [
        ...desafio.jugadoresCreador,
        ...jugadoresFiltrados.filter(j => !idsCreador.has(j.id))
      ];
    } else {
      desafio.jugadoresDesafiados = [
        ...desafio.jugadoresDesafiados,
        ...jugadoresFiltrados.filter(j => !idsDesafiado.has(j.id))
      ];

      if (desafio.estado === EstadoDesafio.Pendiente && desafio.jugadoresDesafiados.length > 0) {
        desafio.estado = EstadoDesafio.Aceptado;
      }
    }

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'agregar_jugadores',
        descripcion: `Se agregaron ${jugadoresFiltrados.length} jugador(es) al lado ${dto.lado}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );

    return actualizado;
  }

  async finalizarDesafio(
    id: string,
    solicitanteId: string,
    dto: { ganadorLado: 'creador' | 'desafiado'; resultado?: string; valoracion?: number }
  ) {
    const desafio = await desafioRepo.findOne({
      where: { id },
      relations: [
        'jugadoresCreador',
        'jugadoresDesafiados',
        'reserva',
        'reserva.disponibilidad',
        'reserva.disponibilidad.cancha'
      ],
    });
    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado) throw new Error('Solo se pueden finalizar desafíos aceptados');

    if (new Date(desafio.reserva.fechaHora) > new Date()) {
      throw new Error('Aún no se puede finalizar: el partido no ocurrió');
    }

    const participantes = new Set([
      ...desafio.jugadoresCreador,
      ...desafio.jugadoresDesafiados
    ].map(j => j.id));

    if (!participantes.has(solicitanteId)) {
      throw new Error('Solo participantes del desafío pueden finalizarlo');
    }

    // Parse resultado
    let golesC: number | null = null;
    let golesD: number | null = null;
    if (dto.resultado) {
      const [a, b] = dto.resultado.split('-').map(n => parseInt(n.trim(), 10));
      if ([a, b].some(n => Number.isNaN(n))) {
        throw new Error('Formato de resultado inválido. Usa "3-2"');
      }
      golesC = a;
      golesD = b;
    }

    const ganadores = dto.ganadorLado === 'creador' ? desafio.jugadoresCreador : desafio.jugadoresDesafiados;
    const perdedores = dto.ganadorLado === 'creador' ? desafio.jugadoresDesafiados : desafio.jugadoresCreador;

    await this.actualizarRankingEloPorLados(ganadores, perdedores);

    desafio.estado = EstadoDesafio.Finalizado;
    desafio.ganador = dto.ganadorLado === 'creador' ? LadoDesafio.Creador : LadoDesafio.Desafiado;
    desafio.golesCreador = golesC;
    desafio.golesDesafiado = golesD;

    this.aplicarValoracionSiCorresponde(desafio, dto.valoracion, dto.ganadorLado, solicitanteId);

    const finalizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'finalizar_desafio',
        descripcion: `Desafío finalizado en ${desafio.reserva.disponibilidad.cancha.nombre} – ganador: ${dto.ganadorLado}${dto.resultado ? ` (${dto.resultado})` : ''}`,
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

    const esGanador = ladoGanador === 'creador'
      ? desafio.jugadoresCreador.some(j => j.id === solicitanteId)
      : desafio.jugadoresDesafiados.some(j => j.id === solicitanteId);

    if (esGanador) {
      if (ladoGanador === 'creador') desafio.valoracionCreador = valoracion;
      else desafio.valoracionDesafiado = valoracion;
    } else {
      if (ladoGanador === 'creador') desafio.valoracionDesafiado = valoracion;
      else desafio.valoracionCreador = valoracion;
    }
  }

  async listarDesafios() {
    return await desafioRepo
      .createQueryBuilder('desafio')
      .leftJoinAndSelect('desafio.deporte', 'deporte')
      .leftJoinAndSelect('desafio.reserva', 'reserva')
      .leftJoinAndSelect('reserva.disponibilidad', 'disponibilidad')
      .leftJoinAndSelect('disponibilidad.cancha', 'cancha')
      .leftJoinAndSelect('desafio.jugadoresCreador', 'jugadorC')
      .leftJoinAndSelect('desafio.jugadoresDesafiados', 'jugadorD')
      .orderBy('reserva.fechaHora', 'DESC')
      .getMany();
  }
  
  private async actualizarRankingEloPorLados(
    ganadores: Persona[],
    perdedores: Persona[]
  ) {
    const obtenerPerfiles = async (personas: Persona[]) =>
      await perfilRepo.find({
        where: personas.map(p => ({ usuario: { persona: { id: p.id } } })),
        relations: ['usuario', 'usuario.persona'],
      });

    const perfilesGanadores = await obtenerPerfiles(ganadores);
    const perfilesPerdedores = await obtenerPerfiles(perdedores);

    const faltan = (grupo: Persona[], perfiles: PerfilCompetitivo[]) =>
      grupo.filter(p => !perfiles.find(per => per.usuario.persona.id === p.id));

    perfilesGanadores.push(
      ...faltan(ganadores, perfilesGanadores).map(p =>
        perfilRepo.create({ ranking: this.ELO_INICIAL, usuario: { persona: p } as any })
      )
    );
    perfilesPerdedores.push(
      ...faltan(perdedores, perfilesPerdedores).map(p =>
        perfilRepo.create({ ranking: this.ELO_INICIAL, usuario: { persona: p } as any })
      )
    );

    const promedio = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / (nums.length || 1);

    const rankingGanador = promedio(perfilesGanadores.map(p => p.ranking));
    const rankingPerdedor = promedio(perfilesPerdedores.map(p => p.ranking));

    const expectedG = 1 / (1 + Math.pow(10, (rankingPerdedor - rankingGanador) / 400));
    const expectedP = 1 - expectedG;

    perfilesGanadores.forEach(p => p.ranking = Math.round(p.ranking + this.K * (1 - expectedG)));
    perfilesPerdedores.forEach(p => p.ranking = Math.round(p.ranking + this.K * (0 - expectedP)));

    await perfilRepo.save([...perfilesGanadores, ...perfilesPerdedores]);
  }
}