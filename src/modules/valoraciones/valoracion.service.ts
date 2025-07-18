import { AppDataSource } from '../../database/data-source';
import { Valoracion } from '../../entities/Valoracion.entity';
import { Persona } from '../../entities/Persona.entity';

const valoracionRepo = AppDataSource.getRepository(Valoracion);
const personaRepo = AppDataSource.getRepository(Persona);

export class ValoracionService {
  async crearValoracion(personaId: string, dto: {
    tipo_objetivo: 'club' | 'cancha' | 'usuario' | 'equipo';
    id_objetivo: string;
    puntaje: number;
    comentario?: string;
  }) {
    const persona = await personaRepo.findOne({ where: { id: personaId } });
    if (!persona) throw new Error('Persona no encontrada');

    const valoracion = valoracionRepo.create({
      tipo_objetivo: dto.tipo_objetivo,
      id_objetivo: dto.id_objetivo,
      puntaje: dto.puntaje,
      comentario: dto.comentario,
      persona
    });

    return await valoracionRepo.save(valoracion);
  }

  async listarValoraciones() {
    return await valoracionRepo.find({ relations: ['persona'] });
  }

  async obtenerValoracionPorId(id: string) {
    const valoracion = await valoracionRepo.findOne({
      where: { id },
      relations: ['persona']
    });
    if (!valoracion) throw new Error('Valoración no encontrada');
    return valoracion;
  }

  async eliminarValoracion(id: string) {
    const valoracion = await this.obtenerValoracionPorId(id);
    await valoracionRepo.remove(valoracion);
  }
}
