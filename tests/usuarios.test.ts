import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/database/data-source';

let token: string;
let userId: string;

beforeAll(async () => {
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Usuarios', () => {
  it('Registrar un nuevo usuario', async () => {
    const email = `test_${Date.now()}@mail.com`;

    const res = await request(app)
      .post('/api/usuarios/registro')
      .send({
        nombre: 'Test User',
        email,
        password: '123456'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    userId = res.body.id;
  });

  it('Login del usuario', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: expect.any(String), // Usa el email creado antes si querés
        password: '123456'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('Listar usuarios', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
