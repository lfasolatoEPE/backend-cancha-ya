// scripts/seed-users.ts
import 'dotenv/config';
import { AppDataSource, AppDataSourceReset } from '../../src/database/data-source';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';

import { Rol } from '../../src/entities/Rol.entity';
import { Persona } from '../../src/entities/Persona.entity';
import { Usuario } from '../../src/entities/Usuario.entity';
import { PerfilCompetitivo } from '../../src/entities/PerfilCompetitivo.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import { isDuplicateError, normEmail } from '../../src/utils/db';

type Ctx = {
  rolRepo: Repository<Rol>;
  personaRepo: Repository<Persona>;
  usuarioRepo: Repository<Usuario>;
  perfilRepo: Repository<PerfilCompetitivo>;
  auth: AuthService;
};

async function ensureDataSource() {
  const reset = process.env.SEED_RESET === 'true';
  if (reset) {
    console.log('⚠️  SEED_RESET=true → dropping schema...');
    await AppDataSourceReset.initialize();
    await AppDataSourceReset.destroy();
  }
  await AppDataSource.initialize();
  console.log('✅ DataSource listo');
}

async function upsertRole(ctx: Ctx, nombre: 'admin' | 'usuario') {
  let r = await ctx.rolRepo.findOne({ where: { nombre } });
  if (!r) {
    r = ctx.rolRepo.create({ nombre });
    await ctx.rolRepo.save(r);
    console.log(`🆕 Rol creado: ${nombre}`);
  } else {
    console.log(`✔️ Rol existente: ${nombre}`);
  }
  return r;
}

async function upsertUser(
  ctx: Ctx,
  p: { nombre: string; apellido: string; email: string; password: string; rol: 'usuario' | 'admin' }
) {
  const email = normEmail(p.email);

  try {
    return await AppDataSource.transaction(async (manager) => {
      const personaRepoT = manager.getRepository(Persona);
      const usuarioRepoT = manager.getRepository(Usuario);
      const rolRepoT = manager.getRepository(Rol);
      const perfilRepoT = manager.getRepository(PerfilCompetitivo);

      // Persona (email normalizado)
      let persona = await personaRepoT.findOne({ where: { email } });
      if (!persona) {
        persona = personaRepoT.create({ nombre: p.nombre, apellido: p.apellido, email });
        await personaRepoT.save(persona);
        console.log(`👤 Persona creada: ${email}`);
      } else {
        // opcional: mantener nombre/apellido del seed como “fuente de verdad”
        // persona.nombre = p.nombre; persona.apellido = p.apellido;
        // await personaRepoT.save(persona);
        console.log(`👤 Persona existente: ${email}`);
      }

      // Rol
      const rol = await rolRepoT.findOne({ where: { nombre: p.rol } });
      if (!rol) throw new Error(`Rol ${p.rol} no existe (seed roles falló)`);

      // Usuario por email (join con persona, case-insensitive)
      let usuario = await usuarioRepoT
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.persona', 'p')
        .leftJoinAndSelect('u.rol', 'r')
        .where('LOWER(p.email) = :email', { email })
        .getOne();

      const passwordHash = await bcrypt.hash(p.password, 12);

      if (!usuario) {
        usuario = usuarioRepoT.create({
          persona,
          passwordHash,
          rol,
          activo: true,
          failedLoginAttempts: 0,
          lastLoginAt: null,
        });
        await usuarioRepoT.save(usuario);
        console.log(`🆕 Usuario creado: ${email} (rol=${p.rol})`);
      } else {
        // refrescar credenciales/rol del seed
        usuario.passwordHash = passwordHash;
        usuario.rol = rol;
        await usuarioRepoT.save(usuario);
        console.log(`♻️ Usuario actualizado: ${email} (rol=${p.rol})`);
      }

      // Perfil competitivo (uno por usuario)
      let perfil = await perfilRepoT.findOne({
        where: { usuario: { id: usuario.id } } as any,
      });
      if (!perfil) {
        perfil = perfilRepoT.create({ usuario, activo: false, ranking: 1000 });
        await perfilRepoT.save(perfil);
        console.log(`📈 PerfilCompetitivo creado para: ${email}`);
      }

      return usuario;
    });
  } catch (err) {
    if (isDuplicateError(err)) {
      console.warn(`⚠️ Duplicado detectado al seedear ${p.email} (unique). Continúo.`);
      // Intento recuperar el usuario existente para retornarlo
      const existente = await ctx.usuarioRepo
        .createQueryBuilder('u')
        .leftJoinAndSelect('u.persona', 'p')
        .leftJoinAndSelect('u.rol', 'r')
        .where('LOWER(p.email) = :email', { email: normEmail(p.email) })
        .getOne();
      if (existente) return existente;
    }
    throw err;
  }
}

async function smokeAuth(ctx: Ctx, rawEmail: string, password: string) {
  const email = normEmail(rawEmail);
  try {
    const { accessToken, refreshToken } = await ctx.auth.login(email, password);
    console.log(`🔐 Login OK (${email})`);
    console.log(`   accessToken: ${accessToken.substring(0, 32)}...`);
    console.log(`   refreshToken: ${refreshToken.substring(0, 32)}...`);

    const refreshed = await ctx.auth.refresh(refreshToken);
    console.log(
      `♻️  Refresh OK (${email}) → accessToken*: ${refreshed.accessToken.substring(0, 32)}...`
    );

    await ctx.auth.logout(refreshToken);
    console.log(`🚪 Logout OK (${email}) (refresh revocado)`);

    let revokedWorked = false;
    try {
      await ctx.auth.refresh(refreshToken);
      revokedWorked = true;
    } catch {
      // esperado
    }
    if (revokedWorked) {
      console.warn(`⚠️ Refresh revocado aún funcionó (revisar persistencia).`);
    } else {
      console.log(`✅ Refresh revocado no se puede reutilizar (esperado).`);
    }
  } catch (e: any) {
    console.error(`❌ Smoke auth falló para ${email}:`, e.message);
  }
}

async function main() {
  await ensureDataSource();

  const ctx: Ctx = {
    rolRepo: AppDataSource.getRepository(Rol),
    personaRepo: AppDataSource.getRepository(Persona),
    usuarioRepo: AppDataSource.getRepository(Usuario),
    perfilRepo: AppDataSource.getRepository(PerfilCompetitivo),
    auth: new (AuthService as any)(), // usa repos globales del AppDataSource
  };

  // 1) Roles
  await upsertRole(ctx, 'usuario');
  await upsertRole(ctx, 'admin');

  // 2) Usuarios
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@canchaya.app';
  const ADMIN_PASS  = process.env.SEED_ADMIN_PASSWORD || 'Admin.1234';

  await upsertUser(ctx, {
    nombre: 'Admin',
    apellido: 'CanchaYa',
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    rol: 'admin',
  });

  const usersData = [
    { nombre: 'Lucía',  apellido: 'Pérez',    email: 'lucia@test.com',   password: 'Strong.123', rol: 'usuario' as const },
    { nombre: 'Mateo',  apellido: 'Gómez',    email: 'mateo@test.com',   password: 'Strong.123', rol: 'usuario' as const },
    { nombre: 'Sofía',  apellido: 'Martínez', email: 'sofia@test.com',   password: 'Strong.123', rol: 'usuario' as const },
  ];

  for (const u of usersData) {
    await upsertUser(ctx, u);
  }

  // 3) Smoke tests de Auth (login/refresh/logout)
  console.log('—'.repeat(60));
  await smokeAuth(ctx, ADMIN_EMAIL, ADMIN_PASS);
  await smokeAuth(ctx, usersData[0].email, usersData[0].password);

  console.log('✅ Seed Usuarios/Personas/Roles completo.');
  await AppDataSource.destroy();
}

main().catch(async (e) => {
  console.error('❌ Seed error:', e);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
