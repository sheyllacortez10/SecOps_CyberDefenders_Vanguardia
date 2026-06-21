import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'admin';
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError(401, 'No autenticado. Token ausente.'));
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string; role: 'student' | 'admin' };
    req.user = {
      id: payload.sub,
      role: payload.role
    };
    next();
  } catch (err) {
    return next(new AppError(401, 'No autenticado. Token inválido o expirado.'));
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de administrador.'));
  }
  next();
};
