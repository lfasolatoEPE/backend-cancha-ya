import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/database/data-source';

describe('Auth', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('Debería loguear un usuario válido', async () => {
    // Asegurate que este usuario exista en tu DB
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: '123456'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('Debería fallar login con credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'fake@example.com',
        password: 'wrongpass'
      });

    expect(res.status).toBe(401);
  });
});
