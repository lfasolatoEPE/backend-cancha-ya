import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(dtoClass, req.body);
    const errors = await validate(instance);

    if (errors.length > 0) {
      const mensajes = errors.flatMap(err =>
        Object.values(err.constraints || {})
      );
      res.status(400).json({ errores: mensajes });
      return;
    }

    req.body = instance;
    next();
  };
};
