import { AppDataSource } from "../database/data-source";
import { DisponibilidadJugador } from "../entities/DisponibilidadPersona.entity";
import { Usuario } from "../entities/Usuario.entity";
import { Club } from "../entities/Club.entity";
import { Deporte } from "../entities/Deporte.entity";

const repo = AppDataSource.getRepository(DisponibilidadJugador);

export const crearDisponibilidad = async (data: {
  usuarioId: string;
  fechaDesde: Date;
  fechaHasta: Date;
  horaDesde: string;
  horaHasta: string;
  clubesIds: string[];
  deporteId: string;
}) => {
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const clubRepo = AppDataSource.getRepository(Club);
  const deporteRepo = AppDataSource.getRepository(Deporte);
  const dispoRepo = AppDataSource.getRepository(DisponibilidadJugador);

  const usuario = await usuarioRepo.findOneByOrFail({ id: data.usuarioId });
  const clubes = await clubRepo.findByIds(data.clubesIds);
  const deporte = await deporteRepo.findOneByOrFail({ id: data.deporteId });

  const disponibilidad = dispoRepo.create({
    usuario,
    clubes,
    deporte,
    fechaDesde: data.fechaDesde,
    fechaHasta: data.fechaHasta,
    horaDesde: data.horaDesde,
    horaHasta: data.horaHasta
  });

  return dispoRepo.save(disponibilidad);
};


export const obtenerDisponibilidades = () => {
  return repo.find();
};

export const eliminarDisponibilidad = async (id: string) => {
  await repo.delete(id);
};
