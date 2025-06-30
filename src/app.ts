import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import usuarioRoutes from './routes/usuario.routes';
import reservaRoutes from './routes/reserva.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.generated.json';
import canchaRoutes from './routes/cancha.routes';
import deporteRoutes from './routes/deporte.routes';
import deudaRoutes from './routes/deuda.routes';
import horarioRoutes from './routes/horario.routes';
import valoracionRoutes from './routes/valoracion.routes';
import clubRoutes from './routes/club.routes';
import reportesRoutes from "./routes/reportes.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/deportes', deporteRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/deudas', deudaRoutes);
app.use('/api/valoraciones', valoracionRoutes);
app.use('/api/clubes', clubRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/reportes", reportesRoutes);
// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(errorHandler);

export default app;