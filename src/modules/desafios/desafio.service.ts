import { AppDataSource } from '../../database/data-source';
import { Desafio, EstadoDesafio } from '../../entities/Desafio.entity';
import { Deporte } from '../../entities/Deporte.entity';
import { Reserva } from '../../entities/Reserva.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Persona } from '../../entities/Persona.entity';
import { Auditoria } from '../../entities/Auditoria.entity';

const desafioRepo = AppDataSource.getRepository(Desafio);
const personaRepo = AppDataSource.getRepository(Persona);
const deporteRepo = AppDataSource.getRepository(Deporte);
const reservaRepo = AppDataSource.getRepository(Reserva);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const auditoriaRepo = AppDataSource.getRepository(Auditoria);

export class DesafioService {
  async crearDesafio(dto: {
    reservaId: string;
    deporteId: string;
    jugadoresRetador: string[];
    nombreRetador?: string;
  }) {
    const { reservaId, deporteId, jugadoresRetador, nombreRetador } = dto;

    const reserva = await reservaRepo.findOne({
      where: { id: reservaId },
      relations: ['disponibilidad', 'disponibilidad.cancha']
    });
    if (!reserva) throw new Error('Reserva no encontrada');

    const yaExiste = await desafioRepo.findOne({ where: { reserva: { id: reservaId } } });
    if (yaExiste) throw new Error('Ya hay un desafío en esta reserva');

    const deporte = await deporteRepo.findOne({ where: { id: deporteId } });
    if (!deporte) throw new Error('Deporte no encontrado');

    const jugadores = await personaRepo.findByIds(jugadoresRetador);
    if (jugadores.length !== jugadoresRetador.length)
      throw new Error('Uno o más jugadores retadores no existen');

    const desafio = desafioRepo.create({
      reserva,
      deporte,
      estado: EstadoDesafio.Pendiente,
      nombreRetador,
      jugadoresRetador: jugadores
    });

    const creado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'crear_desafio',
        descripcion: `Desafío creado (${nombreRetador ?? 'Retador'}) en cancha ${reserva.disponibilidad.cancha.nombre}`,
        entidad: 'desafio',
        entidadId: creado.id
      })
    );

    return creado;
  }

  async aceptarDesafio(desafioId: string, jugadoresRivalIds: string[], nombreRival?: string) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: ['jugadoresRetador']
    });
    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Pendiente)
      throw new Error('Solo se pueden aceptar desafíos pendientes');

    const jugadores = await personaRepo.findByIds(jugadoresRivalIds);
    if (jugadores.length !== jugadoresRivalIds.length)
      throw new Error('Uno o más jugadores rivales no existen');

    desafio.jugadoresRival = jugadores;
    desafio.nombreRival = nombreRival;
    desafio.estado = EstadoDesafio.Aceptado;

    const actualizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'aceptar_desafio',
        descripcion: `${nombreRival ?? 'Rival'} aceptó el desafío contra ${desafio.nombreRetador ?? 'Retador'}`,
        entidad: 'desafio',
        entidadId: actualizado.id
      })
    );

    return actualizado;
  }

  async cargarResultado(desafioId: string, resultado: string) {
    const desafio = await desafioRepo.findOne({
      where: { id: desafioId },
      relations: ['jugadoresRetador', 'jugadoresRival']
    });

    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado)
      throw new Error('Solo se puede cargar el resultado de desafíos aceptados');

    const [golesRetador, golesRival] = resultado.split('-').map(n => parseInt(n.trim(), 10));
    if (isNaN(golesRetador) || isNaN(golesRival))
      throw new Error('Formato de resultado inválido. Usa "3-2"');

    desafio.resultado = resultado;
    await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'cargar_resultado',
        descripcion: `Resultado cargado: ${resultado}`,
        entidad: 'desafio',
        entidadId: desafio.id
      })
    );

    return desafio;
  }

  async finalizarDesafio(id: string) {
    const desafio = await desafioRepo.findOne({
      where: { id },
      relations: [
        'jugadoresRetador',
        'jugadoresRival',
        'reserva',
        'reserva.disponibilidad',
        'reserva.disponibilidad.cancha'
      ]
    });

    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado)
      throw new Error('Solo se pueden finalizar desafíos aceptados');
    if (!desafio.resultado)
      throw new Error('Debe cargarse un resultado antes de finalizar el desafío');

    const [golesRetador, golesRival] = desafio.resultado
      .split('-')
      .map(n => parseInt(n.trim(), 10));

    if (golesRetador !== golesRival) {
      const ganadores = golesRetador > golesRival ? desafio.jugadoresRetador : desafio.jugadoresRival!;
      const perdedores = golesRetador < golesRival ? desafio.jugadoresRetador : desafio.jugadoresRival!;
      await this.actualizarRankingEloPorJugadores(ganadores, perdedores);
    }

    desafio.estado = EstadoDesafio.Finalizado;
    const finalizado = await desafioRepo.save(desafio);

    await auditoriaRepo.save(
      auditoriaRepo.create({
        accion: 'finalizar_desafio',
        descripcion: `Desafío finalizado en cancha ${desafio.reserva.disponibilidad.cancha.nombre} con resultado ${desafio.resultado}`,
        entidad: 'desafio',
        entidadId: desafio.id
      })
    );

    return finalizado;
  }

  async listarDesafios(filtros: any) {
    const { estado, deporteId, jugadorId } = filtros;

    const query = desafioRepo
      .createQueryBuilder('desafio')
      .leftJoinAndSelect('desafio.deporte', 'deporte')
      .leftJoinAndSelect('desafio.reserva', 'reserva')
      .leftJoinAndSelect('reserva.disponibilidad', 'disponibilidad')
      .leftJoinAndSelect('disponibilidad.cancha', 'cancha')
      .leftJoinAndSelect('desafio.jugadoresRetador', 'jugadorRetador')
      .leftJoinAndSelect('desafio.jugadoresRival', 'jugadorRival');

    if (estado) query.andWhere('desafio.estado = :estado', { estado });
    if (deporteId) query.andWhere('desafio.deporte = :deporteId', { deporteId });
    if (jugadorId) {
      query.andWhere(
        '(jugadorRetador.id = :jugadorId OR jugadorRival.id = :jugadorId)',
        { jugadorId }
      );
    }

    return await query.getMany();
  }

  private async actualizarRankingEloPorJugadores(
    jugadoresGanador: Persona[],
    jugadoresPerdedor: Persona[]
  ) {
    const k = 32;

    const perfilesGanadores = await perfilRepo.find({
      where: jugadoresGanador.map(j => ({ usuario: { persona: { id: j.id } } })),
      relations: ['usuario', 'usuario.persona']
    });

    const perfilesPerdedores = await perfilRepo.find({
      where: jugadoresPerdedor.map(j => ({ usuario: { persona: { id: j.id } } })),
      relations: ['usuario', 'usuario.persona']
    });

    const rankingGanador = this.promedio(perfilesGanadores.map(p => p.ranking));
    const rankingPerdedor = this.promedio(perfilesPerdedores.map(p => p.ranking));

    const expectedGanador = 1 / (1 + Math.pow(10, (rankingPerdedor - rankingGanador) / 400));
    const expectedPerdedor = 1 - expectedGanador;

    perfilesGanadores.forEach(perfil => {
      perfil.ranking = Math.round(perfil.ranking + k * (1 - expectedGanador));
    });

    perfilesPerdedores.forEach(perfil => {
      perfil.ranking = Math.round(perfil.ranking + k * (0 - expectedPerdedor));
    });

    await perfilRepo.save([...perfilesGanadores, ...perfilesPerdedores]);
  }

  private promedio(numeros: number[]): number {
    return numeros.reduce((acc, n) => acc + n, 0) / numeros.length;
  }
}
