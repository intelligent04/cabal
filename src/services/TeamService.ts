/**
 * Team Service
 * Manages team creation, matching, and coordination
 */

import { Team, TeamStatus, TeamMember, TeamCompositionRequest } from '../models/Team';
import { TeamCompositionService } from '../ai/TeamCompositionService';
import { UserService } from './UserService';

export class TeamService {
  private teams: Map<string, Team> = new Map();
  private teamCompositionService: TeamCompositionService;
  private userService: UserService;

  constructor(userService: UserService) {
    this.teamCompositionService = new TeamCompositionService();
    this.userService = userService;
  }

  /**
   * Create a new team using AI-powered composition
   */
  async createTeamForCase(request: TeamCompositionRequest): Promise<Team> {
    // Get available users
    const availableUsers = await this.userService.getAllUsers();

    // Use AI to compose optimal team
    const compositionResult = await this.teamCompositionService.composeTeam(
      request,
      availableUsers
    );

    // Create team
    const team: Team = {
      id: this.generateTeamId(),
      name: `Team for ${request.caseId}`,
      caseId: request.caseId,
      members: compositionResult.recommendedTeam,
      status: TeamStatus.FORMING,
      estimatedBudget: compositionResult.estimatedCost,
      actualBudget: 0,
      estimatedHours: compositionResult.estimatedDuration,
      actualHours: 0,
      domain: request.domain,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.teams.set(team.id, team);

    // Update user availability
    for (const member of team.members) {
      await this.userService.updateUser(member.userId, { availability: false });
    }

    return team;
  }

  async getTeamById(teamId: string): Promise<Team | undefined> {
    return this.teams.get(teamId);
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;

    const updatedTeam = {
      ...team,
      ...updates,
      updatedAt: new Date()
    };

    this.teams.set(teamId, updatedTeam);
    return updatedTeam;
  }

  async activateTeam(teamId: string): Promise<Team | undefined> {
    return this.updateTeam(teamId, { status: TeamStatus.ACTIVE });
  }

  async completeTeam(teamId: string): Promise<Team | undefined> {
    const team = await this.updateTeam(teamId, {
      status: TeamStatus.COMPLETED,
      completedAt: new Date()
    });

    // Free up team members
    if (team) {
      for (const member of team.members) {
        await this.userService.updateUser(member.userId, { availability: true });
      }
    }

    return team;
  }

  async addMember(teamId: string, member: TeamMember): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;

    team.members.push(member);
    return this.updateTeam(teamId, { members: team.members });
  }

  async updateMemberHours(
    teamId: string,
    userId: string,
    hours: number
  ): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;

    const member = team.members.find(m => m.userId === userId);
    if (member) {
      member.contributionHours += hours;
      team.actualHours += hours;
    }

    return this.updateTeam(teamId, {
      members: team.members,
      actualHours: team.actualHours
    });
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeamsByStatus(status: TeamStatus): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(t => t.status === status);
  }

  private generateTeamId(): string {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
