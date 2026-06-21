import { AppError } from '../../shared/errors/AppError';
import { adminRepository } from './admin.repository';
import { labRepository } from '../labs/lab.repository';

const mapLabDetail = (lab: any) => ({
  id: lab.id,
  title: lab.title,
  description: lab.description,
  category: lab.category,
  owaspRef: lab.owasp_ref,
  difficulty: lab.difficulty,
  points: lab.points,
  theory: lab.theory,
  vulnerableCode: lab.vulnerable_code,
  vulnerability: lab.vulnerability_id ? { id: lab.vulnerability_id } : null,
  activities: []
});

const mapAdminLabDetail = (lab: any, vulnerability: any, activities: any[]) => ({
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
    validationStrategy: activity.validation_strategy,
    correctAnswer: activity.correct_answer,
    explanation: activity.explanation
  }))
});

export const adminService = {
  async createLab(input: any) {
    const lab = await adminRepository.createLab({
      id: `lab-${Date.now()}`,
      title: input.title,
      description: input.description,
      category: input.category,
      owaspRef: input.owaspRef,
      difficulty: input.difficulty,
      points: input.points,
      theory: input.theory,
      vulnerableCode: input.vulnerableCode,
      vulnerabilityId: input.vulnerabilityId
    });

    await adminRepository.replaceActivities(lab.id, (input.activities ?? []).map((activity: any, index: number) => ({
      id: `act-${lab.id}-${index + 1}`,
      type: activity.type,
      question: activity.question,
      options: activity.options ?? null,
      validationStrategy: activity.validationStrategy,
      correctAnswer: activity.correctAnswer,
      explanation: activity.explanation ?? null
    })));

    return mapLabDetail(lab);
  },

  async updateLab(id: string, input: any) {
    const updatedLab = await adminRepository.updateLab(id, {
      title: input.title,
      description: input.description,
      category: input.category,
      owasp_ref: input.owaspRef,
      difficulty: input.difficulty,
      points: input.points,
      theory: input.theory,
      vulnerable_code: input.vulnerableCode,
      vulnerability_id: input.vulnerabilityId
    });

    if (!updatedLab) {
      throw new AppError(404, 'El recurso solicitado no existe.');
    }

    if (input.activities) {
      const activities = input.activities.map((activity: any, index: number) => ({
        id: activity.id || `act-${id}-${index + 1}`,
        type: activity.type,
        question: activity.question,
        options: activity.options ?? null,
        validationStrategy: activity.validationStrategy,
        correctAnswer: activity.correctAnswer,
        explanation: activity.explanation ?? null
      }));

      await adminRepository.replaceActivities(id, activities);
    }

    return mapLabDetail(updatedLab);
  },

  async deleteLab(id: string) {
    const deletedLab = await adminRepository.deleteLab(id);

    if (!deletedLab) {
      throw new AppError(404, 'El recurso solicitado no existe.');
    }
  },

  async getMetrics() {
    return adminRepository.metrics();
  },

  async getLabByIdForAdmin(id: string) {
    const lab = await labRepository.findById(id);

    if (!lab) {
      throw new AppError(404, 'El recurso solicitado no existe.');
    }

    const vulnerability = lab.vulnerability_id ? await labRepository.findVulnerabilityById(lab.vulnerability_id) : null;
    const activities = await labRepository.findActivitiesByLabId(id);

    return mapAdminLabDetail(lab, vulnerability, activities);
  }
};
