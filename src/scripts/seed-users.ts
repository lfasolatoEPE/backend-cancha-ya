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
  let persona = await ctx.personaRepo.findOne({ where: { email: p.email } });
  if (!persona) {
    persona = ctx.personaRepo.create({ nombre: p.nombre, apellido: p.apellido, email: p.email });
    await ctx.personaRepo.save(persona);
    console.log(`👤 Persona creada: ${p.email}`);
  } else {
    console.log(`👤 Persona existente: ${p.email}`);
  }

  let usuario = await ctx.usuarioRepo.findOne({ where: { persona: { email: p.email } } });
  const rol = await ctx.rolRepo.findOne({ where: { nombre: p.rol } });
  if (!rol) throw new Error(`Rol ${p.rol} no existe (seed roles falló)`);

  const passwordHash = await bcrypt.hash(p.password, 12);

  if (!usuario) {
    usuario = ctx.usuarioRepo.create({
      persona,
      passwordHash,
      rol,
      activo: true,
      failedLoginAttempts: 0,
      lastLoginAt: null,
    });
    await ctx.usuarioRepo.save(usuario);
    console.log(`🆕 Usuario creado: ${p.email} (rol=${p.rol})`);
  } else {
    // refrescamos password/rol por si cambió
    usuario.passwordHash = passwordHash;
    usuario.rol = rol;
    await ctx.usuarioRepo.save(usuario);
    console.log(`♻️ Usuario actualizado: ${p.email} (rol=${p.rol})`);
  }

  // perfil competitivo base (si no existe)
  let perfil = await ctx.perfilRepo.findOne({ where: { usuario: { id: usuario.id } } as any });
  if (!perfil) {
    perfil = ctx.perfilRepo.create({ usuario, activo: false, ranking: 1000 });
    await ctx.perfilRepo.save(perfil);
    console.log(`📈 PerfilCompetitivo creado para: ${p.email}`);
  }

  return usuario;
}

async function smokeAuth(ctx: Ctx, email: string, password: string) {
  try {
    const { accessToken, refreshToken } = await ctx.auth.login(email, password);
    console.log(`🔐 Login OK (${email})`);
    console.log(`   accessToken: ${accessToken.substring(0, 32)}...`);
    console.log(`   refreshToken: ${refreshToken.substring(0, 32)}...`);

    const refreshed = await ctx.auth.refresh(refreshToken);
    console.log(`♻️  Refresh OK (${email}) → accessToken*: ${refreshed.accessToken.substring(0, 32)}...`);

    // logout (revocar refresh)
    await ctx.auth.logout(refreshToken);
    console.log(`🚪 Logout OK (${email}) (refresh revocado)`);

    // Probar que ya no sirve ese refresh
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
    auth: new (AuthService as any)(), // no necesita deps externas
  };

  // 1) Roles
  await upsertRole(ctx, 'usuario');
  await upsertRole(ctx, 'admin');

  // 2) Usuarios
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@canchaya.app';
  const ADMIN_PASS  = process.env.SEED_ADMIN_PASSWORD || 'Admin.1234';

  const admin = await upsertUser(ctx, {
    nombre: 'Admin',
    apellido: 'CanchaYa',
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    rol: 'admin',
  });

  const usersData = [
    { nombre: 'Lucía',  apellido: 'Pérez',   email: 'lucia@test.com',  password: 'Strong.123', rol: 'usuario' as const },
    { nombre: 'Mateo',  apellido: 'Gómez',   email: 'mateo@test.com',  password: 'Strong.123', rol: 'usuario' as const },
    { nombre: 'Sofía',  apellido: 'Martínez',email: 'sofia@test.com',  password: 'Strong.123', rol: 'usuario' as const },
  ];

  for (const u of usersData) {
    await upsertUser(ctx, u);
  }

  // 3) Smoke tests de Auth (login/refresh/logout) sobre admin y un usuario
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
