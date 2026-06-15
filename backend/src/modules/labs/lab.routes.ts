import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { getLabById, getLabs } from './lab.controller';

const router = Router();

router.get('/labs', asyncHandler(getLabs));
router.get('/labs/:id', asyncHandler(getLabById));

export default router;
