import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import usuarioRoutes from './routes/usuario.routes';
import reservaRoutes from './routes/reserva.routes';
import authRoutes from './routes/auth.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json';

// Después de tus otros app.use()


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;


// // src/app.ts
// import express from 'express';
// import cors from 'cors';
// import { AppDataSource } from './data-source';
// import reservaRoutes from './controllers/reserva.controller';

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use('/api/reservas', reservaRoutes); // ✅ esto debe funcionar

// AppDataSource.initialize()
//   .then(() => {
//     console.log('📦 Base de datos conectada');
//     app.listen(3000, () => {
//       console.log('🚀 Servidor corriendo en puerto 3000');
//     });
//   })
//   .catch((error) => {
//     console.error('❌ Error al conectar base de datos:', error);
//   });
