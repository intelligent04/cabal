/**
 * API Routes for the Cabal platform
 */

import express, { Request, Response, Router } from 'express';
import { UserService } from '../services/UserService';
import { CaseService } from '../services/CaseService';
import { TeamService } from '../services/TeamService';
import { ChatbotService } from '../ai/ChatbotService';
import { AgentFactory, AgentDomain } from '../ai/DomainAgent';

export class ApiRoutes {
  private router: Router;
  private userService: UserService;
  private caseService: CaseService;
  private teamService: TeamService;
  private chatbotService: ChatbotService;

  constructor() {
    this.router = express.Router();
    this.userService = new UserService();
    this.caseService = new CaseService();
    this.teamService = new TeamService(this.userService);
    this.chatbotService = new ChatbotService();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.router.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date() });
    });

    // User routes
    this.router.post('/users', this.createUser.bind(this));
    this.router.get('/users', this.getAllUsers.bind(this));
    this.router.get('/users/:id', this.getUserById.bind(this));
    this.router.put('/users/:id', this.updateUser.bind(this));
    this.router.get('/users/experts/available', this.getAvailableExperts.bind(this));

    // Case routes
    this.router.post('/cases', this.createCase.bind(this));
    this.router.get('/cases', this.getAllCases.bind(this));
    this.router.get('/cases/:id', this.getCaseById.bind(this));
    this.router.put('/cases/:id', this.updateCase.bind(this));

    // Consultation routes (AI chatbot)
    this.router.post('/consultations/start', this.startConsultation.bind(this));
    this.router.post('/consultations/:sessionId/message', this.sendMessage.bind(this));
    this.router.post('/consultations/:sessionId/complete', this.completeConsultation.bind(this));

    // Team routes
    this.router.post('/teams', this.createTeam.bind(this));
    this.router.get('/teams', this.getAllTeams.bind(this));
    this.router.get('/teams/:id', this.getTeamById.bind(this));
    this.router.put('/teams/:id/activate', this.activateTeam.bind(this));
    this.router.put('/teams/:id/complete', this.completeTeam.bind(this));

    // AI Agent routes
    this.router.post('/agents/:domain/query', this.queryAgent.bind(this));
    this.router.get('/agents', this.getAllAgents.bind(this));
  }

  // User endpoints
  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  private async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id);
      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id);
      const user = await this.userService.updateUser(userId, req.body);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  private async getAvailableExperts(_req: Request, res: Response): Promise<void> {
    try {
      const experts = await this.userService.findAvailableExperts();
      res.json(experts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get experts' });
    }
  }

  // Case endpoints
  private async createCase(req: Request, res: Response): Promise<void> {
    try {
      const caseData = await this.caseService.createCase(req.body);
      res.status(201).json(caseData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create case' });
    }
  }

  private async getAllCases(_req: Request, res: Response): Promise<void> {
    try {
      const cases = await this.caseService.getAllCases();
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get cases' });
    }
  }

  private async getCaseById(req: Request, res: Response): Promise<void> {
    try {
      const caseId = String(req.params.id);
      const caseData = await this.caseService.getCaseById(caseId);
      if (!caseData) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      res.json(caseData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get case' });
    }
  }

  private async updateCase(req: Request, res: Response): Promise<void> {
    try {
      const caseId = String(req.params.id);
      const caseData = await this.caseService.updateCase(caseId, req.body);
      if (!caseData) {
        res.status(404).json({ error: 'Case not found' });
        return;
      }
      res.json(caseData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update case' });
    }
  }

  // Consultation endpoints (AI Chatbot)
  private async startConsultation(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.body;
      const session = await this.chatbotService.startConsultation(clientId);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start consultation' });
    }
  }

  private async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, we would retrieve the session from storage
      // For now, we'll expect the session to be sent with the request
      const { session, message } = req.body;
      const response = await this.chatbotService.processMessage(session, message);
      res.json({ response, session });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process message' });
    }
  }

  private async completeConsultation(req: Request, res: Response): Promise<void> {
    try {
      const { session } = req.body;
      const summary = await this.chatbotService.generateConsultationSummary(session);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete consultation' });
    }
  }

  // Team endpoints
  private async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const team = await this.teamService.createTeamForCase(req.body);
      res.status(201).json(team);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create team' });
    }
  }

  private async getAllTeams(_req: Request, res: Response): Promise<void> {
    try {
      const teams = await this.teamService.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get teams' });
    }
  }

  private async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const teamId = String(req.params.id);
      const team = await this.teamService.getTeamById(teamId);
      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get team' });
    }
  }

  private async activateTeam(req: Request, res: Response): Promise<void> {
    try {
      const teamId = String(req.params.id);
      const team = await this.teamService.activateTeam(teamId);
      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: 'Failed to activate team' });
    }
  }

  private async completeTeam(req: Request, res: Response): Promise<void> {
    try {
      const teamId = String(req.params.id);
      const team = await this.teamService.completeTeam(teamId);
      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }
      res.json(team);
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete team' });
    }
  }

  // AI Agent endpoints
  private async queryAgent(req: Request, res: Response): Promise<void> {
    try {
      const domain = req.params.domain as AgentDomain;
      const { query, context } = req.body;
      
      const agent = AgentFactory.createAgent(domain);
      const response = await agent.processQuery(query, context);
      
      res.json({ response, agent: agent.getName() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to query agent' });
    }
  }

  private async getAllAgents(_req: Request, res: Response): Promise<void> {
    try {
      const agents = AgentFactory.getAllAgents().map(agent => ({
        domain: agent.getDomain(),
        name: agent.getName()
      }));
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get agents' });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
