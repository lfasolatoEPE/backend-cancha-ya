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
    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['disponibilidad', 'disponibilidad.cancha'],
    });

    if (!reserva) throw new Error('Reserva no encontrada');
    if (await desafioRepo.findOne({ where: { reserva: { id: reservaId } } })) {
      throw new Error('Ya hay un desafío en esta reserva');
    }
    if (new Date(reserva.fechaHora) <= new Date()) {
      throw new Error('No se puede crear un desafío con una reserva pasada');
    }

    const deporte = await deporteRepo.findOne({ where: { id: deporteId } });
    if (!deporte) throw new Error('Deporte no encontrado');

    // Armar lado creador (incluye al creador sí o sí)
    const jugadoresCreador = await personaRepo.find({ where: { id: In([creadorPersonaId, ...jugadoresCreadorIds]) } });
    if (!jugadoresCreador.find(j => j.id === creadorPersonaId)) {
      throw new Error('El creador debe ser parte del desafío');
    }
    // Invitados del lado desafiado
    const invitados = await personaRepo.find({ where: { id: In(invitadosDesafiadosIds) } });
    if (invitados.length !== invitadosDesafiadosIds.length) {
      throw new Error('Uno o más invitados no existen');
    }

    // TODO: validar deuda de creador e invitados con tu middleware/servicio de deuda
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

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'crear_desafio',
        descripcion: `Desafío creado por ${desafio.creador?.nombre ?? 'creador'} en cancha ${reserva.disponibilidad.cancha.nombre}`,
        entidad: 'desafio',
        entidadId: creado.id,
      })
    );

    // Notificar por mail a invitados (fire-and-forget)
    EmailService.enviarInvitacionesDesafio(creado, invitados).catch(() => {});

    return creado;
  }

  async aceptarDesafio(desafioId: string, personaId: string) {
    const desafio = await desafioRepo.findOne({ where: { id: desafioId }, relations: ['invitadosDesafiados', 'jugadoresDesafiados'] });
    if (!desafio) throw new Error('Desafío no encontrado');


    if (new Date(desafio.reserva.fechaHora) <= new Date()) {
    throw new Error('La reserva ya pasó, no se puede aceptar');
    }


    const invitado = desafio.invitadosDesafiados.find(p => p.id === personaId);
    if (!invitado) throw new Error('La persona no estaba invitada a este desafío');


    // TODO: validar deuda de quien acepta


    // Mover de invitados → desafiados
    desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter(p => p.id !== personaId);
    desafio.jugadoresDesafiados = [...desafio.jugadoresDesafiados, invitado];


    // Si estaba pendiente, pasa a aceptado al primer OK
    if (desafio.estado === EstadoDesafio.Pendiente) {
    desafio.estado = EstadoDesafio.Aceptado;
    }
    const actualizado = await desafioRepo.save(desafio);


    await auditoriaRepo.save(
      auditoriaRepo.create({
      accion: 'aceptar_invitacion',
      descripcion: `${invitado.nombre} aceptó el desafío`,
      entidad: 'desafio',
      entidadId: actualizado.id,
      })
    );

    // Notificar al creador
    EmailService.enviarAceptacionDesafio(actualizado, invitado).catch(() => {});

    return actualizado;
  }

  async rechazarDesafio(desafioId: string, personaId: string) {
    const desafio = await desafioRepo.findOne({ where: { id: desafioId }, relations: ['invitadosDesafiados', 'jugadoresDesafiados'] });
    if (!desafio) throw new Error('Desafío no encontrado');

    const invitado = desafio.invitadosDesafiados.find(p => p.id === personaId);
    if (!invitado) throw new Error('La persona no estaba invitada a este desafío');

    desafio.invitadosDesafiados = desafio.invitadosDesafiados.filter(p => p.id !== personaId);

    // Si no quedan aceptados ni invitados → cancelar
    if (desafio.jugadoresDesafiados.length === 0 && desafio.invitadosDesafiados.length === 0) {
    desafio.estado = EstadoDesafio.Cancelado;
    }

    const actualizado = await desafioRepo.save(desafio);

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

  async agregarJugadores(desafioId: string, solicitanteId: string, dto: { lado: 'creador' | 'desafiado'; jugadoresIds: string[] }) {
    const desafio = await desafioRepo.findOne({ where: { id: desafioId }, relations: ['jugadoresCreador', 'jugadoresDesafiados', 'creador'] });
    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado && desafio.estado !== EstadoDesafio.Pendiente) {
      throw new Error('Solo se pueden agregar jugadores a desafíos pendientes/aceptados');
    }

    const nuevos = await personaRepo.find({ where: { id: In(dto.jugadoresIds) } });
    if (nuevos.length !== dto.jugadoresIds.length) throw new Error('Uno o más jugadores no existen');

    // Autorización básica: quien agrega debe pertenecer a ese lado (o ser el creador en el lado creador)
    const esCreador = desafio.creador.id === solicitanteId;
    const perteneceCreador = desafio.jugadoresCreador.some(j => j.id === solicitanteId);
    const perteneceDesafiado = desafio.jugadoresDesafiados.some(j => j.id === solicitanteId);
    if (dto.lado === 'creador' && !(esCreador || perteneceCreador)) {
      throw new Error('No estás autorizado para agregar jugadores al lado creador');
    }
    if (dto.lado === 'desafiado' && !perteneceDesafiado) {
      throw new Error('No estás autorizado para agregar jugadores al lado desafiado');
    }

    // Evitar duplicados y que un jugador esté en ambos lados
    const idsCreador = new Set(desafio.jugadoresCreador.map(j => j.id));
    const idsDesafiado = new Set(desafio.jugadoresDesafiados.map(j => j.id));

    for (const n of nuevos) {
      if (dto.lado === 'creador' && idsDesafiado.has(n.id)) {
        throw new Error(`El jugador ${n.nombre} ya está en el lado desafiado`);
      }
      if (dto.lado === 'desafiado' && idsCreador.has(n.id)) {
        throw new Error(`El jugador ${n.nombre} ya está en el lado creador`);
      }
    }
    if (dto.lado === 'creador') {
      desafio.jugadoresCreador = [...desafio.jugadoresCreador, ...nuevos.filter(n => !idsCreador.has(n.id))];
    } else {
      desafio.jugadoresDesafiados = [...desafio.jugadoresDesafiados, ...nuevos.filter(n => !idsDesafiado.has(n.id))];
      // Si estaba pendiente y se suma el primer desafiado, pasa a aceptado
      if (desafio.estado === EstadoDesafio.Pendiente && desafio.jugadoresDesafiados.length > 0) {
        desafio.estado = EstadoDesafio.Aceptado;
      }
    }

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'agregar_jugadores',
        descripcion: `Se agregaron jugadores al lado ${dto.lado}`,
        entidad: 'desafio',
        entidadId: actualizado.id,
      })
    );
    return actualizado;
  }

  async finalizarDesafio(id: string, solicitanteId: string, dto: { ganadorLado: 'creador' | 'desafiado'; resultado?: string; valoracion?: number }) {
    const desafio = await desafioRepo.findOne({
      where: { id },
      relations: ['jugadoresCreador', 'jugadoresDesafiados', 'reserva', 'reserva.disponibilidad', 'reserva.disponibilidad.cancha'],
    });

    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado) throw new Error('Solo se pueden finalizar desafíos aceptados');

    // Debe haber pasado la fecha/hora de la reserva
    const ahora = new Date();
    if (new Date(desafio.reserva.fechaHora) > ahora) {
      throw new Error('Aún no se puede finalizar: el partido no ocurrió');
    }

    // Autorización básica: cualquier jugador participante puede finalizar
    const participantes = new Set([...desafio.jugadoresCreador, ...desafio.jugadoresDesafiados].map(j => j.id));
    if (!participantes.has(solicitanteId)) {
      throw new Error('Solo participantes del desafío pueden finalizarlo');
    }

    // Parsear resultado opcional
    let golesC = null as number | null;
    let golesD = null as number | null;
    if (dto.resultado) {
      const [a, b] = dto.resultado.split('-').map(n => parseInt(n.trim(), 10));
      if (Number.isNaN(a) || Number.isNaN(b)) throw new Error('Formato de resultado inválido. Usa "3-2"');
      golesC = a; golesD = b;
    }
    // ELO: ganador vs perdedor
    const ganadores = dto.ganadorLado === 'creador' ? desafio.jugadoresCreador : desafio.jugadoresDesafiados;
    const perdedores = dto.ganadorLado === 'creador' ? desafio.jugadoresDesafiados : desafio.jugadoresCreador;

    await this.actualizarRankingEloPorLados(ganadores, perdedores /*, desafio.deporte.id*/);

    desafio.ganador = dto.ganadorLado === 'creador' ? LadoDesafio.Creador : LadoDesafio.Desafiado;
    desafio.golesCreador = golesC ?? null;
    desafio.golesDesafiado = golesD ?? null;
    desafio.estado = EstadoDesafio.Finalizado;

    // Valoración opcional
    if (dto.valoracion && dto.valoracion >= 1 && dto.valoracion <= 5) {
      if (ganadores.some(j => j.id === solicitanteId)) {
        desafio.valoracionCreador = dto.ganadorLado === 'creador' ? dto.valoracion : desafio.valoracionCreador ?? null;
        desafio.valoracionDesafiado = dto.ganadorLado === 'desafiado' ? dto.valoracion : desafio.valoracionDesafiado ?? null;
      } else {
        // si finaliza alguien del otro lado
        desafio.valoracionCreador = dto.ganadorLado === 'desafiado' ? dto.valoracion : desafio.valoracionCreador ?? null;
        desafio.valoracionDesafiado = dto.ganadorLado === 'creador' ? dto.valoracion : desafio.valoracionDesafiado ?? null;
      }
    }
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
    perdedores: Persona[],
    // deporteId?: string
  ) {
    const perfilesGanadores = await perfilRepo.find({
      where: ganadores.map(j => ({ usuario: { persona: { id: j.id } } })),
      relations: ['usuario', 'usuario.persona'],
    });
    const perfilesPerdedores = await perfilRepo.find({
      where: perdedores.map(j => ({ usuario: { persona: { id: j.id } } })),
      relations: ['usuario', 'usuario.persona'],
    });
    // crear perfiles faltantes con ELO inicial
    const faltanG = ganadores.filter(j => !perfilesGanadores.find(p => p.usuario.persona.id === j.id));
    const faltanP = perdedores.filter(j => !perfilesPerdedores.find(p => p.usuario.persona.id === j.id));

    if (faltanG.length) perfilesGanadores.push(...faltanG.map(j => perfilRepo.create({ ranking: this.ELO_INICIAL, usuario: { persona: j } as any })));
    if (faltanP.length) perfilesPerdedores.push(...faltanP.map(j => perfilRepo.create({ ranking: this.ELO_INICIAL, usuario: { persona: j } as any })));

    const rankingGanador = this.promedio(perfilesGanadores.map(p => p.ranking));
    const rankingPerdedor = this.promedio(perfilesPerdedores.map(p => p.ranking));

    const expectedG = 1 / (1 + Math.pow(10, (rankingPerdedor - rankingGanador) / 400));
    const expectedP = 1 - expectedG;

    perfilesGanadores.forEach(p => { p.ranking = Math.round(p.ranking + this.K * (1 - expectedG)); });
    perfilesPerdedores.forEach(p => { p.ranking = Math.round(p.ranking + this.K * (0 - expectedP)); });

    await perfilRepo.save([...perfilesGanadores, ...perfilesPerdedores]);
    // TODO: persistir historial ELO por partido si tenés EloHistory
  }

  private promedio(nums: number[]) {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : this.ELO_INICIAL;
  }
}