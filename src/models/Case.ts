/**
 * Case model representing legal cases or projects
 */

export enum CaseStatus {
  PENDING = 'pending',
  IN_CONSULTATION = 'in_consultation',
  TEAM_ASSIGNED = 'team_assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface CaseConsultation {
  consultationId: string;
  summary: string;              // AI-generated summary
  originalTranscript: string;   // Original conversation
  keyPoints: string[];
  estimatedComplexity: number;  // 1-10 scale
  recommendedSpecializations: string[];
  consultedAt: Date;
}

export interface Case {
  id: string;
  clientId: string;
  title: string;
  description: string;
  domain: string;
  status: CaseStatus;
  priority: CasePriority;
  consultation?: CaseConsultation;
  assignedTeamId?: string;
  estimatedBudget?: number;
  actualBudget?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
