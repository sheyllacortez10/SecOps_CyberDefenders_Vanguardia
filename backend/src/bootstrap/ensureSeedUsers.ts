import bcrypt from 'bcryptjs';
import pool from '../db';

type SeedAccount = {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'admin';
};

const seedAccounts: SeedAccount[] = [
  {
    email: 'admin@secops.com',
    password: 'AdminPass123!',
    name: 'Administrador SecOps',
    role: 'admin'
  },
  {
    email: 'estudiante@secops.com',
    password: 'StudentPass123!',
    name: 'Estudiante de Prueba',
    role: 'student'
  }
];

export const ensureSeedUsers = async () => {
  for (const account of seedAccounts) {
    const result = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE email = $1 LIMIT 1',
      [account.email]
    );

    const currentUser = result.rows[0];

    if (!currentUser) {
      continue;
    }

    const passwordMatches = await bcrypt.compare(account.password, currentUser.password_hash).catch(() => false);

    if (passwordMatches) {
      continue;
    }

    const passwordHash = await bcrypt.hash(account.password, 10);

    await pool.query(
      `UPDATE users
       SET name = $1,
           password_hash = $2,
           role = $3
       WHERE email = $4`,
      [account.name, passwordHash, account.role, account.email]
    );
  }
};