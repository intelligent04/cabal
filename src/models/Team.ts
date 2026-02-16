/**
 * Team model representing a matched team of experts and newcomers
 */

export enum TeamStatus {
  FORMING = 'forming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISBANDED = 'disbanded'
}

export interface TeamMember {
  userId: string;
  role: 'lead' | 'senior' | 'junior' | 'specialist';
  joinedAt: Date;
  contributionHours: number;
}

export interface Team {
  id: string;
  name: string;
  caseId: string;
  members: TeamMember[];
  status: TeamStatus;
  estimatedBudget: number;
  actualBudget: number;
  estimatedHours: number;
  actualHours: number;
  domain: string;              // e.g., 'legal', 'finance', 'consulting'
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TeamCompositionRequest {
  caseId: string;
  domain: string;
  requiredSkills: string[];
  complexity: number;          // 1-10 scale
  estimatedDuration: number;   // in hours
  budget?: number;
}

export interface TeamCompositionResult {
  recommendedTeam: TeamMember[];
  estimatedCost: number;
  estimatedDuration: number;
  confidenceScore: number;     // AI confidence in the recommendation
  reasoning: string;
}
