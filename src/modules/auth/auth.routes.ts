import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { validateDto } from '../../utils/validate';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new AuthController(new AuthService());

router.post('/register', validateDto(RegisterDto), controller.register);
router.post('/login', validateDto(LoginDto), controller.login);
router.post('/refresh', validateDto(RefreshDto), controller.refresh);
router.post('/logout', validateDto(RefreshDto), controller.logout);
router.get('/me', authMiddleware, controller.me);

export default router;
