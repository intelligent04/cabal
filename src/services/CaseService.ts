/**
 * Case Service
 * Manages legal cases and projects
 */

import { Case, CaseStatus, CasePriority, CaseConsultation } from '../models/Case';

export class CaseService {
  private cases: Map<string, Case> = new Map();

  async createCase(caseData: Partial<Case>): Promise<Case> {
    const newCase: Case = {
      id: this.generateCaseId(),
      clientId: caseData.clientId || '',
      title: caseData.title || '',
      description: caseData.description || '',
      domain: caseData.domain || 'general',
      status: CaseStatus.PENDING,
      priority: caseData.priority || CasePriority.MEDIUM,
      consultation: caseData.consultation,
      assignedTeamId: caseData.assignedTeamId,
      estimatedBudget: caseData.estimatedBudget,
      actualBudget: caseData.actualBudget,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.cases.set(newCase.id, newCase);
    return newCase;
  }

  async getCaseById(caseId: string): Promise<Case | undefined> {
    return this.cases.get(caseId);
  }

  async updateCase(caseId: string, updates: Partial<Case>): Promise<Case | undefined> {
    const caseData = this.cases.get(caseId);
    if (!caseData) return undefined;

    const updatedCase = {
      ...caseData,
      ...updates,
      updatedAt: new Date()
    };

    this.cases.set(caseId, updatedCase);
    return updatedCase;
  }

  async addConsultation(
    caseId: string,
    consultation: CaseConsultation
  ): Promise<Case | undefined> {
    return this.updateCase(caseId, {
      consultation,
      status: CaseStatus.IN_CONSULTATION
    });
  }

  async assignTeam(caseId: string, teamId: string): Promise<Case | undefined> {
    return this.updateCase(caseId, {
      assignedTeamId: teamId,
      status: CaseStatus.TEAM_ASSIGNED
    });
  }

  async startCase(caseId: string): Promise<Case | undefined> {
    return this.updateCase(caseId, {
      status: CaseStatus.IN_PROGRESS
    });
  }

  async completeCase(caseId: string): Promise<Case | undefined> {
    return this.updateCase(caseId, {
      status: CaseStatus.COMPLETED,
      completedAt: new Date()
    });
  }

  async getAllCases(): Promise<Case[]> {
    return Array.from(this.cases.values());
  }

  async getCasesByStatus(status: CaseStatus): Promise<Case[]> {
    return Array.from(this.cases.values()).filter(c => c.status === status);
  }

  private generateCaseId(): string {
    return `case_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
