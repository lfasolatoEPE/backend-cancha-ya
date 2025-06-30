import request from "supertest";
import app from "../src/app";
import { AppDataSource } from "../src/database/data-source";

let token: string;
let deporteId: string;

beforeAll(async () => {
  await AppDataSource.initialize();

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@example.com",
      password: "123456"
    });
  token = res.body.token;
});

afterAll(async () => {
  await AppDataSource.destroy();
});

describe("Deportes", () => {
  it("Crear un deporte", async () => {
    const res = await request(app)
      .post("/api/deportes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: `Deporte ${Date.now()}`
      });

    expect(res.status).toBe(201);
    deporteId = res.body.id;
  });

  it("Listar deportes", async () => {
    const res = await request(app).get("/api/deportes");
    expect(res.status).toBe(200);
  });

  it("Obtener deporte por ID", async () => {
    const res = await request(app).get(`/api/deportes/${deporteId}`);
    expect(res.status).toBe(200);
  });

  it("Eliminar deporte", async () => {
    const res = await request(app)
      .delete(`/api/deportes/${deporteId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
