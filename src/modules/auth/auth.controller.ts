import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    try {
      const loginDto: LoginDto = req.body;
      const token = await this.authService.loginUsuario(loginDto);
      res.json({ token });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
}
