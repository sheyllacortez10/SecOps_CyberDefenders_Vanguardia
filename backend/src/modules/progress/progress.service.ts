import { AppError } from '../../shared/errors/AppError';
import { progressRepository } from './progress.repository';

const mapHistoryItem = (item: any) => ({
  attemptId: item.attempt_id,
  labId: item.lab_id,
  labTitle: item.lab_title,
  activityId: item.activity_id,
  answer: item.answer,
  correct: item.correct,
  pointsEarned: item.points_earned,
  answeredAt: item.answered_at
});

export const progressService = {
  async getUserProgress(userId: string) {
    const progress = await progressRepository.findProgressByUserId(userId);

    if (!progress) {
      throw new AppError(404, 'El recurso solicitado no existe.');
    }

    const totalLabs = await progressRepository.countLabs();
    const badgesCount = await progressRepository.countBadges(userId);
    const labsProgress = await progressRepository.findLabsProgress(userId);

    return {
      userId,
      totalPoints: progress.total_points,
      completedLabs: progress.completed_labs,
      totalLabs,
      progressPercentage: totalLabs === 0 ? 0 : Number(((progress.completed_labs / totalLabs) * 100).toFixed(1)),
      badgesCount,
      labsProgress: labsProgress.map((item: any) => ({
        labId: item.lab_id,
        labTitle: item.lab_title,
        completed: item.completed,
        pointsEarned: item.points_earned,
        attempts: item.attempts
      }))
    };
  },

  async getUserHistory(userId: string, query: Record<string, string | string[] | undefined>) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 50);
    const offset = (page - 1) * limit;
    const { history, total } = await progressRepository.findHistory(userId, limit, offset);

    return {
      userId,
      total,
      page,
      limit,
      history: history.map(mapHistoryItem)
    };
  },

  async getUserBadges(userId: string) {
    const badges = await progressRepository.findBadges(userId);

    return {
      userId,
      badges: badges.map((badge: any) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        category: badge.category,
        iconUrl: badge.icon_url,
        unlockedAt: badge.unlocked_at
      }))
    };
  }
};
