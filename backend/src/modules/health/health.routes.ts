import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { getHealth } from './health.controller';

const router = Router();

router.get('/health', asyncHandler(getHealth));

export default router;
