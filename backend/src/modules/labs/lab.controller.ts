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

export const submitActivityAnswer = async (req: Request, res: Response) => {
  const { userId, answer } = req.body;
  const { id: labId, activityId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'El campo userId es requerido en el cuerpo de la solicitud.' });
    return;
  }

  const result = await labService.submitAnswer(userId, labId, activityId, answer);
  res.status(200).json(result);
};
