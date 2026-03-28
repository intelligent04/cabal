/**
 * User Service
 * Manages user accounts, experts, and newcomers
 */

import { User, UserRole, ExpertiseLevel, JobPersonalityAssessment } from '../models/User';

export class UserService {
  private users: Map<string, User> = new Map();

  async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: this.generateUserId(),
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || UserRole.NEWCOMER,
      expertiseLevel: userData.expertiseLevel || ExpertiseLevel.JUNIOR,
      specializations: userData.specializations || [],
      yearsOfExperience: userData.yearsOfExperience || 0,
      hourlyRate: userData.hourlyRate,
      availability: userData.availability !== undefined ? userData.availability : true,
      personalityAssessment: userData.personalityAssessment,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    return this.users.get(userId);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async addPersonalityAssessment(
    userId: string,
    assessment: JobPersonalityAssessment
  ): Promise<User | undefined> {
    return this.updateUser(userId, { personalityAssessment: assessment });
  }

  async findAvailableExperts(specialization?: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === UserRole.EXPERT &&
      user.availability &&
      (user.expertiseLevel === ExpertiseLevel.EXPERT || 
       user.expertiseLevel === ExpertiseLevel.RETIRED_EXPERT) &&
      (!specialization || user.specializations.includes(specialization))
    );
  }

  async findAvailableNewcomers(specialization?: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.role === UserRole.NEWCOMER &&
      user.availability &&
      (!specialization || user.specializations.includes(specialization))
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
