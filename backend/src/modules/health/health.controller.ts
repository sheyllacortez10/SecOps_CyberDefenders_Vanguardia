import { Request, Response } from 'express';
import pool from '../../db';

export const getHealth = async (req: Request, res: Response) => {
  const result = await pool.query('SELECT NOW() as now');

  res.status(200).json({
    status: 'OK',
    message: 'Backend de SecOps Academy está funcionando correctamente.',
    dbTime: result.rows[0].now
  });
};
