import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export const validateDto = (
  dtoClass: any,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 🔒 EVITA undefined / null
      const raw = req[source] ?? {};

      const dto = plainToInstance(dtoClass, raw, {
        enableImplicitConversion: true,
        exposeDefaultValues: true,
      });

      const errors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      });

      if (errors.length > 0) {
        const mensajes = errors.flatMap(err =>
          err.constraints ? Object.values(err.constraints) : []
        );

        res.status(400).json({
          error: 'Validation error',
          details: mensajes,
        });
        return;
      }

      // ✅ sobreescribir con el DTO limpio / tipado
      (req as any)[source] = dto;

      next();
    } catch (error: any) {
      // 🔥 nunca más un 500 silencioso
      console.error('[validateDto]', error);
      res.status(500).json({
        error: 'Error validando la request',
      });
    }
  };
};
