import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'secops_academy',
});

// Probar la conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error al conectar con la base de datos PostgreSQL:', err.stack);
  }
  console.log('Conexión exitosa a la base de datos PostgreSQL.');
  release();
});

export default pool;
