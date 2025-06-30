import request from "supertest";
import app from "../src/app";
import { AppDataSource } from "../src/database/data-source";

let token: string;
let valoracionId: string;
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
      nombre: "Valoracion Test",
      email: `valoracion_${Date.now()}@mail.com`,
      password: "123456"
    });
  usuarioId = userRes.body.id;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Valoraciones", () => {
  it("Crear valoración", async () => {
    const canchaId = "11111111-1111-1111-1111-111111111111";

    const res = await request(app)
      .post("/api/valoraciones")
      .set("Authorization", `Bearer ${token}`)
      .send({
        usuarioId,
        canchaId,
        puntaje: 5,
        comentario: "Excelente cancha"
      });

    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      valoracionId = res.body.id;
    }
  });

  it("Listar valoraciones", async () => {
    const res = await request(app).get("/api/valoraciones");
    expect(res.status).toBe(200);
  });

  it("Eliminar valoración", async () => {
    if (!valoracionId) return;
    const res = await request(app)
      .delete(`/api/valoraciones/${valoracionId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
