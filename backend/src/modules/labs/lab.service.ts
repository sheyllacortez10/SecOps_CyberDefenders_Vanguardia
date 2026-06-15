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
  }
};
