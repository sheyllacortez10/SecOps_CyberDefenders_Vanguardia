import { Response } from 'express';
import { labService } from './lab.service';
import { AuthenticatedRequest } from '../../shared/http/authMiddleware';

export const getLabs = async (req: AuthenticatedRequest, res: Response) => {
  const result = await labService.listLabs(req.query as Record<string, string>);
  res.status(200).json(result);
};

export const getLabById = async (req: AuthenticatedRequest, res: Response) => {
  const result = await labService.getLabById(req.params.id);
  res.status(200).json(result);
};

export const submitActivityAnswer = async (req: AuthenticatedRequest, res: Response) => {
  const { userId, answer } = req.body;
  const { id: labId, activityId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'El campo userId es requerido en el cuerpo de la solicitud.' });
    return;
  }

  // Verificar que el usuario solo envíe respuestas para sí mismo (o sea administrador)
  if (req.user?.id !== userId && req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado. No puedes enviar respuestas para otro usuario.' });
    return;
  }

  const result = await labService.submitAnswer(userId, labId, activityId, answer);
  res.status(200).json(result);
};
