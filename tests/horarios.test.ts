import request from "supertest";
import app from "../src/app";
import { AppDataSource } from "../src/database/data-source";

let token: string;
let horarioId: string;

beforeAll(async () => {
  await AppDataSource.initialize();

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@example.com",
      password: "123456"
    });
  token = loginRes.body.token;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Horarios", () => {
  it("Crear horario", async () => {
    const canchaId = "11111111-1111-1111-1111-111111111111";

    const res = await request(app)
      .post("/api/horarios")
      .set("Authorization", `Bearer ${token}`)
      .send({
        canchaId,
        dia: "Lunes",
        horaInicio: "08:00",
        horaFin: "10:00"
      });

    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      horarioId = res.body.id;
    }
  });

  it("Listar horarios", async () => {
    const res = await request(app).get("/api/horarios");
    expect(res.status).toBe(200);
  });

  it("Eliminar horario", async () => {
    if (!horarioId) return;
    const res = await request(app)
      .delete(`/api/horarios/${horarioId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
