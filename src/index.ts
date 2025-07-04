import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', router);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT || 3000}`);
});
