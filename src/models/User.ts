/**
 * User model representing both experts and newcomers
 */

export enum UserRole {
  EXPERT = 'expert',      // Retired professional/mentor
  NEWCOMER = 'newcomer',  // Junior/new professional
  ADMIN = 'admin'
}

export enum ExpertiseLevel {
  JUNIOR = 'junior',
  INTERMEDIATE = 'intermediate',
  SENIOR = 'senior',
  EXPERT = 'expert',
  RETIRED_EXPERT = 'retired_expert'
}

export interface JobPersonalityAssessment {
  communicationStyle: number;      // 1-10 scale
  leadershipAbility: number;
  technicalProficiency: number;
  problemSolvingSkill: number;
  teamworkOrientation: number;
  creativityLevel: number;
  assessmentDate: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  expertiseLevel: ExpertiseLevel;
  specializations: string[];        // e.g., ['contract_law', 'corporate_law']
  yearsOfExperience: number;
  hourlyRate?: number;
  availability: boolean;
  personalityAssessment?: JobPersonalityAssessment;
  createdAt: Date;
  updatedAt: Date;
}
