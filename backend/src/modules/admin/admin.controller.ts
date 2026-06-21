import { Request, Response } from 'express';
import { adminService } from './admin.service';

export const createLab = async (req: Request, res: Response) => {
  const result = await adminService.createLab(req.body);
  res.status(201).json(result);
};

export const updateLab = async (req: Request, res: Response) => {
  const result = await adminService.updateLab(req.params.id, req.body);
  res.status(200).json(result);
};

export const deleteLab = async (req: Request, res: Response) => {
  await adminService.deleteLab(req.params.id);
  res.status(204).send();
};

export const getMetrics = async (req: Request, res: Response) => {
  const result = await adminService.getMetrics();
  res.status(200).json(result);
};

export const getLabByIdForAdmin = async (req: Request, res: Response) => {
  const result = await adminService.getLabByIdForAdmin(req.params.id);
  res.status(200).json(result);
};
