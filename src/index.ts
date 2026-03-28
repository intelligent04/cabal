/**
 * Main application file for Cabal platform
 * AI-powered legal services matching platform
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { ApiRoutes } from './api/routes';

class CabalApp {
  private app: Express;
  private port: number;

  constructor() {
    this.app = express();
    this.port = Number(config.port);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS
    this.app.use(cors(config.cors));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Welcome route
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        name: 'Cabal - AI Legal Services Platform',
        description: '법무를 MVP로 시작해 은퇴 전문가(사수)와 신입을 팀으로 매칭하고, AI가 팀 구성·인원·예산을 자동 산정해 사건을 수행하는 플랫폼',
        version: '1.0.0',
        features: [
          'AI-powered team composition',
          'Expert-newcomer matching',
          'Automated budget calculation',
          'AI chatbot consultation',
          'Job personality assessment',
          'Domain-specific AI agents (RAG + LoRA)',
          'Remote collaboration support'
        ],
        endpoints: {
          health: '/api/health',
          users: '/api/users',
          cases: '/api/cases',
          teams: '/api/teams',
          consultations: '/api/consultations',
          agents: '/api/agents'
        }
      });
    });

    // API routes
    const apiRoutes = new ApiRoutes();
    this.app.use('/api', apiRoutes.getRouter());
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: config.env === 'development' ? err.message : 'An error occurred'
      });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('='.repeat(60));
      console.log('🚀 Cabal Platform Started');
      console.log('='.repeat(60));
      console.log(`Environment: ${config.env}`);
      console.log(`Server running on http://localhost:${this.port}`);
      console.log(`API available at http://localhost:${this.port}/api`);
      console.log('='.repeat(60));
      console.log('Features:');
      console.log('  ✅ AI-powered team composition');
      console.log('  ✅ Expert-newcomer matching');
      console.log('  ✅ AI chatbot consultation');
      console.log('  ✅ Domain-specific agents (RAG + LoRA)');
      console.log('  ✅ Automated budget & personnel calculation');
      console.log('='.repeat(60));
    });
  }

  public getApp(): Express {
    return this.app;
  }
}

// Start the application
const app = new CabalApp();
app.start();

export default app;
