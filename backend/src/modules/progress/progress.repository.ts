import pool from '../../db';

export const progressRepository = {
  async findProgressByUserId(userId: string) {
    // Otorgar insignias retroactivamente si cumple con todas las condiciones
    await pool.query(
      `INSERT INTO user_badges (user_id, badge_id)
       SELECT DISTINCT $1, b.id
       FROM badges b
       JOIN (
         SELECT category, COUNT(DISTINCT id) AS completed_count
         FROM (
           SELECT l.category, l.id
           FROM labs l
           JOIN activities act ON act.lab_id = l.id
           LEFT JOIN attempts att ON att.lab_id = l.id AND att.activity_id = act.id AND att.user_id = $1 AND att.correct = true
           GROUP BY l.id, l.category
           HAVING COUNT(act.id) = COUNT(att.id) AND COUNT(act.id) > 0
         ) completed_labs
         GROUP BY category
       ) user_completed ON LOWER(user_completed.category) = LOWER(b.category)
       JOIN (
         SELECT category, COUNT(id) AS total_count
         FROM labs
         GROUP BY category
       ) total_labs ON LOWER(total_labs.category) = LOWER(b.category)
       WHERE user_completed.completed_count = total_labs.total_count
       ON CONFLICT (user_id, badge_id) DO NOTHING`,
      [userId]
    );

    const result = await pool.query(
      `SELECT 
         up.user_id, 
         up.total_points,
         (
           SELECT COUNT(*)::int
           FROM (
             SELECT l.id
             FROM labs l
             JOIN activities act ON act.lab_id = l.id
             LEFT JOIN attempts att ON att.lab_id = l.id AND att.activity_id = act.id AND att.user_id = $1 AND att.correct = true
             GROUP BY l.id
             HAVING COUNT(act.id) = COUNT(att.id) AND COUNT(act.id) > 0
           ) completed
         ) AS completed_labs
       FROM user_progress up
       WHERE up.user_id = $1
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] ?? null;
  },

  async countLabs() {
    const result = await pool.query('SELECT COUNT(*)::int AS total_labs FROM labs');
    return result.rows[0]?.total_labs ?? 0;
  },

  async countBadges(userId: string) {
    const result = await pool.query('SELECT COUNT(*)::int AS badges_count FROM user_badges WHERE user_id = $1', [userId]);
    return result.rows[0]?.badges_count ?? 0;
  },

  async findLabsProgress(userId: string) {
    const result = await pool.query(
      `SELECT
         l.id AS lab_id,
         l.title AS lab_title,
         ((
           SELECT COUNT(DISTINCT a.activity_id)::int 
           FROM attempts a 
           WHERE a.user_id = $1 AND a.lab_id = l.id AND a.correct = true
         ) = (
           SELECT COUNT(*)::int 
           FROM activities act 
           WHERE act.lab_id = l.id
         ) AND (
           SELECT COUNT(*)::int 
           FROM activities act 
           WHERE act.lab_id = l.id
         ) > 0) AS completed,
         COALESCE((SELECT SUM(points_earned) FROM attempts a WHERE a.user_id = $1 AND a.lab_id = l.id), 0)::int AS points_earned,
         COALESCE((SELECT COUNT(*) FROM attempts a WHERE a.user_id = $1 AND a.lab_id = l.id), 0)::int AS attempts
       FROM labs l
       ORDER BY l.created_at DESC`,
      [userId]
    );

    return result.rows;
  },

  async findHistory(userId: string, limit: number, offset: number) {
    const data = await pool.query(
      `SELECT
         a.id AS attempt_id,
         a.lab_id,
         l.title AS lab_title,
         a.activity_id,
         a.answer,
         a.correct,
         a.points_earned,
         a.answered_at
       FROM attempts a
       INNER JOIN labs l ON l.id = a.lab_id
       WHERE a.user_id = $1
       ORDER BY a.answered_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const count = await pool.query('SELECT COUNT(*)::int AS total FROM attempts WHERE user_id = $1', [userId]);

    return {
      history: data.rows,
      total: count.rows[0]?.total ?? 0
    };
  },

  async findBadges(userId: string) {
    const result = await pool.query(
      `SELECT
         b.id,
         b.name,
         b.description,
         b.category,
         b.icon_url,
         ub.unlocked_at
       FROM user_badges ub
       INNER JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.unlocked_at DESC`,
      [userId]
    );

    return result.rows;
  }
};
