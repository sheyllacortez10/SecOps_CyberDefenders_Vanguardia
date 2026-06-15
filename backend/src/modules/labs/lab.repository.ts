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
  }
};
