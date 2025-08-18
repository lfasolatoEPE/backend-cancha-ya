import { AppDataSource } from '../../database/data-source';
import { Usuario } from '../../entities/Usuario.entity';
import { Reserva } from '../../entities/Reserva.entity';
import { Cancha } from '../../entities/Cancha.entity';
import { Deuda } from '../../entities/Deuda.entity';
import { PerfilCompetitivo } from '../../entities/PerfilCompetitivo.entity';
import { Persona } from '../../entities/Persona.entity';

const usuarioRepo = AppDataSource.getRepository(Usuario);
const reservaRepo = AppDataSource.getRepository(Reserva);
const canchaRepo = AppDataSource.getRepository(Cancha);
const deudaRepo = AppDataSource.getRepository(Deuda);
const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
const personaRepo = AppDataSource.getRepository(Persona);

export class AdminService {
  async obtenerResumenGeneral() {
    const totalUsuarios = await usuarioRepo.count();
    const totalReservas = await reservaRepo.count();
    const totalCanchas = await canchaRepo.count();
    const totalDeuda = await deudaRepo
      .createQueryBuilder('deuda')
      .select('SUM(deuda.monto)', 'total')
      .where('deuda.pagada = false')
      .getRawOne();

    return {
      totalUsuarios,
      totalReservas,
      totalCanchas,
      deudaTotalPendiente: parseFloat(totalDeuda.total || '0')
    };
  }

  async obtenerTopJugadores() {
    const perfiles = await perfilRepo.find({
      relations: ['usuario', 'usuario.persona'],
      order: { ranking: 'DESC' },
      take: 10
    });

    return perfiles.map(p => ({
      personaId: p.usuario.persona.id,
      nombre: p.usuario.persona.nombre,
      email: p.usuario.persona.email,
      ranking: p.ranking
    }));
  }

  async obtenerCanchasMasUsadas() {
    const result = await reservaRepo
      .createQueryBuilder('reserva')
      .leftJoin('reserva.disponibilidad', 'disponibilidad')
      .leftJoin('disponibilidad.cancha', 'cancha')
      .select('cancha.id', 'canchaId')
      .addSelect('cancha.nombre', 'nombre')
      .addSelect('COUNT(reserva.id)', 'totalReservas')
      .groupBy('cancha.id')
      .orderBy('totalReservas', 'DESC')
      .limit(5)
      .getRawMany();

    return result;
  }

  async obtenerPersonasConDeuda() {
    const personas = await deudaRepo
      .createQueryBuilder('deuda')
      .leftJoinAndSelect('deuda.persona', 'persona')
      .select('persona.id', 'personaId')
      .addSelect('persona.nombre', 'nombre')
      .addSelect('persona.email', 'email')
      .addSelect('SUM(deuda.monto)', 'totalDeuda')
      .where('deuda.pagada = false')
      .groupBy('persona.id')
      .orderBy('totalDeuda', 'DESC')
      .getRawMany();

    return personas;
  }
}
