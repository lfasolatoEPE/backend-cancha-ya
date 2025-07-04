import { AppDataSource } from '../database/data-source';
import { Desafio } from '../entities/Desafio.entity';
import { Equipo } from '../entities/Equipo.entity';
import { Deporte } from '../entities/Deporte.entity';

const desafioRepo = AppDataSource.getRepository(Desafio);
const equipoRepo = AppDataSource.getRepository(Equipo);
const deporteRepo = AppDataSource.getRepository(Deporte);

interface CrearDesafioDto {
  equipoRetadorId: string;
  deporteId: string;
  fecha: string;
  hora: string;
}

export const crearDesafio = async (dto: CrearDesafioDto) => {
  const { equipoRetadorId, deporteId, fecha, hora } = dto;

  const equipoRetador = await equipoRepo.findOneBy({ id: equipoRetadorId });
  if (!equipoRetador) throw new Error('Equipo retador no encontrado');

  const deporte = await deporteRepo.findOneBy({ id: deporteId });
  if (!deporte) throw new Error('Deporte no encontrado');

  const nuevo = desafioRepo.create({
    equipoRetador,
    deporte,
    fecha,
    hora,
    estado: 'pendiente'
  });

  return await desafioRepo.save(nuevo);
};

export const aceptarDesafio = async (desafioId: string, equipoRivalId: string) => {
  const desafio = await desafioRepo.findOneBy({ id: desafioId });
  if (!desafio) throw new Error('Desafío no encontrado');
  if (desafio.estado !== 'pendiente') throw new Error('El desafío no puede aceptarse');

  const equipoRival = await equipoRepo.findOneBy({ id: equipoRivalId });
  if (!equipoRival) throw new Error('Equipo rival no encontrado');

  desafio.equipoRival = equipoRival;
  desafio.estado = 'aceptado';
  return await desafioRepo.save(desafio);
};

export const finalizarDesafio = async (
  desafioId: string,
  resultado: string
) => {
  const desafio = await desafioRepo.findOne({
    where: { id: desafioId },
    relations: ['equipoRetador', 'equipoRival']
  });

  if (!desafio) throw new Error('Desafío no encontrado');
  if (desafio.estado !== 'aceptado')
    throw new Error('El desafío no está aceptado');

  if (!desafio.equipoRival)
    throw new Error('El desafío no tiene rival asignado');

  // Marcar como finalizado
  desafio.resultado = resultado;
  desafio.estado = 'finalizado';

  // Determinar ganador (supongamos que resultado es "3-1")
  const [golesRetador, golesRival] = resultado
    .split('-')
    .map((n) => parseInt(n.trim(), 10));

  if (isNaN(golesRetador) || isNaN(golesRival))
    throw new Error('Formato de resultado inválido (ej: "3-2")');

  const retador = desafio.equipoRetador;
  const rival = desafio.equipoRival;

  let ganador: 'retador' | 'rival' | 'empate';
  if (golesRetador > golesRival) ganador = 'retador';
  else if (golesRival > golesRetador) ganador = 'rival';
  else ganador = 'empate';

  // Actualizar ranking según lógica
  if (ganador !== 'empate') {
    const equipoGanador = ganador === 'retador' ? retador : rival;
    const equipoPerdedor = ganador === 'retador' ? rival : retador;

    const diferencia = equipoGanador.ranking - equipoPerdedor.ranking;

    if (diferencia >= 100) {
      equipoGanador.ranking += 15;
      equipoPerdedor.ranking -= 5;
    } else {
      equipoGanador.ranking += 25;
      equipoPerdedor.ranking -= 15;
    }

    await equipoRepo.save(equipoGanador);
    await equipoRepo.save(equipoPerdedor);
  }

  return await desafioRepo.save(desafio);
};


export const listarDesafios = async (filtros: {
  estado?: string;
  deporteId?: string;
  equipoId?: string;
  jugadorId?: string;
  fecha?: string;
}) => {
  const query = desafioRepo
    .createQueryBuilder('desafio')
    .leftJoinAndSelect('desafio.equipoRetador', 'equipoRetador')
    .leftJoinAndSelect('desafio.equipoRival', 'equipoRival')
    .leftJoinAndSelect('desafio.deporte', 'deporte')
    .leftJoinAndSelect('equipoRetador.jugadores', 'jugadorRetador')
    .leftJoinAndSelect('equipoRival.jugadores', 'jugadorRival');

  const { estado, deporteId, equipoId, jugadorId, fecha } = filtros;

  if (estado) {
    query.andWhere('desafio.estado = :estado', { estado });
  }

  if (deporteId) {
    query.andWhere('desafio.deporte = :deporteId', { deporteId });
  }

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

  if (fecha) {
    query.andWhere('desafio.fecha = :fecha', { fecha });
  }

  return await query.getMany();
};
