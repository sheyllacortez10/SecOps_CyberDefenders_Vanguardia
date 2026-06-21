import { Response } from 'express';
import { progressService } from './progress.service';
import { AuthenticatedRequest } from '../../shared/http/authMiddleware';

export const getUserProgress = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. No puedes ver el progreso de otro usuario.' });
    return;
  }
  const result = await progressService.getUserProgress(userId);
  res.status(200).json(result);
};

export const getUserHistory = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. No puedes ver el historial de otro usuario.' });
    return;
  }
  const result = await progressService.getUserHistory(userId, req.query as Record<string, string | string[] | undefined>);
  res.status(200).json(result);
};

export const getUserBadges = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. No puedes ver las insignias de otro usuario.' });
    return;
  }
  const result = await progressService.getUserBadges(userId);
  res.status(200).json(result);
};
