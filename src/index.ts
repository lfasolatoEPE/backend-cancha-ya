import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reservaRoutes from './routes/reserva.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/reservas', reservaRoutes);

app.get('/', (req, res) => {
  res.send('API de CanchaYa funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
