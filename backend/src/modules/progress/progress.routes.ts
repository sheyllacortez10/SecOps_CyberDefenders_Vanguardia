import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { getUserBadges, getUserHistory, getUserProgress } from './progress.controller';
import { authenticateToken } from '../../shared/http/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/progress/:userId', asyncHandler(getUserProgress));
router.get('/history/:userId', asyncHandler(getUserHistory));
router.get('/badges/:userId', asyncHandler(getUserBadges));

export default router;
