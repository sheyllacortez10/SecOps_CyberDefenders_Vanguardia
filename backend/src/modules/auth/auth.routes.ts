import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { loginUser, registerUser } from './auth.controller';

const router = Router();

router.post('/auth/register', asyncHandler(registerUser));
router.post('/auth/login', asyncHandler(loginUser));

export default router;
