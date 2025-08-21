// src/scripts/crear-desafio-demo.ts
import { AppDataSource } from '../database/data-source';
import { Rol } from '../entities/Rol.entity';
import { Persona } from '../entities/Persona.entity';
import { Usuario } from '../entities/Usuario.entity';
import { Desafio } from '../entities/Desafio.entity';
import { PerfilCompetitivo } from '../entities/PerfilCompetitivo.entity';
import { Deporte } from '../entities/Deporte.entity';
import { Club } from '../entities/Club.entity';
import { Cancha } from '../entities/Cancha.entity';
import { Horario } from '../entities/Horario.entity';
import { DisponibilidadHorario } from '../entities/DisponibilidadHorario.entity';
import { Reserva, EstadoReserva } from '../entities/Reserva.entity';
import { DesafioService } from '../modules/desafios/desafio.service';
import bcrypt from 'bcryptjs';

(async () => {
  await AppDataSource.initialize();
  console.log('🚀 Ejecutando script para crear demo de desafío completo');

  const rolRepo = AppDataSource.getRepository(Rol);
  const personaRepo = AppDataSource.getRepository(Persona);
  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const perfilRepo = AppDataSource.getRepository(PerfilCompetitivo);
  const deporteRepo = AppDataSource.getRepository(Deporte);
  const clubRepo = AppDataSource.getRepository(Club);
  const canchaRepo = AppDataSource.getRepository(Cancha);
  const horarioRepo = AppDataSource.getRepository(Horario);
  const disponibilidadRepo = AppDataSource.getRepository(DisponibilidadHorario);
  const reservaRepo = AppDataSource.getRepository(Reserva);
  const desafioRepo = AppDataSource.getRepository(Desafio);

  const desafioService = new DesafioService();

  // 1. Crear deporte
  const deporteNombre = 'f5';
  let deporte = await deporteRepo.findOneBy({ nombre: deporteNombre });
  if (!deporte) {
    deporte = await deporteRepo.save(deporteRepo.create({ nombre: deporteNombre }));
    console.log('⚽ Deporte creado');
  }

  // 2. Crear personas y usuarios
  const mails = ['canchaya.uai@gmail.com', 'lfasolato.epe@gmail.com', 'invitado2@demo.com'];
  const personas: Persona[] = [];

  for (let i = 0; i < mails.length; i++) {
    const email = mails[i];
    let persona = await personaRepo.findOneBy({ email });
    if (!persona) {
      persona = await personaRepo.save(personaRepo.create({
        nombre: `Persona${i + 1}`,
        apellido: 'Demo',
        email
      }));
      const usuario = await usuarioRepo.save(usuarioRepo.create({
        persona,
        rol: await rolRepo.findOneByOrFail({ nombre: 'usuario' }),
        passwordHash: await bcrypt.hash('test123', 10),
        activo: true
      }));
      await perfilRepo.save(perfilRepo.create({ usuario, activo: true, ranking: 1000 }));
      console.log(`👤 Usuario ${email} creado`);
    } else {
      console.log(`🔁 Usuario ${email} ya existe`);
    }
    personas.push(persona);
  }

  const [lucas, invitado1, invitado2] = personas;

  // 3. Club
  let club = await clubRepo.findOneBy({ nombre: 'Club Prueba' });
  if (!club) {
    club = await clubRepo.save(clubRepo.create({
      nombre: 'Club Prueba',
      direccion: 'Falsa 456',
      telefono: '123456',
      email: 'club@prueba.com'
    }));
    console.log('🏟️ Club creado');
  }

  // 4. Horario
  const horaInicio = '20:00';
  let horario = await horarioRepo.findOneBy({ horaInicio });
  if (!horario) {
    horario = await horarioRepo.save(horarioRepo.create({
      horaInicio,
      horaFin: '21:00'
    }));
    console.log('⏰ Horario creado');
  }

  // 5. Cancha
  let cancha = await canchaRepo.findOneBy({ nombre: 'Cancha Test' });
  if (!cancha) {
    cancha = await canchaRepo.save(canchaRepo.create({
      nombre: 'Cancha Test',
      ubicacion: 'Zona Sur',
      tipoSuperficie: 'Sintético',
      precioPorHora: 3000,
      activa: true,
      deporte,
      club
    }));
    console.log('🏐 Cancha creada');
  }

  // 6. Disponibilidad
  const diaSemana = new Date().getDay();
  let disponibilidad = await disponibilidadRepo.findOne({
    where: {
      cancha: { id: cancha.id },
      horario: { id: horario.id },
      diaSemana
    },
    relations: ['cancha', 'horario']
  });
  if (!disponibilidad) {
    disponibilidad = await disponibilidadRepo.save(disponibilidadRepo.create({
      cancha,
      horario,
      diaSemana
    }));
    console.log('📅 Disponibilidad creada');
  }

  // 7. Reserva
  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 2);
  fechaFutura.setHours(20, 0, 0, 0);

  let reserva = await reservaRepo.findOne({
    where: {
      persona: { id: lucas.id },
      disponibilidad: { id: disponibilidad.id },
      fechaHora: fechaFutura
    },
    relations: ['disponibilidad', 'persona']
  });

  if (!reserva) {
    reserva = await reservaRepo.save(reservaRepo.create({
      persona: lucas,
      disponibilidad,
      fechaHora: fechaFutura,
      creadaEl: new Date(),
      estado: EstadoReserva.Confirmada
    }));
    console.log('📌 Reserva creada');
  } else {
    console.log('🔁 Reserva ya existente');
  }

  // 8. Crear desafío
  try {
    const desafioExistente = await desafioRepo.findOne({ where: { reserva: { id: reserva.id } } });
    if (desafioExistente) {
        console.log('🗑️ Eliminando desafío existente para recrearlo');
        await desafioRepo.remove(desafioExistente);
    }
    const desafio = await desafioService.crearDesafio({
      reservaId: reserva.id,
      deporteId: deporte.id,
      invitadosDesafiadosIds: [invitado1.id, invitado2.id],
      jugadoresCreadorIds: [] // creador se agrega solo
    }, lucas.id);
    console.log('✅ Desafío creado con ID:', desafio.id);
  } catch (err: any) {
    console.log('⚠️ No se creó el desafío:', err.message);
  }

  process.exit(0);
})();
