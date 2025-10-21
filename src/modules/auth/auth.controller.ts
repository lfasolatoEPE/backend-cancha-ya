import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { isDuplicateError } from '../../utils/db';

export class AuthController {
  constructor(private service: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const { nombre, apellido, email, password } = req.body;
      const out = await this.service.register({ nombre, apellido, email, password });
      res.status(201).json(out);
    } catch (e: any) {
      const msg = String(e?.message ?? 'Error en registro');
      if (msg.includes('registrado') || isDuplicateError(e)) {
        res.status(409).json({ error: msg }); // duplicado
      } else {
        res.status(400).json({ error: msg });
      }
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const dto = req.body as LoginDto;
      const out = await this.service.login(dto.email, dto.password);
      res.json(out);
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const dto = req.body as RefreshDto;
      const out = await this.service.refresh(dto.refreshToken);
      res.json(out);
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const dto = req.body as RefreshDto;
      const out = await this.service.logout(dto.refreshToken);
      res.json(out);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  me = async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json(user);
  };
}
