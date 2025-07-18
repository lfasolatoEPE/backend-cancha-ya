import { AppDataSource } from '../../database/data-source';
import { Deuda } from '../../entities/Deuda.entity';
import { Persona } from '../../entities/Persona.entity';

const deudaRepo = AppDataSource.getRepository(Deuda);
const personaRepo = AppDataSource.getRepository(Persona);

export class DeudaService {
  async crear(data: { personaId: string; monto: number; fechaVencimiento?: string }) {
    const persona = await personaRepo.findOne({ where: { id: data.personaId } });
    if (!persona) throw new Error('Persona no encontrada');

    const deuda = deudaRepo.create({
      persona,
      monto: data.monto,
      fechaVencimiento: data.fechaVencimiento
    });

    return await deudaRepo.save(deuda);
  }

  async listar(personaId?: string) {
    if (personaId) {
      return await deudaRepo.find({
        where: { persona: { id: personaId } },
        order: { fechaVencimiento: 'ASC' }
      });
    }

    return await deudaRepo.find({ order: { fechaVencimiento: 'ASC' } });
  }

  async marcarPagada(id: string) {
    const deuda = await deudaRepo.findOneBy({ id });
    if (!deuda) throw new Error('Deuda no encontrada');

    deuda.pagada = true;
    return await deudaRepo.save(deuda);
  }

  async eliminar(id: string) {
    const deuda = await deudaRepo.findOneBy({ id });
    if (!deuda) throw new Error('Deuda no encontrada');

    await deudaRepo.remove(deuda);
  }
}
