/**
 * Example usage of Cabal Platform
 * This file demonstrates how to use the various services
 */

import { UserService } from '../src/services/UserService';
import { CaseService } from '../src/services/CaseService';
import { TeamService } from '../src/services/TeamService';
import { ChatbotService } from '../src/ai/ChatbotService';
import { AgentFactory, AgentDomain } from '../src/ai/DomainAgent';
import { UserRole, ExpertiseLevel } from '../src/models/User';
import { CasePriority } from '../src/models/Case';

async function exampleUsage() {
  console.log('=== Cabal Platform Example Usage ===\n');

  // Initialize services
  const userService = new UserService();
  const caseService = new CaseService();
  const teamService = new TeamService(userService);
  const chatbotService = new ChatbotService();

  // 1. Create users (experts and newcomers)
  console.log('1. Creating users...');
  const expert = await userService.createUser({
    name: '김철수 (은퇴 변호사)',
    email: 'kim@example.com',
    role: UserRole.EXPERT,
    expertiseLevel: ExpertiseLevel.RETIRED_EXPERT,
    specializations: ['contract_law', 'corporate_law'],
    yearsOfExperience: 30,
    hourlyRate: 200,
    availability: true
  });
  console.log('  ✓ Created expert:', expert.name);

  const newcomer = await userService.createUser({
    name: '이영희 (신입 변호사)',
    email: 'lee@example.com',
    role: UserRole.NEWCOMER,
    expertiseLevel: ExpertiseLevel.JUNIOR,
    specializations: ['contract_law'],
    yearsOfExperience: 2,
    hourlyRate: 80,
    availability: true
  });
  console.log('  ✓ Created newcomer:', newcomer.name);

  console.log('\n✅ Example completed successfully!');
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export default exampleUsage;
