import pool from '../../db';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'student' | 'admin';
  created_at: Date;
};

export const authRepository = {
  async findUserByEmail(email: string) {
    const result = await pool.query<UserRecord>(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    return result.rows[0] ?? null;
  },

  async createUser(user: { id: string; name: string; email: string; passwordHash: string; role: 'student' | 'admin' }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role, created_at`,
        [user.id, user.name, user.email, user.passwordHash, user.role]
      );

      await client.query(
        `INSERT INTO user_progress (user_id, total_points, completed_labs)
         VALUES ($1, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};
