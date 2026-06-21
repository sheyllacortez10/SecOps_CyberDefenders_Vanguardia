import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import labRoutes from './modules/labs/lab.routes';
import progressRoutes from './modules/progress/progress.routes';
import adminRoutes from './modules/admin/admin.routes';
import { notFoundHandler } from './shared/http/notFoundHandler';
import { errorHandler } from './shared/http/errorHandler';

const app = express();

// Cargar la documentación de Swagger
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

app.use(cors());
app.use(express.json());

// Servir la documentación visual interactiva
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', labRoutes);
app.use('/api', progressRoutes);
app.use('/api', adminRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'SecOps CyberDefenders',
    version: '1.0.0',
    status: 'Development',
    description: 'Plataforma para aprendizaje de ciberseguridad',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      labs: '/api/labs',
      progress: '/api/progress',
      history: '/api/history',
      badges: '/api/badges',
      admin: '/api/admin'
    }
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
