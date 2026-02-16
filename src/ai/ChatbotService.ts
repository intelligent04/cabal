/**
 * AI Chatbot Service for initial consultation
 * Handles user interaction and generates consultation summaries
 */

import { CaseConsultation } from '../models/Case';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConsultationSession {
  sessionId: string;
  clientId: string;
  messages: ChatMessage[];
  startedAt: Date;
  endedAt?: Date;
}

export class ChatbotService {
  /**
   * Start a new consultation session
   */
  async startConsultation(clientId: string): Promise<ConsultationSession> {
    const session: ConsultationSession = {
      sessionId: this.generateSessionId(),
      clientId,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful legal consultation assistant. Please help the client describe their legal needs.',
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: '안녕하세요! 법률 상담 도우미입니다. 어떤 법률 문제로 도움이 필요하신가요?',
          timestamp: new Date()
        }
      ],
      startedAt: new Date()
    };

    return session;
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    session: ConsultationSession,
    userMessage: string
  ): Promise<ChatMessage> {
    // Add user message to session
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    session.messages.push(userMsg);

    // Generate AI response (placeholder - would integrate with actual AI model)
    const response = await this.generateAIResponse(session);
    session.messages.push(response);

    return response;
  }

  /**
   * Generate consultation summary using AI
   */
  async generateConsultationSummary(
    session: ConsultationSession
  ): Promise<CaseConsultation> {
    const transcript = this.createTranscript(session);
    
    // AI-powered summarization (placeholder - would use actual NLP model)
    const summary = await this.summarizeConversation(session);
    const keyPoints = await this.extractKeyPoints(session);
    const complexity = await this.estimateComplexity(session);
    const specializations = await this.recommendSpecializations(session);

    return {
      consultationId: session.sessionId,
      summary,
      originalTranscript: transcript,
      keyPoints,
      estimatedComplexity: complexity,
      recommendedSpecializations: specializations,
      consultedAt: new Date()
    };
  }

  private async generateAIResponse(_session: ConsultationSession): Promise<ChatMessage> {
    // Placeholder for AI model integration
    // Would integrate with OpenAI, Claude, or custom model
    const response: ChatMessage = {
      role: 'assistant',
      content: '해당 내용에 대해 더 자세히 말씀해 주시겠습니까? 구체적인 상황을 알려주시면 더 정확한 도움을 드릴 수 있습니다.',
      timestamp: new Date()
    };

    return response;
  }

  private async summarizeConversation(session: ConsultationSession): Promise<string> {
    // Placeholder for AI summarization
    const userMessages = session.messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    return `클라이언트 상담 요약: ${userMessages.substring(0, 200)}...`;
  }

  private async extractKeyPoints(_session: ConsultationSession): Promise<string[]> {
    // Placeholder for key point extraction
    return [
      '법률 상담 필요',
      '전문가 팀 구성 요청',
      '예산 및 일정 협의 필요'
    ];
  }

  private async estimateComplexity(session: ConsultationSession): Promise<number> {
    // Placeholder complexity estimation (1-10)
    const messageCount = session.messages.filter(msg => msg.role === 'user').length;
    return Math.min(Math.floor(messageCount / 2) + 3, 10);
  }

  private async recommendSpecializations(_session: ConsultationSession): Promise<string[]> {
    // Placeholder specialization recommendation
    return ['general_law', 'contract_law'];
  }

  private createTranscript(session: ConsultationSession): string {
    return session.messages
      .map(msg => `[${msg.role}] ${msg.content}`)
      .join('\n');
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
