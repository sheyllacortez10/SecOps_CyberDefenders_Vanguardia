import { Request, Response } from 'express';
import { progressService } from './progress.service';

export const getUserProgress = async (req: Request, res: Response) => {
  const result = await progressService.getUserProgress(req.params.userId);
  res.status(200).json(result);
};

export const getUserHistory = async (req: Request, res: Response) => {
  const result = await progressService.getUserHistory(req.params.userId, req.query as Record<string, string | string[] | undefined>);
  res.status(200).json(result);
};

export const getUserBadges = async (req: Request, res: Response) => {
  const result = await progressService.getUserBadges(req.params.userId);
  res.status(200).json(result);
};
