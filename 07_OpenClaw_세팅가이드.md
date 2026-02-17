# OpenClaw 세팅 가이드 (실전편)

**장비: 라즈베리파이 5 (8GB) + 개인 PC 2대**
**작성일: 2026-02-17 (KST)**

---

## 1. 장비별 역할 분배

```
[라즈베리파이 5] — OpenClaw 게이트웨이 (24/7 상시 가동)
  ├── OpenClaw 메인 프로세스
  ├── 12개 에이전트 오케스트레이션
  ├── 채널 바인딩 (Slack/Discord/Telegram)
  ├── 스케줄링 (데일리 스탠드업, Red-team 자동 점검)
  └── 세션 로그/메모리 저장

[PC #1] — 개발 워크스테이션
  ├── 코드 편집 (VS Code / Cursor)
  ├── 로컬 개발 서버 (프론트엔드/백엔드)
  ├── Docker 컨테이너 (DB, 벡터DB 등)
  └── 구독 플랜 직접 사용 (claude.ai, chatgpt.com 등)

[PC #2] — 테스트/리뷰 스테이션
  ├── CI/CD 러너 (GitHub Actions self-hosted)
  ├── E2E 테스트 실행
  ├── 구독 플랜 직접 사용 (보조)
  └── 모니터링 대시보드
```

### 왜 라즈베리파이인가?

| 비교 항목 | 라즈베리파이 5 | 개인 PC |
|-----------|---------------|---------|
| 전력 | 5W (월 ~1,000원) | 100-300W (월 ~20,000원+) |
| 상시가동 | 자연스러움 | PC 꺼야 할 때 에이전트 중단 |
| 보안 격리 | 메인 PC와 물리적 분리 | 브라우저 세션/파일 노출 위험 |
| 성능 | API 호출 오케스트레이션에 충분 | 과잉 스펙 |
| 소음 | 무소음 (팬리스) | 팬 소음 |

**단, Pi 4 (4GB)는 멀티에이전트에서 느려질 수 있음 → Pi 5 (8GB) 권장**

---

## 2. 라즈베리파이 초기 설정

### 2.1 OS 설치

```bash
# Raspberry Pi Imager로 64-bit Raspberry Pi OS Lite (bookworm) 설치
# SSH 활성화, 사용자명/비밀번호 설정

# SSD 부팅 권장 (SD카드보다 3-5배 빠름)
# USB 3.0 포트에 SSD 연결 → Pi Imager에서 SSD에 직접 설치
```

### 2.2 기본 보안 하드닝

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# UFW 방화벽 설정
sudo apt install ufw -y
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow from 192.168.0.0/24 to any port 18789  # OpenClaw 포트 (로컬 네트워크만)
sudo ufw enable

# SSH 키 기반 인증으로 전환 (PC에서)
ssh-keygen -t ed25519
ssh-copy-id pi@raspberrypi.local

# 비밀번호 로그인 비활성화
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Tailscale VPN 설치 (외부 접근용)
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### 2.3 Node.js 22 설치

```bash
# Node.js 22 LTS 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 확인
node --version  # v22.x.x
npm --version
```

---

## 3. OpenClaw 설치

### 3.1 Docker 방식 (권장)

```bash
# Docker 설치
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 로그아웃 후 재로그인

# OpenClaw 클론 및 설치
git clone https://github.com/openclaw/openclaw.git
cd openclaw
bash docker-setup.sh
```

Docker 설정 시 메모리 제한을 Pi에 맞게 조정:

```yaml
# docker-compose.override.yml (직접 생성)
services:
  openclaw:
    deploy:
      resources:
        limits:
          memory: 4g      # Pi 5 8GB 기준, 절반 할당
          cpus: '3'        # 4코어 중 3코어
    volumes:
      - ~/.openclaw:/root/.openclaw
      - ~/openclaw/workspace:/workspace
```

### 3.2 bare metal 방식 (대안)

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

---

## 4. 인증 설정 — 구독 토큰 + API 키 하이브리드

### 4.1 인증 방식 이해

```
[방식 1] API 키 — 종량제, 사용한 만큼 과금
  ├── Anthropic API: console.anthropic.com에서 발급
  ├── OpenAI API: platform.openai.com에서 발급
  └── Google AI API: aistudio.google.com에서 발급

[방식 2] OAuth/세션 토큰 — 구독 플랜의 사용량을 OpenClaw에서 소모
  ├── Claude: Claude Code의 OAuth 토큰 활용
  ├── ChatGPT: 브라우저 세션 토큰 추출
  └── Gemini: Google AI CLI OAuth 활용
```

### 4.2 Claude Max/Pro 구독 토큰 설정

Claude Code가 이미 설치되어 있다면, 그 OAuth 토큰을 OpenClaw에서 공유할 수 있습니다:

```bash
# Claude Code 설치 (아직 없다면)
npm install -g @anthropic-ai/claude-code

# Claude Code 로그인 (구독 계정으로)
claude login

# 토큰 확인 위치
# macOS: ~/.claude/credentials.json
# Linux: ~/.claude/credentials.json

# OpenClaw에 Claude 인증 추가
openclaw models auth login --provider anthropic
# 또는 직접 토큰 입력
openclaw models auth paste-token --provider anthropic
```

**3개 Claude Max 계정 설정:**

```json
// ~/.openclaw/agent/auth-profiles.json
{
  "profiles": {
    "anthropic:max1": {
      "type": "oauth",
      "note": "Claude Max #1 - Orchestrator용"
    },
    "anthropic:max2": {
      "type": "oauth",
      "note": "Claude Max #2 - Builder-Backend용"
    },
    "anthropic:max3": {
      "type": "oauth",
      "note": "Claude Max #3 - Code-Reviewer용"
    },
    "anthropic:pro1": {
      "type": "oauth",
      "note": "Claude Pro - Spec-Reviewer용"
    }
  }
}
```

각 Max/Pro 계정은 **별도 이메일로 가입된 별도 구독**이므로, 각각 따로 로그인해야 합니다:

```bash
# 에이전트별로 다른 agentDir에서 각각 로그인
cd ~/.openclaw/agents/orchestrator/agent
openclaw models auth login --provider anthropic
# → Max #1 계정으로 로그인

cd ~/.openclaw/agents/builder-backend/agent
openclaw models auth login --provider anthropic
# → Max #2 계정으로 로그인

# ... 반복
```

### 4.3 GPT Pro/Plus 설정

```bash
# OpenAI OAuth 로그인
openclaw models auth login --provider openai

# 또는 API 키 사용 (종량제)
openclaw models auth paste-token --provider openai
```

**2개 GPT Pro (Codex) + 1개 GPT Plus:**

```json
{
  "profiles": {
    "openai:codex1": {
      "type": "oauth",
      "note": "GPT Pro Codex #1 - Builder-Frontend"
    },
    "openai:codex2": {
      "type": "oauth",
      "note": "GPT Pro Codex #2 - Builder-Infra"
    },
    "openai:plus1": {
      "type": "oauth",
      "note": "GPT Plus - General-Assistant"
    }
  }
}
```

### 4.4 Gemini Pro 설정

```bash
# Google AI CLI OAuth
openclaw models auth login --provider google-gemini-cli

# 3개 계정 각각 로그인 (에이전트별 agentDir에서)
```

### 4.5 Perplexity Pro 설정

Perplexity는 OpenClaw 네이티브 지원이 제한적입니다. 두 가지 접근법이 있습니다:

```
[방법 A] Perplexity API 키 사용 (pplx-... 형태)
  → perplexity.ai/settings/api에서 발급
  → 구독과 별개로 종량제 과금

[방법 B] 브라우저 자동화로 Perplexity Pro 구독 활용
  → OpenClaw의 브라우저 스킬로 perplexity.ai에 직접 질의
  → 구독 사용량을 직접 소모하는 방식
  → 불안정하지만 추가 비용 없음

[방법 C] MCP 서버 연동
  → Perplexity MCP 서버를 OpenClaw에 연결
  → 커뮤니티 구현체 활용
```

실용적 권장: Research 에이전트는 **방법 B(브라우저 자동화)**로 시작하고, 안정성 문제 시 **방법 A(API 키)**로 전환.

---

## 5. 멀티 에이전트 설정 (06_계획서 기준 12개)

### 5.1 메인 설정 파일

```json5
// ~/.openclaw/openclaw.json
{
  "gateway": {
    "bind": "0.0.0.0",           // 로컬 네트워크 접근 허용
    "port": 18789,
    "allowFrom": ["192.168.0.0/24", "100.64.0.0/10"],  // 로컬 + Tailscale
    "logging": {
      "level": "info",
      "sessionLog": true,
      "actionLog": true
    }
  },

  "agents": {
    "defaults": {
      "workspace": "~/openclaw/workspace",
      "sandbox": "all",
      "tools": {
        "denyList": ["rm -rf", "chmod 777"]
      }
    },

    "list": [
      // === ORCHESTRATOR ===
      {
        "id": "orchestrator",
        "workspace": "~/openclaw/agents/orchestrator/workspace",
        "agentDir": "~/.openclaw/agents/orchestrator/agent",
        "models": {
          "default": "claude-opus-4-6@anthropic:max1"
        },
        "tools": {
          "allowList": ["read", "write", "github-pr", "slack-notify"]
        },
        "persona": "프로젝트 총괄. PRD/Non-goals 수호자. 직접 코드 작성 금지."
      },

      // === BUILDERS ===
      {
        "id": "builder-backend",
        "workspace": "~/openclaw/agents/builder-backend/workspace",
        "agentDir": "~/.openclaw/agents/builder-backend/agent",
        "models": {
          "default": "claude-opus-4-6@anthropic:max2"
        },
        "tools": {
          "allowList": ["read", "write", "exec", "docker", "github"]
        },
        "persona": "백엔드 전문. API/RAG/DB 구현. 200K 컨텍스트로 전체 아키텍처 맥락 유지."
      },
      {
        "id": "builder-frontend",
        "workspace": "~/openclaw/agents/builder-frontend/workspace",
        "agentDir": "~/.openclaw/agents/builder-frontend/agent",
        "models": {
          "default": "gpt-5.2@openai:codex1"
        },
        "tools": {
          "allowList": ["read", "write", "exec", "browser", "github"]
        },
        "persona": "프론트엔드 전문. React/UI 컴포넌트. Codex 비동기 코드 생성 활용."
      },
      {
        "id": "builder-infra",
        "workspace": "~/openclaw/agents/builder-infra/workspace",
        "agentDir": "~/.openclaw/agents/builder-infra/agent",
        "models": {
          "default": "gpt-5.2@openai:codex2"
        },
        "tools": {
          "allowList": ["read", "write", "exec", "docker", "github", "ci-monitor"]
        },
        "persona": "인프라/테스트 전문. CI/CD, Docker, 테스트 자동화. TDD Red 단계 담당."
      },

      // === REVIEWERS ===
      {
        "id": "code-reviewer",
        "workspace": "~/openclaw/agents/code-reviewer/workspace",
        "agentDir": "~/.openclaw/agents/code-reviewer/agent",
        "models": {
          "default": "claude-opus-4-6@anthropic:max3"
        },
        "tools": {
          "allowList": ["read", "github-review"]
        },
        "persona": "코드 리뷰 전문. 경계조건/보안/성능/마스킹 누락 점검. [Critical/Major/Minor] 포맷."
      },
      {
        "id": "spec-reviewer",
        "workspace": "~/openclaw/agents/spec-reviewer/workspace",
        "agentDir": "~/.openclaw/agents/spec-reviewer/agent",
        "models": {
          "default": "claude-sonnet-4-5@anthropic:pro1"
        },
        "tools": {
          "allowList": ["read"]
        },
        "persona": "스펙 리뷰 전문. PRD-구현 정합성, API 스펙 일치, 온톨로지 매핑 검증."
      },

      // === RED-TEAM ===
      {
        "id": "security-attacker",
        "workspace": "~/openclaw/agents/security-attacker/workspace",
        "agentDir": "~/.openclaw/agents/security-attacker/agent",
        "models": {
          "default": "gemini-3-pro@google:gem1"
        },
        "tools": {
          "allowList": ["read", "exec"]
        },
        "persona": "보안 공격자. 프롬프트 인젝션/데이터 유출/권한 우회 시나리오 10개씩 생성."
      },
      {
        "id": "regulation-checker",
        "workspace": "~/openclaw/agents/regulation-checker/workspace",
        "agentDir": "~/.openclaw/agents/regulation-checker/agent",
        "models": {
          "default": "gemini-3-pro@google:gem2"
        },
        "tools": {
          "allowList": ["read"]
        },
        "persona": "규제 점검자. 자문 유도 표현 자동 탐지. 법률 자문/의견/승소 판단 금지 위반 체크."
      },
      {
        "id": "edge-case-finder",
        "workspace": "~/openclaw/agents/edge-case-finder/workspace",
        "agentDir": "~/.openclaw/agents/edge-case-finder/agent",
        "models": {
          "default": "gemini-3-pro@google:gem3"
        },
        "tools": {
          "allowList": ["read", "exec"]
        },
        "persona": "경계 조건 탐색자. 빈 입력/초대형 파일/동시 접수/마스킹 실패 등 실패 시나리오."
      },

      // === RESEARCH ===
      {
        "id": "legal-researcher",
        "workspace": "~/openclaw/agents/legal-researcher/workspace",
        "agentDir": "~/.openclaw/agents/legal-researcher/agent",
        "models": {
          "default": "perplexity-default"
        },
        "tools": {
          "allowList": ["read", "write", "web-search"]
        },
        "persona": "법률 리서치 전문. 온톨로지 보강, 판례/법령 변경 추적. 출처 링크 필수."
      },
      {
        "id": "tech-researcher",
        "workspace": "~/openclaw/agents/tech-researcher/workspace",
        "agentDir": "~/.openclaw/agents/tech-researcher/agent",
        "models": {
          "default": "perplexity-default"
        },
        "tools": {
          "allowList": ["read", "write", "web-search"]
        },
        "persona": "기술 리서치 전문. 라이브러리/보안취약점/기술트렌드 조사."
      },

      // === SUPPORT ===
      {
        "id": "general-assistant",
        "workspace": "~/openclaw/agents/general-assistant/workspace",
        "agentDir": "~/.openclaw/agents/general-assistant/agent",
        "models": {
          "default": "gpt-5.2@openai:plus1"
        },
        "tools": {
          "allowList": ["read", "write"]
        },
        "persona": "범용 보조. 문서 정리, 회의록, 일반 질의 처리."
      }
    ],

    // === 채널 바인딩 ===
    "bindings": [
      {
        "agent": "orchestrator",
        "channels": {
          "slack": {
            "accounts": {
              "team-general": {}
            }
          },
          "telegram": {
            "accounts": {
              "team-bot": {}
            }
          }
        }
      }
    ]
  }
}
```

### 5.2 에이전트 디렉토리 초기화 스크립트

```bash
#!/bin/bash
# setup-agents.sh — 라즈베리파이에서 실행

AGENTS=(
  "orchestrator"
  "builder-backend"
  "builder-frontend"
  "builder-infra"
  "code-reviewer"
  "spec-reviewer"
  "security-attacker"
  "regulation-checker"
  "edge-case-finder"
  "legal-researcher"
  "tech-researcher"
  "general-assistant"
)

for agent in "${AGENTS[@]}"; do
  echo "Creating agent: $agent"
  mkdir -p ~/openclaw/agents/$agent/workspace
  mkdir -p ~/.openclaw/agents/$agent/agent
  mkdir -p ~/.openclaw/agents/$agent/agent/sessions
done

# 공유 지식베이스 디렉토리
mkdir -p ~/openclaw/shared/knowledge-base
mkdir -p ~/openclaw/shared/ontology
mkdir -p ~/openclaw/shared/templates
mkdir -p ~/openclaw/shared/policies

echo "Done! 12 agents + shared directories created."
echo "Next: run 'openclaw models auth login' in each agent's agentDir"
```

### 5.3 에이전트별 페르소나 파일 예시

```bash
# ~/openclaw/agents/orchestrator/workspace/persona.md
```

```markdown
# Orchestrator 에이전트

## 역할
법무 트리아지 플랫폼의 프로젝트 총괄.
모든 의사결정의 최종 판단자.

## 절대 규칙
1. 직접 코드를 작성하지 않는다 (편향 방지)
2. 법률 자문/의견/승소 가능성 판단을 절대 하지 않는다
3. 모든 판단은 PRD와 Non-goals 문서를 근거로 한다
4. Red-team 결과를 반드시 경유한 후 최종 결정한다

## 출력 포맷
작업 배분 시:
  - 대상 에이전트: [이름]
  - 작업 내용: [구체적 지시]
  - 성공 조건: [명확한 기준]
  - Non-goals 체크: [해당 여부]

PR 판단 시:
  - 결정: [승인/수정요청/범위축소]
  - 근거: [PRD 섹션 번호]
  - Red-team 결과 반영: [반영 내용]
```

---

## 6. 파이프라인 자동화 설정

### 6.1 TDD 파이프라인 (스킬로 구현)

OpenClaw 스킬을 만들어 TDD 파이프라인을 자동화합니다:

```bash
# ~/openclaw/shared/skills/tdd-pipeline/
```

```yaml
# skill.yaml
name: tdd-pipeline
description: "TDD Red→Green→Refactor 파이프라인 자동 실행"
trigger: "/tdd"
steps:
  - agent: builder-infra
    action: "테스트 스켈레톤 작성 (Red 단계)"
    input: "{feature_spec}"
    output: "test_files"
    success_criteria: "모든 테스트 FAIL 확인"

  - agent: builder-backend
    action: "API/서비스 로직 구현 (Green 단계)"
    input: "{test_files}"
    output: "implementation"
    success_criteria: "모든 테스트 PASS"

  - agent: builder-frontend
    action: "UI 컴포넌트 구현 (Green 단계)"
    input: "{test_files}"
    output: "ui_implementation"
    success_criteria: "E2E 테스트 PASS"
    parallel_with: "builder-backend"

  - agent: code-reviewer
    action: "코드 리뷰 (Refactor 단계)"
    input: "{implementation}"
    output: "review_report"
    success_criteria: "Critical 이슈 0건"

  - agent: security-attacker
    action: "보안 공격 시나리오 10개 생성"
    input: "{implementation}"
    output: "security_report"
    parallel_with: "regulation-checker, edge-case-finder"

  - agent: orchestrator
    action: "최종 판단"
    input: "{review_report, security_report}"
    output: "decision"
```

### 6.2 스케줄 작업 (cron 기반)

```bash
# crontab -e (라즈베리파이에서)

# 매일 08:00 — 데일리 스탠드업 요약
0 8 * * * openclaw run --agent orchestrator --task "전일 GitHub PR/이슈 현황 요약 → Slack 전송"

# 매일 09:00 — CI/CD 상태 점검
0 9 * * * openclaw run --agent builder-infra --task "CI/CD 상태 점검, 실패 빌드 알림"

# 매일 18:00 — 일일 리캡
0 18 * * * openclaw run --agent orchestrator --task "일일 완료/진행/블로커 리캡 → Slack 전송"

# 화, 금 10:00 — Red-team 시나리오 점검
0 10 * * 2,5 openclaw run --agent security-attacker --task "최신 코드베이스 대상 보안 시나리오 점검"

# 매주 월 09:00 — 스프린트 시작
0 9 * * 1 openclaw run --agent orchestrator --task "스프린트 백로그 우선순위 정리 → 에이전트별 작업 배분"
```

---

## 7. 폴백 체인 설정

```json5
// ~/.openclaw/routing/failover.json
{
  "chains": {
    "builder": {
      // Claude Max #2 한도 도달 시 → Codex #1 → Claude Pro → GPT Plus 순서
      "primary": "claude-opus-4-6@anthropic:max2",
      "fallback": [
        "gpt-5.2@openai:codex1",
        "claude-sonnet-4-5@anthropic:pro1",
        "gpt-5.2@openai:plus1"
      ],
      "trigger": "rate_limit_exceeded"
    },
    "reviewer": {
      "primary": "claude-opus-4-6@anthropic:max3",
      "fallback": [
        "claude-sonnet-4-5@anthropic:pro1",
        "gemini-3-pro@google:gem1"
      ],
      "trigger": "rate_limit_exceeded"
    },
    "research": {
      // Perplexity 3개를 라운드 로빈으로 순환
      "strategy": "round_robin",
      "models": [
        "perplexity@pplx:pro1",
        "perplexity@pplx:pro2",
        "perplexity@pplx:pro3"
      ]
    }
  }
}
```

---

## 8. 실전 사용 흐름 예시

### 예시: "접수 챗봇 API 엔드포인트 개발"

```
[당신] → Slack에서: "/tdd 접수 챗봇 POST /api/intake 엔드포인트"

[Orchestrator] (Claude Max #1):
  → PRD 5번 섹션 확인: "의뢰인 접수(챗봇)"
  → Non-goals 체크: 자문 기능 아님 ✓
  → 작업 배분:
    • builder-infra: 테스트 작성
    • builder-backend: API 구현
    • legal-researcher: 접수 필수 정보 리서치

[Builder-Infra] (Codex #2):
  → intake.test.ts 작성
  → 테스트 케이스: 정상 접수, 필수 필드 누락, 민감정보 포함, 빈 입력
  → 실행: 4개 테스트 모두 FAIL (Red ✓)

[Legal-Researcher] (Perplexity #1):
  → "법무 사건 접수 시 필수 수집 정보" 리서치
  → 출처 링크와 함께 결과 반환

[Builder-Backend] (Claude Max #2):
  → POST /api/intake 구현
  → 마스킹 로직 포함
  → 테스트 재실행: 4개 모두 PASS (Green ✓)

[Code-Reviewer] (Claude Max #3):
  → [Major] SQL 인젝션 방어 누락
  → [Minor] 에러 메시지에 내부 스택 노출
  → 리팩터링 제안 3건

[Builder-Backend] 수정 후 재테스트 PASS

[Security-Attacker] (Gemini #1):
  → 시나리오 10개 생성
  → [Critical] 프롬프트 인젝션으로 요약 결과 조작 가능

[Regulation-Checker] (Gemini #2):
  → 응답 메시지에 "법적 조언" 느낌의 표현 2건 발견

[Orchestrator] → PR 수정 요청 (Critical 1건 해결 필요)
  → 수정 완료 후 → PR 승인 → main 머지
```

---

## 9. 트러블슈팅

### OAuth 토큰 만료 시

```bash
# Claude 토큰 갱신
cd ~/.openclaw/agents/[에이전트명]/agent
openclaw models auth login --provider anthropic
# 브라우저에서 해당 계정으로 재로그인

# 자동 갱신 스크립트 (cron으로 등록)
# 토큰 만료 전 자동 리프레시는 OpenClaw가 내부적으로 처리하지만
# 장기간 사용 시 수동 갱신이 필요할 수 있음
```

### Pi 메모리 부족 시

```bash
# 스왑 파일 확장 (기본 100MB → 2GB)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# 메모리 사용량 모니터링
watch -n 5 free -h
```

### 에이전트 응답 없음 시

```bash
# OpenClaw 상태 확인
openclaw status

# 특정 에이전트 세션 확인
openclaw agent status --id builder-backend

# 로그 확인
tail -f ~/.openclaw/logs/gateway.log

# 재시작
openclaw restart
```

---

## 10. 비용 요약

| 항목 | 월 비용 |
|------|---------|
| Claude Max × 3 | $600 |
| Claude Pro × 1 | $20 |
| GPT Pro × 2 | $400 |
| GPT Plus × 1 | $20 |
| Perplexity Pro × 3 | $60 |
| Gemini Pro × 3 | $60 |
| **구독 합계** | **$1,160** |
| 라즈베리파이 5 (8GB) 전기료 | ~$1 |
| Tailscale (무료 플랜) | $0 |
| **총합** | **~$1,161/월** |

**참고:** API 키를 병행 사용할 경우 추가 종량제 비용 발생. 구독 토큰만으로 운영하면 추가 API 비용 없음.

---

*이 가이드는 06_OpenClaw_AI에이전트_통합운영계획서.md의 아키텍처 설계를 실제 하드웨어에 구현하는 실전 매뉴얼입니다.*
