import pool from '../../db';

const toJsonbParam = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  return JSON.stringify(value);
};

export type AdminLabInput = {
  id: string;
  title: string;
  description: string;
  category: string;
  owaspRef: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  theory: string;
  vulnerableCode: string;
  vulnerabilityId: string;
};

export const adminRepository = {
  async createLab(input: AdminLabInput) {
    const lab = await pool.query(
      `INSERT INTO labs (id, title, description, category, owasp_ref, difficulty, points, theory, vulnerable_code, vulnerability_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [input.id, input.title, input.description, input.category, input.owaspRef, input.difficulty, input.points, input.theory, input.vulnerableCode, input.vulnerabilityId]
    );

    return lab.rows[0];
  },

  async updateLab(id: string, fields: Record<string, unknown>) {
    const entries = Object.entries(fields).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return null;
    }

    const setClause = entries.map(([field], index) => `${field} = $${index + 2}`).join(', ');
    const values = entries.map(([, value]) => value);

    const result = await pool.query(
      `UPDATE labs SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] ?? null;
  },

  async replaceActivities(labId: string, activities: Array<{ id: string; type: string; question: string; options: unknown; validationStrategy: string; correctAnswer: unknown; explanation?: string }>) {
    await pool.query('DELETE FROM activities WHERE lab_id = $1', [labId]);

    for (const activity of activities) {
      await pool.query(
        `INSERT INTO activities (id, lab_id, type, question, options, validation_strategy, correct_answer, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          activity.id,
          labId,
          activity.type,
          activity.question,
          toJsonbParam(activity.options),
          activity.validationStrategy,
          toJsonbParam(activity.correctAnswer),
          activity.explanation ?? null
        ]
      );
    }
  },

  async deleteLab(id: string) {
    const result = await pool.query('DELETE FROM labs WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] ?? null;
  },

  async metrics() {
    const [users, labs, attempts, completedAttempts, topLabs] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total_users FROM users'),
      pool.query('SELECT COUNT(*)::int AS total_labs FROM labs'),
      pool.query('SELECT COUNT(*)::int AS total_attempts FROM attempts'),
      pool.query('SELECT COUNT(*)::int AS completed_attempts FROM attempts WHERE correct = true'),
      pool.query(
        `SELECT
           l.id AS lab_id,
           l.title AS lab_title,
           COUNT(a.id)::int AS attempts,
           COALESCE(ROUND((COUNT(*) FILTER (WHERE a.correct = true)::numeric / NULLIF(COUNT(a.id), 0)) * 100, 1), 0) AS success_rate
         FROM labs l
         LEFT JOIN attempts a ON a.lab_id = l.id
         GROUP BY l.id, l.title
         ORDER BY attempts DESC
         LIMIT 5`
      )
    ]);

    const totalAttempts = attempts.rows[0]?.total_attempts ?? 0;
    const completedAttemptsValue = completedAttempts.rows[0]?.completed_attempts ?? 0;

    return {
      totalUsers: users.rows[0]?.total_users ?? 0,
      totalLabs: labs.rows[0]?.total_labs ?? 0,
      totalAttempts,
      completedAttempts: completedAttemptsValue,
      successRate: totalAttempts === 0 ? 0 : Number(((completedAttemptsValue / totalAttempts) * 100).toFixed(1)),
      topLabs: topLabs.rows.map((item: { lab_id: string; lab_title: string; attempts: number; success_rate: string | number }) => ({
        labId: item.lab_id,
        labTitle: item.lab_title,
        attempts: item.attempts,
        successRate: Number(item.success_rate)
      }))
    };
  }
};
