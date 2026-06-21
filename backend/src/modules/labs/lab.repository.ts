import pool from '../../db';

export type LabRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  owasp_ref: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  theory: string;
  vulnerable_code: string;
  vulnerability_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export const labRepository = {
  async findAll(filters: { category?: string; difficulty?: string; limit: number; offset: number }) {
    const where: string[] = [];
    const values: Array<string | number> = [];

    if (filters.category) {
      values.push(filters.category);
      where.push(`category = $${values.length}`);
    }

    if (filters.difficulty) {
      values.push(filters.difficulty);
      where.push(`difficulty = $${values.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    values.push(filters.limit, filters.offset);

    const dataQuery = `
      SELECT id, title, description, category, owasp_ref, difficulty, points, theory, vulnerable_code, vulnerability_id, created_at, updated_at
      FROM labs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const countQuery = `SELECT COUNT(*)::int AS total FROM labs ${whereClause}`;

    const [rows, count] = await Promise.all([
      pool.query<LabRow>(dataQuery, values),
      pool.query(countQuery, values.slice(0, values.length - 2))
    ]);

    return {
      labs: rows.rows,
      total: count.rows[0]?.total ?? 0
    };
  },

  async findById(id: string) {
    const result = await pool.query<LabRow>(
      `SELECT id, title, description, category, owasp_ref, difficulty, points, theory, vulnerable_code, vulnerability_id, created_at, updated_at
       FROM labs
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  },

  async findVulnerabilityById(id: string) {
    const result = await pool.query(
      `SELECT id, name, owasp_category, severity, cwe_id
       FROM vulnerabilities
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    return result.rows[0] ?? null;
  },

  async findActivitiesByLabId(labId: string) {
    const result = await pool.query(
      `SELECT id, type, question, options, validation_strategy, correct_answer, explanation
       FROM activities
       WHERE lab_id = $1
       ORDER BY id ASC`,
      [labId]
    );

    return result.rows;
  },

  async findActivityById(labId: string, activityId: string) {
    const result = await pool.query(
      `SELECT id, lab_id, type, question, options, validation_strategy, correct_answer, explanation
       FROM activities
       WHERE lab_id = $1 AND id = $2
       LIMIT 1`,
      [labId, activityId]
    );
    return result.rows[0] ?? null;
  },

  async findCorrectAttempt(userId: string, labId: string, activityId: string) {
    const result = await pool.query(
      `SELECT id, user_id, lab_id, activity_id, answer, correct, points_earned, answered_at
       FROM attempts
       WHERE user_id = $1 AND lab_id = $2 AND activity_id = $3 AND correct = true
       LIMIT 1`,
      [userId, labId, activityId]
    );
    return result.rows[0] ?? null;
  },

  async insertAttempt(attempt: { id: string; userId: string; labId: string; activityId: string; answer: any; correct: boolean; pointsEarned: number }) {
    await pool.query(
      `INSERT INTO attempts (id, user_id, lab_id, activity_id, answer, correct, points_earned)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [attempt.id, attempt.userId, attempt.labId, attempt.activityId, JSON.stringify(attempt.answer), attempt.correct, attempt.pointsEarned]
    );
  },

  async getLabCompletionStats(userId: string, labId: string) {
    const totalResult = await pool.query('SELECT COUNT(*)::int AS total FROM activities WHERE lab_id = $1', [labId]);
    const solvedResult = await pool.query(
      `SELECT COUNT(DISTINCT activity_id)::int AS solved
       FROM attempts
       WHERE user_id = $1 AND lab_id = $2 AND correct = true`,
      [userId, labId]
    );
    const total = totalResult.rows[0]?.total ?? 0;
    const solved = solvedResult.rows[0]?.solved ?? 0;
    return { total, solved };
  },

  async updateUserProgress(userId: string, pointsEarned: number, incrementCompletedLabs: boolean) {
    await pool.query(
      `UPDATE user_progress
       SET total_points = total_points + $1,
           completed_labs = completed_labs + $2
       WHERE user_id = $3`,
      [pointsEarned, incrementCompletedLabs ? 1 : 0, userId]
    );
  },

  async checkAndAwardCategoryBadge(userId: string, category: string) {
    // 1. Obtener todos los labs de esta categoría
    const labsResult = await pool.query('SELECT id FROM labs WHERE category = $1', [category]);
    const labs = labsResult.rows.map(r => r.id);
    if (labs.length === 0) return null;

    // 2. Contar cuántos de estos labs ha completado el usuario.
    let completedLabsCount = 0;
    for (const labId of labs) {
      const totalActivitiesResult = await pool.query('SELECT COUNT(*)::int AS total FROM activities WHERE lab_id = $1', [labId]);
      const solvedActivitiesResult = await pool.query(
        `SELECT COUNT(DISTINCT activity_id)::int AS solved
         FROM attempts
         WHERE user_id = $1 AND lab_id = $2 AND correct = true`,
        [userId, labId]
      );
      const total = totalActivitiesResult.rows[0]?.total ?? 0;
      const solved = solvedActivitiesResult.rows[0]?.solved ?? 0;
      if (total > 0 && solved === total) {
        completedLabsCount++;
      }
    }

    // Si completó todos los laboratorios de la categoría
    if (completedLabsCount === labs.length) {
      // Buscar la insignia asociada a esta categoría (comparamos sin importar mayúsculas/minúsculas)
      const badgeResult = await pool.query(
        `SELECT id FROM badges WHERE LOWER(category) = LOWER($1) LIMIT 1`,
        [category]
      );
      const badge = badgeResult.rows[0];
      if (badge) {
        // Verificar si ya la tiene
        const hasBadgeResult = await pool.query(
          'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2 LIMIT 1',
          [userId, badge.id]
        );
        if (hasBadgeResult.rows.length === 0) {
          // Otorgar la insignia
          await pool.query(
            'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, badge.id]
          );
          // Retornar información de la insignia desbloqueada
          const badgeDetails = await pool.query('SELECT * FROM badges WHERE id = $1', [badge.id]);
          return badgeDetails.rows[0];
        }
      }
    }
    return null;
  }
};
