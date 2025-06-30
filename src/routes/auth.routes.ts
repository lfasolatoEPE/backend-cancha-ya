import { Router } from 'express';
import { loginHandler } from '../controllers/auth.controller';
import { validateDto } from '../utils/validate';
import { LoginDto } from '../dtos/auth.dto';

const router = Router();

router.post('/login', validateDto(LoginDto), loginHandler);

export default router;
