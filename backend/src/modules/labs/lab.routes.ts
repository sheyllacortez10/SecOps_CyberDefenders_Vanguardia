import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { getLabById, getLabs, submitActivityAnswer } from './lab.controller';

const router = Router();

router.get('/labs', asyncHandler(getLabs));
router.get('/labs/:id', asyncHandler(getLabById));
router.post('/labs/:id/activities/:activityId/submit', asyncHandler(submitActivityAnswer));

export default router;
