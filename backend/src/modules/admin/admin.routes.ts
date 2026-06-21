import { Router } from 'express';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { createLab, deleteLab, getMetrics, updateLab, getLabByIdForAdmin } from './admin.controller';
import { authenticateToken, requireAdmin } from '../../shared/http/authMiddleware';

const router = Router();

// Aplicar middlewares de autenticación y rol de administrador a todas las rutas de este router
router.use(authenticateToken);
router.use(requireAdmin);

router.post('/admin/labs', asyncHandler(createLab));
router.get('/admin/labs/:id', asyncHandler(getLabByIdForAdmin));
router.put('/admin/labs/:id', asyncHandler(updateLab));
router.delete('/admin/labs/:id', asyncHandler(deleteLab));
router.get('/admin/metrics', asyncHandler(getMetrics));

export default router;
