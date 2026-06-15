import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { createLab, deleteLab, getMetrics, updateLab } from './admin.controller';

const router = Router();

router.post('/admin/labs', asyncHandler(createLab));
router.put('/admin/labs/:id', asyncHandler(updateLab));
router.delete('/admin/labs/:id', asyncHandler(deleteLab));
router.get('/admin/metrics', asyncHandler(getMetrics));

export default router;
