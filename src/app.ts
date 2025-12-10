import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger.generated.json';

import { errorHandler } from './middlewares/error.middleware';

// Rutas
import authRoutes from './modules/auth/auth.routes';
import usuarioRoutes from './modules/usuarios/usuario.routes';
import reservaRoutes from './modules/reservas/reserva.routes';
import canchaRoutes from './modules/canchas/cancha.routes';
import clubRoutes from './modules/clubes/club.routes';
import deporteRoutes from './modules/deportes/deporte.routes';
import horarioRoutes from './modules/horarios/horario.routes';
import valoracionRoutes from './modules/valoraciones/valoracion.routes';
import deudaRoutes from './modules/deudas/deuda.routes';
import disponibilidadRoutes from './modules/disponibilidades/disponibilidad.routes';
import disponibilidadCanchaRoutes from './modules/disponibilidad-cancha/disponibilidad-cancha.routes';
import competitivoRoutes from './modules/perfil-competitivo/perfil.routes';
import desafioRoutes from './modules/desafios/desafio.routes';
import reportesRoutes from './modules/reportes/reportes.routes';
import adminRoutes from './modules/admin-panel/admin.routes';
import personaRoutes from './modules/personas/persona.routes';
import rankingRoutes from './modules/ranking/ranking.routes';
import rolesRoutes from './modules/rol/rol.routes';
import auditoriaRoutes from './modules/auditoria/auditoria.routes';
import notifsRoutes from './modules/notifs/notifs.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/personas', personaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/clubes', clubRoutes);
app.use('/api/deportes', deporteRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/valoraciones', valoracionRoutes);
app.use('/api/deudas', deudaRoutes);
app.use('/api/disponibilidad-cancha', disponibilidadCanchaRoutes);
app.use('/api/disponibilidades', disponibilidadRoutes);
app.use('/api/perfil-competitivo', competitivoRoutes);
app.use('/api/desafios', desafioRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/notifs', notifsRoutes);

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware de errores
app.use(errorHandler);

export default app;
