import request from "supertest";
import app from "../src/app";
import { AppDataSource } from "../src/database/data-source";

let token: string;
let usuarioId: string;
let reservaId: string;

beforeAll(async () => {
  await AppDataSource.initialize();

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@example.com",
      password: "123456"
    });
  token = loginRes.body.token;

  // Crea un usuario de prueba
  const userRes = await request(app)
    .post("/api/usuarios/registro")
    .send({
      nombre: "Reserva Test User",
      email: `reserva_${Date.now()}@mail.com`,
      password: "123456"
    });
  usuarioId = userRes.body.id;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Reservas", () => {
  it("Crear reserva (si existe cancha)", async () => {
    const canchaId = "11111111-1111-1111-1111-111111111111"; // Cambiar si es necesario

    const res = await request(app)
      .post("/api/reservas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        usuarioId,
        canchaId,
        fecha: "2024-12-01",
        hora: "18:00"
      });

    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      reservaId = res.body.id;
    }
  });

  it("Listar reservas", async () => {
    const res = await request(app)
      .get("/api/reservas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("Obtener reserva por ID (si se creó)", async () => {
    if (!reservaId) return;

    const res = await request(app)
      .get(`/api/reservas/${reservaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("Confirmar reserva (si se creó)", async () => {
    if (!reservaId) return;

    const res = await request(app)
      .patch(`/api/reservas/${reservaId}/confirmar`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 400]).toContain(res.status);
  });
});
