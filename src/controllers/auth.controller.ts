import { Request, Response } from 'express';
import { loginUsuario } from '../services/auth.service';

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y password son requeridos' });
      return;
    }

    const { token } = await loginUsuario(email, password);

    res.json({ token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
