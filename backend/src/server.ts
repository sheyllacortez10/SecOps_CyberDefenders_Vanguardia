import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'OK',
      message: 'Backend de SecOps Academy está funcionando correctamente.',
      dbTime: result.rows[0].now,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Backend está vivo, pero falló la conexión a la base de datos.',
      error: error.message,
    });
  }
});

// Base Route
app.get('/api', (req, res) => {
  res.json({
    message: 'SecOps CyberDefenders',
    version: '1.0.0',
    status: 'Development',
    description: 'Plataforma para aprendizaje de ciberseguridad',
    endpoints: {
      health: '/api/health'
    }
  });
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
