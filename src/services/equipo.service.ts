import { AppDataSource } from "../database/data-source";
import { Equipo } from "../entities/Equipo.entity";
import { Usuario } from "../entities/Usuario.entity";
import { Deporte } from "../entities/Deporte.entity";

const equipoRepo = AppDataSource.getRepository(Equipo);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const deporteRepo = AppDataSource.getRepository(Deporte);

interface CrearEquipoInput {
  nombre: string;
  deporteId: string;
  jugadoresIds: string[];
}

interface ActualizarEquipoInput {
  nombre: string;
  jugadoresIds: string[];
}

export const crearEquipo = async (dto: CrearEquipoInput) => {
  const deporte = await deporteRepo.findOneBy({ id: dto.deporteId });
  if (!deporte) throw new Error("Deporte no encontrado");

  const jugadores = await usuarioRepo.findByIds(dto.jugadoresIds || []);
  if (jugadores.length !== dto.jugadoresIds.length) {
    throw new Error("Uno o más jugadores no encontrados");
  }

  const nuevo = equipoRepo.create({
    nombre: dto.nombre,
    deporte,
    jugadores,
    ranking: 1000
  });

  return await equipoRepo.save(nuevo);
};

export const listarEquipos = async () => {
  return await equipoRepo.find({
    relations: ["deporte", "jugadores"]
  });
};

export const obtenerEquipoPorId = async (id: string) => {
  const equipo = await equipoRepo.findOne({
    where: { id },
    relations: ["deporte", "jugadores"]
  });
  if (!equipo) throw new Error("Equipo no encontrado");
  return equipo;
};

export const actualizarEquipo = async (
  id: string,
  dto: ActualizarEquipoInput
) => {
  const equipo = await obtenerEquipoPorId(id);

  const jugadores = await usuarioRepo.findByIds(dto.jugadoresIds || []);
  if (jugadores.length !== dto.jugadoresIds.length) {
    throw new Error("Uno o más jugadores no encontrados");
  }

  equipo.nombre = dto.nombre;
  equipo.jugadores = jugadores;

  return await equipoRepo.save(equipo);
};

export const eliminarEquipo = async (id: string) => {
  const equipo = await obtenerEquipoPorId(id);
  await equipoRepo.remove(equipo);
  return { mensaje: "Equipo eliminado correctamente" };
};
