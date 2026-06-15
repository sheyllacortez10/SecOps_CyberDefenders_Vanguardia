import { Request, Response } from 'express';
import { authService } from './auth.service';

export const registerUser = async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const loginUser = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
};
