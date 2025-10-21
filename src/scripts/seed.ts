// src/scripts/seed.ts
import 'dotenv/config';
import { AppDataSource } from '../database/data-source';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

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
import { Desafio, EstadoDesafio, LadoDesafio } from '../entities/Desafio.entity';
import { Deuda } from '../entities/Deuda.entity';
import { Valoracion } from '../entities/Valoracion.entity';
import { isDuplicateError, normEmail } from '../utils/db';

async function upsertRol(nombre: 'admin'|'usuario') {
  const repo = AppDataSource.getRepository(Rol);
  let r = await repo.findOne({ where: { nombre } });
  if (!r) {
    r = repo.create({ nombre });
    await repo.save(r);
    console.log(`🆕 Rol: ${nombre}`);
  } else {
    console.log(`✔️ Rol existe: ${nombre}`);
  }
  return r;
}

async function upsertPersona(nombre: string, apellido: string, emailRaw: string) {
  const repo = AppDataSource.getRepository(Persona);
  const email = normEmail(emailRaw);
  let p = await repo.findOne({ where: { email } });
  if (!p) {
    p = repo.create({ nombre, apellido, email });
    await repo.save(p);
    console.log(`👤 Persona: ${email}`);
  } else {
    console.log(`👤 Persona existe: ${email}`);
  }
  return p;
}

async function upsertUsuarioConPerfil(
  persona: Persona,
  password: string,
  rolNombre: 'admin' | 'usuario',
  ranking = 1000
) {
  return await AppDataSource.transaction(async (manager) => {
    const usuarioRepo = manager.getRepository(Usuario);
    const rolRepo = manager.getRepository(Rol);
    const perfilRepo = manager.getRepository(PerfilCompetitivo);

    const rol = await rolRepo.findOne({ where: { nombre: rolNombre } });
    if (!rol) throw new Error(`Rol ${rolNombre} no existe (seed roles primero)`);

    let usuario = await usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('u.rol', 'r')
      .where('p.id = :pid', { pid: persona.id })
      .getOne();

    const passwordHash = await bcrypt.hash(password, 12);

    if (!usuario) {
      usuario = usuarioRepo.create({
        persona,
        passwordHash,
        rol,
        activo: true,
        failedLoginAttempts: 0,
        lastLoginAt: null,
      });
      await usuarioRepo.save(usuario);
      console.log(`🆕 Usuario: ${persona.email} (rol=${rolNombre})`);
    } else {
      usuario.passwordHash = passwordHash;
      usuario.rol = rol;
      await usuarioRepo.save(usuario);
      console.log(`♻️ Usuario actualizado: ${persona.email} (rol=${rolNombre})`);
    }

    let perfil = await perfilRepo.findOne({ where: { usuario: { id: usuario.id } } as any });
    if (!perfil) {
      perfil = perfilRepo.create({ usuario, activo: true, ranking });
      await perfilRepo.save(perfil);
      console.log(`📈 Perfil creado: ${persona.email} (ranking=${ranking})`);
    }
    return usuario;
  }).catch((err) => {
    if (isDuplicateError(err)) {
      console.warn(`⚠️ Duplicado detectado (usuario/perfil): ${persona.email}`);
      return AppDataSource.getRepository(Usuario).findOne({
        where: { persona: { id: persona.id } },
        relations: ['persona', 'rol'],
      });
    }
    throw err;
  });
}

async function upsertDeporte(nombre: string) {
  const repo = AppDataSource.getRepository(Deporte);
  let d = await repo.findOne({ where: { nombre } });
  if (!d) {
    d = repo.create({ nombre });
    await repo.save(d);
    console.log(`🏅 Deporte: ${nombre}`);
  }
  return d;
}

async function upsertHorario(horaInicio: string, horaFin: string) {
  const repo = AppDataSource.getRepository(Horario);
  let h = await repo.findOne({ where: { horaInicio } });
  if (!h) {
    h = repo.create({ horaInicio, horaFin });
    await repo.save(h);
    console.log(`⏰ Horario: ${horaInicio}-${horaFin}`);
  }
  return h;
}

async function upsertClub(nombre: string, data: Partial<Club>) {
  const repo = AppDataSource.getRepository(Club);
  let c = await repo.findOne({ where: { nombre } });
  if (!c) {
    c = repo.create({ nombre, ...data });
    await repo.save(c);
    console.log(`🏟️ Club: ${nombre}`);
  }
  return c;
}

async function upsertCancha(nombre: string, data: Partial<Cancha>) {
  const repo = AppDataSource.getRepository(Cancha);
  let c = await repo.findOne({ where: { nombre } });
  if (!c) {
    c = repo.create({ nombre, ...data });
    await repo.save(c);
    console.log(`🟩 Cancha: ${nombre}`);
  }
  return c;
}

async function upsertDisponibilidad(cancha: Cancha, horario: Horario, diaSemana: number) {
  const repo = AppDataSource.getRepository(DisponibilidadHorario);
  let d = await repo.findOne({ where: { cancha: { id: cancha.id }, horario: { id: horario.id }, diaSemana } });
  if (!d) {
    d = repo.create({ cancha, horario, diaSemana, disponible: true as any });
    await repo.save(d);
  }
  return d;
}

(async () => {
  await AppDataSource.initialize();
  console.log('🌱 Ejecutando seed de datos iniciales...');

  // Roles
  await upsertRol('admin');
  await upsertRol('usuario');

  // Usuarios + Perfiles
  const adminP = await upsertPersona('Admin', 'Principal', 'admin@canchaya.com');
  await upsertUsuarioConPerfil(adminP, 'admin123', 'admin', 1000);

  const u1P = await upsertPersona('Juan', 'Pérez', 'usuario@canchaya.com');
  await upsertUsuarioConPerfil(u1P, 'usuario123', 'usuario', 1000);

  const martaP = await upsertPersona('Marta', 'Gómez', 'marta@gmail.com');
  await upsertUsuarioConPerfil(martaP, 'marta123', 'usuario', 1100);

  const pedroP = await upsertPersona('Pedro', 'López', 'pedro@gmail.com');
  await upsertUsuarioConPerfil(pedroP, 'pedro123', 'usuario', 1050);

  // Deporte
  const dF5  = await upsertDeporte('f5');
  await upsertDeporte('f7');
  await upsertDeporte('f11');
  await upsertDeporte('padel');

  // Horarios (18..23)
  const horarios: Horario[] = [];
  for (let hora = 18; hora <= 23; hora++) {
    const hi = `${String(hora).padStart(2, '0')}:00`;
    const hf = `${String(hora + 1).padStart(2, '0')}:00`;
    horarios.push(await upsertHorario(hi, hf));
  }

  // Club + Cancha
  const club = await upsertClub('Club Central', {
    direccion: 'Calle Falsa 123',
    telefono: '123456789',
    email: 'contacto@clubcentral.com',
  });

  const cancha = await upsertCancha('Cancha 1', {
    ubicacion: 'Zona Norte',
    tipoSuperficie: 'Sintético',
    precioPorHora: 4000 as any,
    activa: true,
    deporte: dF5,
    club,
  });

  // Disponibilidades completas (todos los días x todos los horarios)
  for (const h of horarios) {
    for (let dia = 0; dia < 7; dia++) {
      await upsertDisponibilidad(cancha, h, dia);
    }
  }
  console.log('📅 Disponibilidades listas');

// ---------- Helpers de Reserva/Desafío/Deuda/Valoración ----------

// repos
const personaRepo = AppDataSource.getRepository(Persona);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const dispoRepo   = AppDataSource.getRepository(DisponibilidadHorario);
const reservaRepo = AppDataSource.getRepository(Reserva);
const desafioRepo = AppDataSource.getRepository(Desafio);
const deudaRepo   = AppDataSource.getRepository(Deuda);
const valorRepo   = AppDataSource.getRepository(Valoracion);

// obtiene DisponibilidadHorario por fecha (día de semana) y horaInicio (HH:mm)
async function getDisponibilidadParaFechaYHora(canchaId: string, fecha: Date, horaInicio: string) {
  const dia = fecha.getDay(); // 0..6 (dom..sab)
  return await dispoRepo.createQueryBuilder('d')
    .leftJoinAndSelect('d.cancha', 'c')
    .leftJoinAndSelect('d.horario', 'h')
    .where('c.id = :canchaId', { canchaId })
    .andWhere('d.diaSemana = :dia', { dia })
    .andWhere('h.horaInicio = :hi', { hi: horaInicio })
    .getOne();
}

async function upsertReserva(persona: Persona, disponibilidad: DisponibilidadHorario, fecha: Date, estado: EstadoReserva) {
  let r = await reservaRepo.findOne({ where: { disponibilidad: { id: disponibilidad.id }, fechaHora: fecha } as any });
  if (!r) {
    r = reservaRepo.create({
      persona,
      disponibilidad,
      fechaHora: fecha,
      creadaEl: new Date(),
      estado,
    });
    await reservaRepo.save(r);
    console.log(`🎫 Reserva ${estado} → ${persona.email} @ ${disponibilidad.cancha.nombre} ${disponibilidad.horario.horaInicio} (${fecha.toISOString().slice(0,10)})`);
  } else {
    // opcional: actualizar estado si querés
    if (r.estado !== estado) {
      r.estado = estado;
      await reservaRepo.save(r);
      console.log(`♻️ Reserva actualizada a ${estado} (${r.id})`);
    } else {
      console.log(`✔️ Reserva existente (${estado})`);
    }
  }
  return r;
}

async function upsertDesafio(reserva: Reserva, creador: Persona, rival: Persona[], finalizado = false) {
  let d = await desafioRepo.findOne({ where: { reserva: { id: reserva.id } } as any });
  if (!d) {
    d = desafioRepo.create({
      reserva,
      deporte: reserva.disponibilidad.cancha.deporte!,
      creador,
      jugadoresCreador: [creador],
      invitadosDesafiados: rival,      // invitados pendientes
      jugadoresDesafiados: finalizado ? rival : [], // si finalizado, asumimos que aceptaron
      estado: finalizado ? EstadoDesafio.Finalizado : EstadoDesafio.Pendiente,
      ganador: finalizado ? LadoDesafio.Creador : null,
      golesCreador: finalizado ? 3 : null,
      golesDesafiado: finalizado ? 2 : null,
    });
    await desafioRepo.save(d);
    console.log(`⚔️ Desafío ${finalizado ? 'finalizado' : 'pendiente'} para reserva ${reserva.id}`);
  } else {
    console.log(`✔️ Desafío ya existía para reserva ${reserva.id}`);
  }
  return d;
}

async function upsertDeuda(
  persona: Persona,
  monto: number,
  pagada: boolean,
  fechaVenc?: string
) {
  // armar where dinámico
  const where: any = { persona: { id: persona.id }, monto };
  if (fechaVenc) where.fechaVencimiento = fechaVenc;

  // ✅ devuelve Deuda | null
  let deuda = await deudaRepo.findOne({ where });

  if (!deuda) {
    const data: Partial<Deuda> = { persona, monto, pagada };
    if (fechaVenc) data.fechaVencimiento = fechaVenc; // no pasar null

    deuda = deudaRepo.create(data);   // ✅ create(DeepPartial<Deuda>)
    await deudaRepo.save(deuda);
    console.log(`💸 Deuda ${pagada ? 'pagada' : 'impaga'} $${monto} → ${persona.email}`);
  } else {
    console.log(`✔️ Deuda existente para ${persona.email} ($${monto})`);
  }
  return deuda;
}

async function upsertValoracion(
  autor: Persona,
  tipo: 'club' | 'cancha' | 'usuario',
  objetivoId: string,
  puntaje: number,
  comentario?: string
) {
  // criterio: misma persona + mismo objetivo + mismo tipo + mismo puntaje
  let v = await valorRepo.findOne({ where: { persona: { id: autor.id }, tipo_objetivo: tipo, id_objetivo: objetivoId, puntaje } as any });
  if (!v) {
    v = valorRepo.create({
      persona: autor,
      tipo_objetivo: tipo,
      id_objetivo: objetivoId,
      puntaje,
      comentario,
    });
    await valorRepo.save(v);
    console.log(`⭐ Valoración ${tipo}=${objetivoId} (${puntaje}) por ${autor.email}`);
  } else {
    console.log(`✔️ Valoración existente (${tipo}/${puntaje}) por ${autor.email}`);
  }
  return v;
}

// ---------- Datos y creación de ejemplos ----------
const usuarios = await usuarioRepo.find({ relations: ['persona'] });
const u1 = usuarios.find(u => u.persona.email === 'usuario@canchaya.com');
const u2 = usuarios.find(u => u.persona.email === 'pedro@gmail.com');
const u3 = usuarios.find(u => u.persona.email === 'marta@gmail.com');

if (u1 && u2 && u3) {
  // Fechas de ejemplo: hoy, ayer y mañana
  const hoy     = new Date();
  const ayer    = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - 1, 21, 0, 0)); // 21:00Z ≈ 18:00-03
  const manana  = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() + 1, 21, 0, 0));
  const hoy18   = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate(), 21, 0, 0));

  // Tomamos horaInicio "18:00" (ajustá si querés otro)
  const HI = '18:00';

  // Disponibilidades para esas fechas a las 18:00
  const dAyer   = await getDisponibilidadParaFechaYHora(cancha.id, new Date(ayer),   HI);
  const dHoy    = await getDisponibilidadParaFechaYHora(cancha.id, new Date(hoy18),  HI);
  const dManana = await getDisponibilidadParaFechaYHora(cancha.id, new Date(manana), HI);

  if (dHoy) {
    const r1 = await upsertReserva(u1.persona, dHoy, hoy18, EstadoReserva.Pendiente);
    // desafío pendiente (u1 crea, invita a u2)
    await upsertDesafio(r1, u1.persona, [u2.persona], false);
  }

  if (dAyer) {
    const r2 = await upsertReserva(u1.persona, dAyer, ayer, EstadoReserva.Confirmada);
    // desafío finalizado (u1 vs u2)
    await upsertDesafio(r2, u1.persona, [u2.persona], true);
  }

  if (dManana) {
    const r3 = await upsertReserva(u1.persona, dManana, manana, EstadoReserva.Cancelada);
    // sin desafío
  }

  // Deudas (una impaga, una pagada)
  await upsertDeuda(u1.persona, 2500, false);
  await upsertDeuda(u1.persona, 1800, true);

  // Valoraciones
  // u3 valora a u1 (como usuario)
  await upsertValoracion(u3.persona, 'usuario', u1.persona.id, 5, 'Jugador muy correcto');
  // u1 valora la cancha
  await upsertValoracion(u1.persona, 'cancha', cancha.id, 4, 'Buen piso, luces ok');
  // u2 valora el club
  await upsertValoracion(u2.persona, 'club', club.id, 5, 'Atención excelente');
} else {
  console.warn('⚠️ No se encontraron usuarios/personas esperados para generar ejemplos de reservas/desafíos.');
}

console.log('✅ Seed completo');
await AppDataSource.destroy();
process.exit(0);
})().catch(async (e) => {
  console.error('❌ Seed error:', e);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
