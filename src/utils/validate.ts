// import { plainToInstance } from 'class-transformer';
// import { validate } from 'class-validator';
// import { Request, Response, NextFunction } from 'express';

// export const validateDto = (dtoClass: any) => {
//   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const instance = plainToInstance(dtoClass, req.body);
//     const errors = await validate(instance);

//     if (errors.length > 0) {
//       const mensajes = errors.flatMap(err =>
//         Object.values(err.constraints || {})
//       );
//       res.status(400).json({ errores: mensajes });
//       return;
//     }

//     req.body = instance;
//     next();
//   };
// };

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export const validateDto = (
  dtoClass: any,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const data = req[source];
    const dto = plainToInstance(dtoClass, data);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true
    });
    if (errors.length > 0) {
      const mensajes = errors
        .map(err => Object.values(err.constraints || {}))
        .flat();
      res.status(400).json({ errors: mensajes });
      return;
    }
    next();
  };
};
