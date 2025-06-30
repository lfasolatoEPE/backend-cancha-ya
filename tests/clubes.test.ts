import request from 'supertest';
import app from '../src/app';
import { AppDataSource } from '../src/database/data-source';

let token: string;
let clubId: string;

beforeAll(async () => {
  await AppDataSource.initialize();

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

describe('Clubes', () => {
  it('Crear un club', async () => {
    const res = await request(app)
      .post('/api/clubes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Club Test',
        direccion: 'Dirección Falsa',
        telefono: '123456789',
        email: `club_${Date.now()}@mail.com`
      });

    expect(res.status).toBe(201);
    clubId = res.body.id;
  });

  it('Listar clubes', async () => {
    const res = await request(app).get('/api/clubes');
    expect(res.status).toBe(200);
  });

  it('Obtener club por ID', async () => {
    const res = await request(app).get(`/api/clubes/${clubId}`);
    expect(res.status).toBe(200);
  });

  it('Eliminar club', async () => {
    const res = await request(app)
      .delete(`/api/clubes/${clubId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
