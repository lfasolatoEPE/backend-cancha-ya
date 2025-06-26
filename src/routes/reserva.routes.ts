import express from 'express';
import {
  crearReserva,
  confirmarReserva,
  cancelarReserva,
  obtenerTodas,
  obtenerPorId
} from '../services/reserva.service';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const reserva = await crearReserva(req.body);
    res.status(201).json(reserva);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/confirmar', async (req, res) => {
  try {
    const reserva = await confirmarReserva(req.params.id);
    res.json(reserva);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const resultado = await cancelarReserva(req.params.id);
    res.json(resultado);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/', async (_req, res) => {
  const reservas = await obtenerTodas();
  res.json(reservas);
});

router.get('/:id', async (req, res) => {
  try {
    const reserva = await obtenerPorId(req.params.id);
    res.json(reserva);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
