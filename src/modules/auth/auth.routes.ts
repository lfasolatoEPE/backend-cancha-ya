import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { validateDto } from '../../utils/validate';
import { LoginDto } from './dto/login.dto';

const router = Router();
const controller = new AuthController(new AuthService());

router.post('/login', validateDto(LoginDto), controller.login);

export default router;
