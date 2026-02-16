# Cabal - AI-Powered Legal Services Platform

법무를 MVP로 시작해 은퇴 전문가(사수)와 신입을 팀으로 매칭하고, AI가 팀 구성·인원·예산을 자동 산정해 사건을 수행하는 플랫폼이다.

AI 챗봇이 초기 상담을 맡고 내용을 요약해 전달함으로써 사용자 허들을 낮추고, 프리랜서가 어려운 전문직도 원격·팀 기반으로 수행 가능하게 만든다.

직무성향평가와 도메인별 에이전트·RAG·LoRA 구조를 활용해 최적 팀을 구성하고, 웹 기반으로 시작해 협업툴까지 확장하는 AI 중심 전문직 생태계를 구축한다.

## 🌟 Key Features

- **AI-Powered Team Composition**: Automatically determines optimal team structure, personnel count, and budget based on case complexity
- **Expert-Newcomer Matching**: Pairs retired legal professionals (mentors) with newcomers to form balanced teams
- **AI Chatbot Consultation**: Handles initial client consultations and generates summaries to lower barriers to entry
- **Job Personality Assessment**: Evaluates team members' work styles and skills for optimal matching
- **Domain-Specific AI Agents**: Specialized agents using RAG (Retrieval-Augmented Generation) and LoRA (Low-Rank Adaptation) for different legal domains
- **Remote Collaboration**: Enables freelance professionals to work remotely in team-based structures
- **Budget & Personnel Automation**: AI calculates project costs and required team size

## 🏗️ Architecture

```
cabal/
├── src/
│   ├── ai/                 # AI components
│   │   ├── ChatbotService.ts      # AI chatbot for consultations
│   │   ├── TeamCompositionService.ts  # AI team matching
│   │   └── DomainAgent.ts         # RAG + LoRA agents
│   ├── api/                # API routes
│   │   └── routes.ts
│   ├── models/             # Data models
│   │   ├── User.ts         # User/Expert/Newcomer
│   │   ├── Team.ts         # Team composition
│   │   └── Case.ts         # Legal cases
│   ├── services/           # Business logic
│   │   ├── UserService.ts
│   │   ├── TeamService.ts
│   │   └── CaseService.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   └── index.ts            # Main application
└── tests/                  # Test files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- (Optional) MongoDB for production database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/intelligent04/cabal.git
cd cabal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Build the project:
```bash
npm run build
```

5. Start the development server:
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Check API health status

### Users (Experts & Newcomers)
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `GET /api/users/experts/available` - Get available experts

### Cases
- `POST /api/cases` - Create a new case
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get case by ID
- `PUT /api/cases/:id` - Update case

### Consultations (AI Chatbot)
- `POST /api/consultations/start` - Start AI consultation
- `POST /api/consultations/:sessionId/message` - Send message to chatbot
- `POST /api/consultations/:sessionId/complete` - Complete consultation and get summary

### Teams
- `POST /api/teams` - Create team using AI composition
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id/activate` - Activate team
- `PUT /api/teams/:id/complete` - Complete team

### AI Agents
- `POST /api/agents/:domain/query` - Query domain-specific AI agent
- `GET /api/agents` - Get all available agents

## 🤖 AI Components

### 1. AI Chatbot Service
Handles initial client consultations and generates summaries using NLP.

### 2. Team Composition Service
Uses AI algorithms to match experts with newcomers based on:
- Skills and specializations
- Job personality assessments
- Case complexity
- Domain requirements
- Budget constraints

### 3. Domain-Specific Agents
Specialized AI agents for different legal domains:
- General Law
- Corporate Law
- Contract Law
- Labor Law
- Intellectual Property
- Finance
- Consulting

Each agent uses:
- **RAG (Retrieval-Augmented Generation)**: Retrieves relevant knowledge from vector databases
- **LoRA (Low-Rank Adaptation)**: Fine-tuned adapters for domain expertise

## 🧪 Testing

```bash
npm test
```

## 📝 Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Production
```bash
npm start
```

## 🔧 Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

Key configurations:
- AI model settings (OpenAI, Claude, etc.)
- RAG vector database settings
- LoRA adapter paths
- Database connection
- CORS settings

## 🛣️ Roadmap

- [ ] Frontend web interface
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Real AI model integration (OpenAI/Claude)
- [ ] Vector database for RAG (Pinecone/Weaviate)
- [ ] LoRA fine-tuning pipeline
- [ ] Authentication & authorization
- [ ] Collaboration tools integration (Slack, Teams)
- [ ] Payment processing
- [ ] Advanced analytics dashboard
- [ ] Mobile application

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.
