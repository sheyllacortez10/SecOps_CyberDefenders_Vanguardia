import { Request, Response } from 'express';
import { labService } from './lab.service';

export const getLabs = async (req: Request, res: Response) => {
  const result = await labService.listLabs(req.query as Record<string, string>);
  res.status(200).json(result);
};

export const getLabById = async (req: Request, res: Response) => {
  const result = await labService.getLabById(req.params.id);
  res.status(200).json(result);
};
