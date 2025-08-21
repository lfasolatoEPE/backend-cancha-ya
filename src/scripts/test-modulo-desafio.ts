// src/scripts/test-modulo-desafio.ts
import 'reflect-metadata';
import { AppDataSource } from '../database/data-source';
import { DesafioService } from '../modules/desafios/desafio.service';
import { Persona } from '../entities/Persona.entity';
import { Deporte } from '../entities/Deporte.entity';
import { Reserva, EstadoReserva } from '../entities/Reserva.entity';
import { Horario } from '../entities/Horario.entity';
import { Cancha } from '../entities/Cancha.entity';
import { Club } from '../entities/Club.entity';
import { DisponibilidadHorario } from '../entities/DisponibilidadHorario.entity';
import { Usuario } from '../entities/Usuario.entity';
import { Rol } from '../entities/Rol.entity';
import { PerfilCompetitivo } from '../entities/PerfilCompetitivo.entity';
import bcrypt from 'bcryptjs';

(async () => {
  await AppDataSource.initialize();
  console.log('🚀 Iniciando test módulo desafío');

  const repos = {
    persona: AppDataSource.getRepository(Persona),
    usuario: AppDataSource.getRepository(Usuario),
    rol: AppDataSource.getRepository(Rol),
    perfil: AppDataSource.getRepository(PerfilCompetitivo),
    deporte: AppDataSource.getRepository(Deporte),
    club: AppDataSource.getRepository(Club),
    cancha: AppDataSource.getRepository(Cancha),
    horario: AppDataSource.getRepository(Horario),
    disponibilidad: AppDataSource.getRepository(DisponibilidadHorario),
    reserva: AppDataSource.getRepository(Reserva)
  };

  const desafioService = new DesafioService();

  // Crear deporte
  let deporte = await repos.deporte.findOneBy({ nombre: 'f55' });
  if (!deporte) {
    deporte = await repos.deporte.save(repos.deporte.create({ nombre: 'f55' }));
  }

  // Crear personas y usuarios si no existen
  const mails = ['uno@test.com', 'dos@test.com', 'tres@test.com'];
  const personas: Persona[] = [];

  for (let i = 0; i < mails.length; i++) {
    const email = mails[i];
    let persona = await repos.persona.findOneBy({ email });

    if (!persona) {
      persona = await repos.persona.save(repos.persona.create({ nombre: `P${i}`, apellido: 'Test', email }));
      const usuario = await repos.usuario.save(repos.usuario.create({
        persona,
        rol: await repos.rol.findOneByOrFail({ nombre: 'usuario' }),
        passwordHash: await bcrypt.hash('123', 10),
        activo: true
      }));
      await repos.perfil.save(repos.perfil.create({ usuario, ranking: 1200, activo: true }));
      console.log(`👤 Creado nuevo usuario con email: ${email}`);
    } else {
      console.log(`🔁 Reutilizando persona con email: ${email}`);
    }

    personas.push(persona);
  }

  const [retador, rival1, rival2] = personas;

  // Crear club y cancha
  const club = await repos.club.save(repos.club.create({ nombre: 'Club Test', direccion: '-', telefono: '-', email: '-' }));
  const horario = await repos.horario.save(repos.horario.create({ horaInicio: '18:00', horaFin: '19:00' }));
  const cancha = await repos.cancha.save(repos.cancha.create({
    nombre: 'CanchaTest',
    ubicacion: '-',
    precioPorHora: 0,
    tipoSuperficie: '-',
    deporte,
    club,
    activa: true
  }));

  const disponibilidad = await repos.disponibilidad.save(repos.disponibilidad.create({
    cancha,
    horario,
    diaSemana: new Date().getDay()
  }));

  // Crear reserva futura
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(18, 0, 0, 0);

  const reserva = await repos.reserva.save(repos.reserva.create({
    persona: retador,
    disponibilidad,
    fechaHora: fecha,
    creadaEl: new Date(),
    estado: EstadoReserva.Confirmada
  }));

  // Crear desafío
  const desafio = await desafioService.crearDesafio({
    reservaId: reserva.id,
    deporteId: deporte.id,
    invitadosDesafiadosIds: [rival1.id, rival2.id]
  }, retador.id);
  console.log('✅ Desafío creado:', desafio.id);

  // Aceptar uno
  await desafioService.aceptarDesafio(desafio.id, rival1.id);
  console.log('✅ Rival1 aceptó');

  // Rechazar otro
  await desafioService.rechazarDesafio(desafio.id, rival2.id);
  console.log('✅ Rival2 rechazó');

  // Agregar jugador al retador
  let retador2 = await repos.persona.findOneBy({ email: 'cuatro@test.com' });
  if (!retador2) {
    retador2 = await repos.persona.save(repos.persona.create({ nombre: 'P4', apellido: 'Test', email: 'cuatro@test.com' }));
    console.log('👤 Retador2 creado');
  } else {
    console.log('🔁 Retador2 ya existía');
  }

  await desafioService.agregarJugadores(desafio.id, retador.id, { lado: 'creador', jugadoresIds: [retador2.id] });
  console.log('✅ Agregado segundo jugador al lado creador');

  // Simular partido ya jugado
  reserva.fechaHora = new Date(Date.now() - 3600 * 1000);
  await repos.reserva.save(reserva);

//   // Finalizar desafío
//   const finalizado = await desafioService.finalizarDesafio(desafio.id, retador.id, {
//     ganadorLado: 'creador',
//     resultado: '4-2',
//     valoracion: 5
//   });
//   console.log('🏁 Finalizado. Ganador:', finalizado.ganador);

  process.exit(0);
})();
