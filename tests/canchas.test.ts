import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/database/data-source';

let token: string;
let canchaId: string;

beforeAll(async () => {
  await AppDataSource.initialize();

  // Login admin
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@example.com',
      password: '123456'
    });
  token = res.body.token;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe('Canchas', () => {
  it('Crear una cancha', async () => {
    const res = await request(app)
      .post('/api/canchas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Cancha Test',
        ubicacion: 'Calle Falsa 123',
        tipoSuperficie: 'Césped',
        precioPorHora: 800
      });

    expect(res.status).toBe(201);
    canchaId = res.body.id;
  });

  it('Listar canchas', async () => {
    const res = await request(app).get('/api/canchas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Obtener cancha por ID', async () => {
    const res = await request(app).get(`/api/canchas/${canchaId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('Eliminar cancha', async () => {
    const res = await request(app)
      .delete(`/api/canchas/${canchaId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
