import { AppError } from '../../shared/errors/AppError';
import { labRepository } from './lab.repository';

type LabQuery = {
  category?: string;
  difficulty?: string;
  page?: string;
  limit?: string;
};

const mapLabSummary = (lab: any) => ({
  id: lab.id,
  title: lab.title,
  description: lab.description,
  category: lab.category,
  owaspRef: lab.owasp_ref,
  difficulty: lab.difficulty,
  points: lab.points,
  completedByUser: false
});

const mapLabDetail = (lab: any, vulnerability: any, activities: any[]) => ({
  id: lab.id,
  title: lab.title,
  description: lab.description,
  category: lab.category,
  owaspRef: lab.owasp_ref,
  difficulty: lab.difficulty,
  points: lab.points,
  theory: lab.theory,
  vulnerableCode: lab.vulnerable_code,
  vulnerability: vulnerability
    ? {
      id: vulnerability.id,
      name: vulnerability.name,
      owaspCategory: vulnerability.owasp_category,
      severity: vulnerability.severity,
      cweId: vulnerability.cwe_id
    }
    : null,
  activities: activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    question: activity.question,
    options: activity.options,
    validationStrategy: activity.validation_strategy
  })),
  createdAt: lab.created_at,
  updatedAt: lab.updated_at
});

export const labService = {
  async listLabs(query: LabQuery) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
    const offset = (page - 1) * limit;

    const { labs, total } = await labRepository.findAll({
      category: query.category,
      difficulty: query.difficulty,
      limit,
      offset
    });

    return {
      total,
      page,
      limit,
      labs: labs.map(mapLabSummary)
    };
  },

  async getLabById(id: string) {
    const lab = await labRepository.findById(id);

    if (!lab) {
      throw new AppError(404, 'El recurso solicitado no existe.');
    }

    const vulnerability = lab.vulnerability_id ? await labRepository.findVulnerabilityById(lab.vulnerability_id) : null;
    const activities = await labRepository.findActivitiesByLabId(id);

    return mapLabDetail(lab, vulnerability, activities);
  },

  async submitAnswer(userId: string, labId: string, activityId: string, answer: any) {
    const lab = await labRepository.findById(labId);
    if (!lab) {
      throw new AppError(404, 'El laboratorio no existe.');
    }

    const activity = await labRepository.findActivityById(labId, activityId);
    if (!activity) {
      throw new AppError(404, 'La actividad no existe.');
    }

    // Normalizar respuestas para comparación
    const formatAnswer = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return val.trim();
      return JSON.stringify(val).trim();
    };

    const userAnswerStr = formatAnswer(answer);
    const correctAnswerStr = formatAnswer(activity.correct_answer);

    let isCorrect = false;
    if (activity.validation_strategy === 'exact_match' || activity.validation_strategy === 'predefined_list') {
      isCorrect = userAnswerStr.toLowerCase() === correctAnswerStr.toLowerCase();
    } else if (activity.validation_strategy === 'keyword_match') {
      isCorrect = userAnswerStr.toLowerCase().includes(correctAnswerStr.toLowerCase());
    } else {
      isCorrect = userAnswerStr.toLowerCase() === correctAnswerStr.toLowerCase();
    }

    // Verificar si ya tiene un intento correcto previo
    const existingCorrectAttempt = await labRepository.findCorrectAttempt(userId, labId, activityId);

    let pointsEarned = 0;
    let labCompletedNow = false;
    let unlockedBadge = null;

    if (isCorrect) {
      if (!existingCorrectAttempt) {
        // Calcular puntos para esta actividad
        const stats = await labRepository.getLabCompletionStats(userId, labId);
        const totalActivities = stats.total || 1;
        const solvedBefore = stats.solved || 0;

        // Puntos base por actividad
        const basePoints = Math.floor(lab.points / totalActivities);

        // Si es la última actividad en resolver del lab, sumamos los puntos restantes
        if (solvedBefore + 1 === totalActivities) {
          pointsEarned = lab.points - (basePoints * (totalActivities - 1));
          labCompletedNow = true;
        } else {
          pointsEarned = basePoints;
        }

        // Insertar el intento correcto
        const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await labRepository.insertAttempt({
          id: attemptId,
          userId,
          labId,
          activityId,
          answer,
          correct: true,
          pointsEarned
        });

        // Actualizar el progreso del usuario
        await labRepository.updateUserProgress(userId, pointsEarned, labCompletedNow);

        // Si se completó el lab, ver si califica para insignias
        if (labCompletedNow) {
          unlockedBadge = await labRepository.checkAndAwardCategoryBadge(userId, lab.category);
        }
      } else {
        // Ya resuelto previamente, no gana puntos adicionales
        pointsEarned = 0;
        labCompletedNow = false;
      }
    } else {
      // Intento incorrecto
      const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await labRepository.insertAttempt({
        id: attemptId,
        userId,
        labId,
        activityId,
        answer,
        correct: false,
        pointsEarned: 0
      });
    }

    return {
      correct: isCorrect,
      explanation: activity.explanation,
      pointsEarned,
      labCompleted: labCompletedNow,
      unlockedBadge
    };
  }
};
