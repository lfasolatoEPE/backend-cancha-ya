import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export const validateDto = (
  dtoClass: any,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = req[source];
    const dto = plainToInstance(dtoClass, data, { enableImplicitConversion: true });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const mensajes = errors.flatMap(err => Object.values(err.constraints || {}));
      res.status(400).json({ errors: mensajes });
      return;
    }
    // ✅ sobreescribir con el DTO limpio/transformado
    (req as any)[source] = dto;
    next();
  };
};
