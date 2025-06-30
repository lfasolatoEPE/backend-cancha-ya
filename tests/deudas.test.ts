import request from "supertest";
import app from "../src/app";
import { AppDataSource } from "../src/database/data-source";

let token: string;
let deudaId: string;
let usuarioId: string;

beforeAll(async () => {
  await AppDataSource.initialize();

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@example.com",
      password: "123456"
    });
  token = loginRes.body.token;

  const userRes = await request(app)
    .post("/api/usuarios/registro")
    .send({
      nombre: "Deuda Test",
      email: `deuda_${Date.now()}@mail.com`,
      password: "123456"
    });
  usuarioId = userRes.body.id;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Deudas", () => {
  it("Crear deuda", async () => {
    const res = await request(app)
      .post("/api/deudas")
      .set("Authorization", `Bearer ${token}`)
      .send({
        usuarioId,
        monto: 1500,
        fechaVencimiento: "2024-12-31"
      });

    expect(res.status).toBe(201);
    deudaId = res.body.id;
  });

  it("Listar deudas", async () => {
    const res = await request(app)
      .get("/api/deudas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("Obtener deuda por ID", async () => {
    const res = await request(app)
      .get(`/api/deudas/${deudaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("Actualizar deuda", async () => {
    const res = await request(app)
      .patch(`/api/deudas/${deudaId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ pagada: true });

    expect(res.status).toBe(200);
  });

  it("Eliminar deuda", async () => {
    const res = await request(app)
      .delete(`/api/deudas/${deudaId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
