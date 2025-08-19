import { AppDataSource } from '../database/data-source';
import bcrypt from 'bcryptjs';
import { Rol } from '../entities/Rol.entity';
import { Persona } from '../entities/Persona.entity';
import { Usuario } from '../entities/Usuario.entity';
import { PerfilCompetitivo } from '../entities/PerfilCompetitivo.entity';
import { Deporte } from '../entities/Deporte.entity';
import { Horario } from '../entities/Horario.entity';
import { Club } from '../entities/Club.entity';
import { Cancha } from '../entities/Cancha.entity';
import { DisponibilidadHorario } from '../entities/DisponibilidadHorario.entity';
import { Reserva, EstadoReserva } from '../entities/Reserva.entity';
import { Desafio, EstadoDesafio } from '../entities/Desafio.entity';
import { Deuda } from '../entities/Deuda.entity';
import { Valoracion } from '../entities/Valoracion.entity';
import logger from '../utils/logger';

(async () => {
  await AppDataSource.initialize();
  logger.info('🌱 Ejecutando seed de datos iniciales...');

  const rolRepo = AppDataSource.getRepository(Rol);
  const personaRepo = AppDataSource.getRepository(Persona);
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
  const deporteRepo = AppDataSource.getRepository(Deporte);
  const horarioRepo = AppDataSource.getRepository(Horario);
  const clubRepo = AppDataSource.getRepository(Club);
  const canchaRepo = AppDataSource.getRepository(Cancha);
  const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);
  const reservaRepo = AppDataSource.getRepository(Reserva);
  const desafioRepo = AppDataSource.getRepository(Desafio);
  const deudaRepo = AppDataSource.getRepository(Deuda);
  const valoracionRepo = AppDataSource.getRepository(Valoracion);

  const roles = ['admin', 'usuario'];
  for (const nombre of roles) {
    const existe = await rolRepo.findOneBy({ nombre });
    if (!existe) await rolRepo.save(rolRepo.create({ nombre }));
  }
  logger.info('✅ Roles creados');

  const crearUsuarioConPerfil = async (nombre: string, apellido: string, email: string, password: string, rolNombre: string, ranking: number) => {
    const personaExistente = await personaRepo.findOneBy({ email });
    if (personaExistente) return;

    const persona = await personaRepo.save(personaRepo.create({ nombre, apellido, email }));
    const hash = await bcrypt.hash(password, 10);
    const rol = await rolRepo.findOneByOrFail({ nombre: rolNombre });
    const usuario = await usuarioRepo.save(usuarioRepo.create({ persona, passwordHash: hash, rol, activo: true }));
    await perfilRepo.save(perfilRepo.create({ usuario, activo: true, ranking }));
  };

  await crearUsuarioConPerfil('Admin', 'Principal', 'admin@canchaya.com', 'admin123', 'admin', 1000);
  await crearUsuarioConPerfil('Juan', 'Pérez', 'usuario@canchaya.com', 'usuario123', 'usuario', 1000);
  await crearUsuarioConPerfil('Marta', 'Gómez', 'marta@gmail.com', 'marta123', 'usuario', 1100);
  await crearUsuarioConPerfil('Pedro', 'López', 'pedro@gmail.com', 'pedro123', 'usuario', 1050);
  logger.info('👥 Usuarios y perfiles creados');

  const deportes = ['f5', 'f7', 'f11', 'padel'];
  for (const nombre of deportes) {
    const existe = await deporteRepo.findOneBy({ nombre });
    if (!existe) await deporteRepo.save(deporteRepo.create({ nombre }));
  }
  logger.info('🏅 Deportes cargados');

  for (let hora = 18; hora <= 23; hora++) {
    const horaInicio = `${hora.toString().padStart(2, '0')}:00`;
    const horaFin = `${(hora + 1).toString().padStart(2, '0')}:00`;
    const existe = await horarioRepo.findOneBy({ horaInicio });
    if (!existe) await horarioRepo.save(horarioRepo.create({ horaInicio, horaFin }));
  }
  logger.info('⏰ Horarios creados');

  let club = await clubRepo.findOneBy({ nombre: 'Club Central' });
  if (!club) club = await clubRepo.save(clubRepo.create({
    nombre: 'Club Central',
    direccion: 'Calle Falsa 123',
    telefono: '123456789',
    email: 'contacto@clubcentral.com'
  }));

  let cancha = await canchaRepo.findOneBy({ nombre: 'Cancha 1' });
  if (!cancha) {
    cancha = await canchaRepo.save(canchaRepo.create({
      nombre: 'Cancha 1',
      ubicacion: 'Zona Norte',
      tipoSuperficie: 'Sintético',
      precioPorHora: 4000,
      activa: true,
      deporte: await deporteRepo.findOneByOrFail({ nombre: 'f5' }),
      club
    }));
  }

  const horarios = await horarioRepo.find();
  for (const horario of horarios) {
    for (let dia = 0; dia < 7; dia++) {
      const existe = await disponibilidadRepo.findOne({ where: { cancha: { id: cancha.id }, horario: { id: horario.id }, diaSemana: dia } });
      if (!existe) await disponibilidadRepo.save(disponibilidadRepo.create({ cancha, horario, diaSemana: dia }));
    }
  }
  logger.info('📅 Disponibilidades creadas');

  const usuarios = await usuarioRepo.find({ where: {}, relations: ['persona'] });
  const usuario1 = usuarios.find(u => u.persona.email === 'usuario@canchaya.com');
  const usuario2 = usuarios.find(u => u.persona.email === 'pedro@gmail.com');
  const usuario3 = usuarios.find(u => u.persona.email === 'marta@gmail.com');

  const today = new Date();
  const fechas = [
    new Date(today),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
  ];
  const estados = [EstadoReserva.Pendiente, EstadoReserva.Confirmada, EstadoReserva.Cancelada];

  if (usuario1 && usuario2 && usuario3) {
    for (let i = 0; i < fechas.length; i++) {
      const fecha = fechas[i];
      const horario = horarios[i % horarios.length];
      const disponibilidad = await disponibilidadRepo.findOne({ where: { cancha: { id: cancha.id }, horario: { id: horario.id }, diaSemana: fecha.getDay() }, relations: ['cancha', 'horario'] });

      if (disponibilidad) {
        const reserva = await reservaRepo.save(reservaRepo.create({ persona: usuario1.persona, fechaHora: fecha, creadaEl: new Date(), disponibilidad, estado: estados[i] }));

        const desafio = await desafioRepo.save(desafioRepo.create({
          reserva,
          estado: i === 0 ? EstadoDesafio.Pendiente : EstadoDesafio.Finalizado,
          deporte: cancha.deporte,
          jugadoresRetador: [usuario1.persona],
          jugadoresRival: [usuario2.persona]
        }));

        await deudaRepo.save(deudaRepo.create({ persona: usuario1.persona, monto: 2500 + i * 100, pagada: i % 2 === 0 }));

        await valoracionRepo.save(valoracionRepo.create({
          persona: usuario3.persona,
          id_objetivo: usuario1.persona.id,
          tipo_objetivo: 'usuario',
          puntaje: 5 - i,
          comentario: 'Buen jugador'
        }));

        await valoracionRepo.save(valoracionRepo.create({
          persona: usuario1.persona,
          id_objetivo: cancha.id,
          tipo_objetivo: 'cancha',
          puntaje: 4,
          comentario: 'Cancha en condiciones'
        }));
      }
    }
  }

  logger.info('✅ Seed completo');
  process.exit(0);
})();

/**
 * 🔧 Este seed garantiza que el sistema esté completamente funcional desde el inicio.
 * Crea y prueba las siguientes funcionalidades:
 * 
 * ▶️ Roles:
 *   - admin
 *   - usuario
 * 
 * 👥 Usuarios y Perfiles:
 *   - Superusuario admin: admin@canchaya.com / admin123
 *   - Usuario regular: usuario@canchaya.com / usuario123
 *   - Usuarios adicionales: Marta y Pedro (ranking distinto)
 * 
 * 🏅 Deportes:
 *   - f5, f7, f11, padel
 * 
 * ⏰ Horarios:
 *   - 18:00 a 24:00 (tramos de 1h)
 * 
 * 🏢 Clubes y Canchas:
 *   - Club Central con Cancha 1 (deporte: f5)
 * 
 * 📅 Disponibilidad:
 *   - Cancha 1 disponible todos los días de la semana en todos los horarios
 * 
 * 📆 Reservas:
 *   - 3 reservas para usuario@canchaya.com en diferentes fechas y estados
 * 
 * ⚔️ Desafíos:
 *   - 3 desafíos asociados a las reservas (pendiente o finalizado), con jugadores retador y rival
 * 
 * 💸 Deudas:
 *   - Deudas generadas para las reservas (algunas pagadas, otras no)
 * 
 * ⭐ Valoraciones:
 *   - Valoración de usuario a otro usuario
 *   - Valoración de usuario a cancha
 */
