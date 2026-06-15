import dotenv from 'dotenv';
import app from './app';
import { ensureSeedUsers } from './bootstrap/ensureSeedUsers';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

const startServer = async () => {
  await ensureSeedUsers();

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
};

void startServer();
