# API Documentation

## Cabal Platform API

The Cabal platform provides a comprehensive REST API for managing AI-powered legal services, team composition, and case management.

**Base URL**: `http://localhost:3000/api`

---

## Authentication

Currently in MVP phase - authentication to be implemented in future versions.

---

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-16T14:42:23.694Z"
}
```

---

### Users

#### POST /users
Create a new user (expert or newcomer).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "expert",
  "expertiseLevel": "retired_expert",
  "specializations": ["contract_law", "corporate_law"],
  "yearsOfExperience": 25,
  "hourlyRate": 150,
  "availability": true
}
```

**Response:** `201 Created`

#### GET /users
Get all users.

#### GET /users/:id
Get user by ID.

#### PUT /users/:id
Update user information.

#### GET /users/experts/available
Get all available experts.

---

### Cases

#### POST /cases
Create a new legal case.

#### GET /cases
Get all cases.

#### GET /cases/:id
Get case by ID.

#### PUT /cases/:id
Update case information.

---

### Consultations (AI Chatbot)

#### POST /consultations/start
Start a new AI consultation session.

#### POST /consultations/:sessionId/message
Send a message to the AI chatbot.

#### POST /consultations/:sessionId/complete
Complete consultation and get AI-generated summary.

---

### Teams

#### POST /teams
Create a team using AI-powered composition.

#### GET /teams
Get all teams.

#### GET /teams/:id
Get team by ID.

#### PUT /teams/:id/activate
Activate a team.

#### PUT /teams/:id/complete
Complete a team's work.

---

### AI Agents

#### POST /agents/:domain/query
Query a domain-specific AI agent.

**Available domains:**
- `legal`, `corporate_law`, `contract_law`, `labor_law`, `intellectual_property`, `finance`, `consulting`

#### GET /agents
Get all available AI agents.

For detailed request/response examples, see the full API documentation in the code comments.
