import { Request, Response } from 'express';
import { AppDataSource } from '../database/data-source';
import { Usuario } from '../entities/Usuario.entity';

const usuarioRepo = AppDataSource.getRepository(Usuario);

export const activarModoCompetitivo = async (req: Request, res: Response) => {
  const usuarioId = (req as any).usuario.id;
  const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  usuario.modoCompetitivo = true;
  usuario.ranking = 1000; // reinicia ranking
  await usuarioRepo.save(usuario);

  res.json({ mensaje: 'Modo competitivo activado', ranking: usuario.ranking });
};

export const desactivarModoCompetitivo = async (req: Request, res: Response) => {
  const usuarioId = (req as any).usuario.id;
  const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  usuario.modoCompetitivo = false;
  await usuarioRepo.save(usuario);

  res.json({ mensaje: 'Modo competitivo desactivado' });
};

export const obtenerMiRanking = async (req: Request, res: Response) => {
  const usuarioId = (req as any).usuario.id;
  const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json({
    ranking: usuario.ranking,
    modoCompetitivo: usuario.modoCompetitivo
  });
};

export const rankingGlobal = async (_req: Request, res: Response) => {
  const usuarios = await usuarioRepo.find({
    where: { modoCompetitivo: true },
    order: { ranking: 'DESC' },
    take: 50
  });

  res.json(usuarios.map(u => ({
    nombre: u.nombre,
    ranking: u.ranking
  })));
};
