import express from 'express';
import cors from 'cors';
import reservaRoutes from './controllers/reserva.controller';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/reservas', reservaRoutes);

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
