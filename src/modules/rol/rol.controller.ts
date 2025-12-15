import { Request, Response } from 'express';
import { RolService } from './rol.service';
import { CrearRolDto } from './dto/crear-rol.dto';

export class RolController {
  constructor(private service: RolService) {}

  listar = async (_req: Request, res: Response) => {
    const roles = await this.service.listarRoles();
    res.json(roles);
  };

  crear = async (req: Request, res: Response) => {
    try {
      const dto = req.body as CrearRolDto;
      const rol = await this.service.crearRol(dto);
      res.status(201).json(rol);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}
