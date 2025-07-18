import { AppDataSource } from '../../database/data-source';
import { Desafio, EstadoDesafio } from '../../entities/Desafio.entity';
import { Equipo } from '../../entities/Equipo.entity';
import { Deporte } from '../../entities/Deporte.entity';
import { Reserva } from '../../entities/Reserva.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Persona } from '../../entities/Persona.entity';

const desafioRepo = AppDataSource.getRepository(Desafio);
const equipoRepo = AppDataSource.getRepository(Equipo);
const deporteRepo = AppDataSource.getRepository(Deporte);
const reservaRepo = AppDataSource.getRepository(Reserva);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);

export class DesafioService {
  async crearDesafio(dto: { reservaId: string; equipoRetadorId: string; deporteId: string }) {
    const { reservaId, equipoRetadorId, deporteId } = dto;

    const reserva = await reservaRepo.findOne({ where: { id: reservaId } });
    if (!reserva) throw new Error('Reserva no encontrada');

    const yaExiste = await desafioRepo.findOne({ where: { reserva: { id: reservaId } } });
    if (yaExiste) throw new Error('Ya hay un desafío en esta reserva');

    const equipoRetador = await equipoRepo.findOne({ where: { id: equipoRetadorId } });
    if (!equipoRetador) throw new Error('Equipo retador no encontrado');

    const deporte = await deporteRepo.findOne({ where: { id: deporteId } });
    if (!deporte) throw new Error('Deporte no encontrado');

    const desafio = desafioRepo.create({
      reserva,
      equipoRetador,
      deporte,
      estado: EstadoDesafio.Pendiente
    });

    return await desafioRepo.save(desafio);
  }

  async aceptarDesafio(desafioId: string, equipoRivalId: string) {
    const desafio = await desafioRepo.findOne({ where: { id: desafioId } });
    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Pendiente)
      throw new Error('Solo se pueden aceptar desafíos pendientes');

    const equipoRival = await equipoRepo.findOne({ where: { id: equipoRivalId } });
    if (!equipoRival) throw new Error('Equipo rival no encontrado');

    desafio.equipoRival = equipoRival;
    desafio.estado = EstadoDesafio.Aceptado;

    return await desafioRepo.save(desafio);
  }

  async finalizarDesafio(id: string, resultado: string) {
    const desafio = await desafioRepo.findOne({
      where: { id },
      relations: ['equipoRetador', 'equipoRival']
    });

    if (!desafio) throw new Error('Desafío no encontrado');
    if (desafio.estado !== EstadoDesafio.Aceptado)
      throw new Error('Solo se pueden finalizar desafíos aceptados');

    if (!desafio.equipoRival)
      throw new Error('El desafío no tiene rival');

    const [golesRetador, golesRival] = resultado
      .split('-')
      .map(n => parseInt(n.trim(), 10));

    if (isNaN(golesRetador) || isNaN(golesRival))
      throw new Error('Formato de resultado inválido. Usa "3-2"');

    desafio.resultado = resultado;
    desafio.estado = EstadoDesafio.Finalizado;

    // actualizar ranking ELO
    if (golesRetador !== golesRival) {
      const ganador = golesRetador > golesRival ? desafio.equipoRetador : desafio.equipoRival!;
      const perdedor = golesRetador < golesRival ? desafio.equipoRetador : desafio.equipoRival!;
      await this.actualizarRankingElo(ganador, perdedor); // equipo
      await this.actualizarRankingEloPorJugadores(ganador.jugadores, perdedor.jugadores);
    }

    return await desafioRepo.save(desafio);
  }

  async listarDesafios(filtros: any) {
    const { estado, deporteId, equipoId, jugadorId } = filtros;

    const query = desafioRepo
      .createQueryBuilder('desafio')
      .leftJoinAndSelect('desafio.equipoRetador', 'equipoRetador')
      .leftJoinAndSelect('desafio.equipoRival', 'equipoRival')
      .leftJoinAndSelect('desafio.deporte', 'deporte')
      .leftJoinAndSelect('desafio.reserva', 'reserva')
      .leftJoinAndSelect('equipoRetador.jugadores', 'jugadorRetador')
      .leftJoinAndSelect('equipoRival.jugadores', 'jugadorRival');

    if (estado) query.andWhere('desafio.estado = :estado', { estado });
    if (deporteId) query.andWhere('desafio.deporte = :deporteId', { deporteId });
    if (equipoId) {
      query.andWhere(
        '(desafio.equipoRetador = :equipoId OR desafio.equipoRival = :equipoId)',
        { equipoId }
      );
    }
    if (jugadorId) {
      query.andWhere(
        '(jugadorRetador.id = :jugadorId OR jugadorRival.id = :jugadorId)',
        { jugadorId }
      );
    }

    return await query.getMany();
  }

  private async actualizarRankingElo(ganador: Equipo, perdedor: Equipo) {
    const k = 32;
    const expectedGanador =
      1 / (1 + Math.pow(10, (perdedor.ranking - ganador.ranking) / 400));
    const expectedPerdedor = 1 - expectedGanador;

    ganador.ranking = Math.round(ganador.ranking + k * (1 - expectedGanador));
    perdedor.ranking = Math.round(perdedor.ranking + k * (0 - expectedPerdedor));

    if (ganador.ranking < 0) ganador.ranking = 0;
    if (perdedor.ranking < 0) perdedor.ranking = 0;

    await equipoRepo.save([ganador, perdedor]);
  }

  private async actualizarRankingEloPorJugadores(
    jugadoresGanador: Persona[],
    jugadoresPerdedor: Persona[]
  ) {
    const k = 32;

    // Traer perfiles de todos los jugadores
    const perfilesGanadores = await perfilRepo.find({
      where: jugadoresGanador.map(j => ({ usuario: { persona: { id: j.id } } })),
      relations: ['usuario', 'usuario.persona']
    });

    const perfilesPerdedores = await perfilRepo.find({
      where: jugadoresPerdedor.map(j => ({ usuario: { persona: { id: j.id } } })),
      relations: ['usuario', 'usuario.persona']
    });

    // Ranking promedio por equipo
    const rankingGanador = this.promedio(perfilesGanadores.map(p => p.ranking));
    const rankingPerdedor = this.promedio(perfilesPerdedores.map(p => p.ranking));

    const expectedGanador = 1 / (1 + Math.pow(10, (rankingPerdedor - rankingGanador) / 400));
    const expectedPerdedor = 1 - expectedGanador;

    // Actualizar ranking de cada jugador
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
