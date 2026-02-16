/**
 * Team Composition Service using AI
 * Automatically determines optimal team structure, personnel, and budget
 */

import { User, ExpertiseLevel } from '../models/User';
import { TeamCompositionRequest, TeamCompositionResult, TeamMember } from '../models/Team';

export class TeamCompositionService {
  /**
   * AI-powered team composition
   * Uses job personality assessment, skills, and domain requirements
   */
  async composeTeam(
    request: TeamCompositionRequest,
    availableUsers: User[]
  ): Promise<TeamCompositionResult> {
    // Filter available users by domain expertise
    const domainExperts = this.filterByDomain(availableUsers, request.domain, request.requiredSkills);

    // Calculate optimal team size based on complexity
    const teamSize = this.calculateTeamSize(request.complexity, request.estimatedDuration);

    // Select team members using AI matching algorithm
    const selectedMembers = await this.selectOptimalTeam(
      domainExperts,
      teamSize,
      request
    );

    // Calculate cost and duration
    const estimatedCost = this.calculateTeamCost(selectedMembers, availableUsers, request.estimatedDuration);
    const estimatedDuration = this.estimateProjectDuration(selectedMembers, request);

    // Generate reasoning for the composition
    const reasoning = this.generateCompositionReasoning(selectedMembers, request);

    return {
      recommendedTeam: selectedMembers,
      estimatedCost,
      estimatedDuration,
      confidenceScore: this.calculateConfidence(selectedMembers, request),
      reasoning
    };
  }

  /**
   * Assess job personality for team compatibility
   */
  async assessPersonality(_userId: string, _responses: any): Promise<any> {
    // Placeholder for personality assessment
    // Would integrate with psychometric testing APIs
    return {
      communicationStyle: 7,
      leadershipAbility: 6,
      technicalProficiency: 8,
      problemSolvingSkill: 7,
      teamworkOrientation: 9,
      creativityLevel: 6,
      assessmentDate: new Date()
    };
  }

  private filterByDomain(users: User[], _domain: string, requiredSkills: string[]): User[] {
    return users.filter(user => {
      const hasSkills = requiredSkills.some(skill => 
        user.specializations.includes(skill)
      );
      return user.availability && hasSkills;
    });
  }

  private calculateTeamSize(complexity: number, estimatedHours: number): number {
    // Simple heuristic: more complex = more people needed
    if (complexity >= 8 || estimatedHours > 200) return 5;
    if (complexity >= 6 || estimatedHours > 100) return 4;
    if (complexity >= 4 || estimatedHours > 50) return 3;
    return 2;
  }

  private async selectOptimalTeam(
    candidates: User[],
    teamSize: number,
    request: TeamCompositionRequest
  ): Promise<TeamMember[]> {
    const teamMembers: TeamMember[] = [];

    // Separate experts and newcomers
    const experts = candidates.filter(u => 
      u.expertiseLevel === ExpertiseLevel.EXPERT || 
      u.expertiseLevel === ExpertiseLevel.RETIRED_EXPERT
    );
    const seniors = candidates.filter(u => 
      u.expertiseLevel === ExpertiseLevel.SENIOR
    );
    const juniors = candidates.filter(u => 
      u.expertiseLevel === ExpertiseLevel.JUNIOR || 
      u.expertiseLevel === ExpertiseLevel.INTERMEDIATE
    );

    // Always include at least one expert (retired professional)
    if (experts.length > 0) {
      const leadExpert = this.selectBestMatch(experts, request);
      teamMembers.push({
        userId: leadExpert.id,
        role: 'lead',
        joinedAt: new Date(),
        contributionHours: 0
      });
    }

    // Add seniors if needed
    const seniorsNeeded = Math.floor(teamSize / 2);
    for (let i = 0; i < Math.min(seniorsNeeded, seniors.length); i++) {
      teamMembers.push({
        userId: seniors[i]!.id,
        role: 'senior',
        joinedAt: new Date(),
        contributionHours: 0
      });
    }

    // Add juniors (newcomers)
    const juniorsNeeded = teamSize - teamMembers.length;
    for (let i = 0; i < Math.min(juniorsNeeded, juniors.length); i++) {
      teamMembers.push({
        userId: juniors[i]!.id,
        role: 'junior',
        joinedAt: new Date(),
        contributionHours: 0
      });
    }

    return teamMembers;
  }

  private selectBestMatch(candidates: User[], request: TeamCompositionRequest): User {
    // AI-based matching (simplified version)
    // Would use more sophisticated matching algorithm with personality assessment
    return candidates.reduce((best, current) => {
      const currentScore = this.calculateMatchScore(current, request);
      const bestScore = this.calculateMatchScore(best, request);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateMatchScore(user: User, request: TeamCompositionRequest): number {
    let score = 0;
    
    // Match by skills
    const skillMatch = request.requiredSkills.filter(skill => 
      user.specializations.includes(skill)
    ).length;
    score += skillMatch * 10;

    // Bonus for experience
    score += user.yearsOfExperience;

    // Personality assessment bonus
    if (user.personalityAssessment) {
      score += user.personalityAssessment.technicalProficiency;
      score += user.personalityAssessment.problemSolvingSkill;
    }

    return score;
  }

  private calculateTeamCost(
    members: TeamMember[],
    allUsers: User[],
    hours: number
  ): number {
    return members.reduce((total, member) => {
      const user = allUsers.find(u => u.id === member.userId);
      const rate = user?.hourlyRate || 50;
      return total + (rate * hours);
    }, 0);
  }

  private estimateProjectDuration(
    members: TeamMember[],
    request: TeamCompositionRequest
  ): number {
    // Adjust duration based on team size and composition
    const teamSizeMultiplier = 1 / Math.sqrt(members.length);
    return Math.ceil(request.estimatedDuration * teamSizeMultiplier);
  }

  private calculateConfidence(members: TeamMember[], _request: TeamCompositionRequest): number {
    // Confidence based on team composition quality
    const hasLead = members.some(m => m.role === 'lead');
    const hasBalancedRoles = members.length >= 2;
    
    let confidence = 0.5;
    if (hasLead) confidence += 0.3;
    if (hasBalancedRoles) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  private generateCompositionReasoning(
    members: TeamMember[],
    request: TeamCompositionRequest
  ): string {
    const roles = members.map(m => m.role).join(', ');
    return `팀 구성: ${members.length}명 (${roles}). 복잡도 ${request.complexity}/10을 고려하여 전문가와 신입을 균형있게 배치했습니다. 도메인 전문성과 팀워크를 최적화했습니다.`;
  }
}
