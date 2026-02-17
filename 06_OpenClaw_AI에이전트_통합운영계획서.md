# OpenClaw 기반 AI 에이전트 통합 운영 계획서

**법무 트리아지 + 팀 매칭 기반 전문가 협업 플랫폼 (캡스톤)**
**작성일: 2026-02-17 (KST)**

---

## 1. 현황 분석 및 목적

### 1.1 보유 AI 구독 현황

| 서비스 | 플랜 | 수량 | 주요 강점 |
|--------|------|------|-----------|
| Claude Max | $200/mo | 3개 | Opus 4.6 접근, 200K 컨텍스트, 최고 코딩 품질, 프롬프트 인젝션 저항 최상위 |
| Claude Pro | $20/mo | 1개 | Sonnet 4.5 접근, Opus 대비 80-90% 품질 / 20% 비용 |
| GPT Pro (Codex) | $200/mo | 2개 | GPT-5.2 접근, 비동기 코드 생성, 테스트 자동화 특화 |
| GPT Plus | $20/mo | 1개 | GPT-5.2 접근(사용량 제한), 범용 보조 |
| Perplexity Pro | $20/mo | 3개 | 실시간 웹 검색, 출처 링크 자동 제공, 리서치 특화 |
| Gemini Pro | $20/mo | 3개 | 100만 토큰 컨텍스트, 구조화/분류/정량화 작업 우수 |

**총 16개 구독** — 월 $840 규모의 AI 인프라

### 1.2 핵심 문제

기존 05_AI워크플로우_운영가이드에서 Builder/Reviewer/Red-team 3역할 체계를 정의했으나, **실제 운영에서 다음 문제가 예상된다:**

- 16개 구독을 수동으로 전환하며 사용하면 컨텍스트 손실과 조정 비용이 발생한다
- 각 AI의 사용량 한도(rate limit)에 도달 시 수동 전환이 필요하다
- 작업 이력과 컨텍스트가 AI별로 분산되어 추적이 어렵다
- TDD/Agile 프로세스와 AI 워크플로우가 분리되어 있다

### 1.3 OpenClaw 도입 목적

OpenClaw를 **통합 오케스트레이션 레이어**로 도입하여:

1. 16개 구독을 **단일 인터페이스**에서 관리하고 자동 라우팅한다
2. 각 AI를 **전문 에이전트**로 고정 배치하여 역할 혼선을 제거한다
3. Builder → Reviewer → Red-team **파이프라인을 자동화**한다
4. 사용량 한도 도달 시 **자동 폴백(failover)** 체인을 구성한다
5. 작업 이력을 **단일 세션 로그**로 통합한다

---

## 2. OpenClaw 아키텍처 설계

### 2.1 Hub-and-Spoke 멀티 에이전트 구조

```
OpenClaw Gateway (단일 프로세스, VPS 또는 팀 서버)
│
├── [Orchestrator] 팀장 에이전트 (Claude Max #1)
│   ├── 작업 분배 및 우선순위 결정
│   ├── PR 승인/반려 최종 판단
│   └── Non-goals 준수 여부 감시
│
├── [Builder] 개발 에이전트 그룹
│   ├── Builder-Backend (Claude Max #2) — 백엔드/RAG/API 코드
│   ├── Builder-Frontend (GPT Pro Codex #1) — 프론트엔드/UX 코드
│   └── Builder-Infra (GPT Pro Codex #2) — CI/CD/테스트 자동화
│
├── [Reviewer] 리뷰 에이전트 그룹
│   ├── Code-Reviewer (Claude Max #3) — 코드 품질/보안/경계조건
│   └── Spec-Reviewer (Claude Pro) — PRD/설계 문서 정합성 검증
│
├── [Red-team] 공격 에이전트 그룹
│   ├── Security-Attacker (Gemini Pro #1) — 프롬프트 인젝션/데이터 유출 시나리오
│   ├── Regulation-Checker (Gemini Pro #2) — 자문 유도/규제 위반 탐지
│   └── Edge-Case-Finder (Gemini Pro #3) — 경계 조건/실패 시나리오 생성
│
├── [Research] 리서치 에이전트 그룹
│   ├── Legal-Researcher (Perplexity Pro #1) — 법률 온톨로지/판례 리서치
│   ├── Tech-Researcher (Perplexity Pro #2) — 기술 스택/라이브러리 조사
│   └── Competitive-Researcher (Perplexity Pro #3) — 경쟁 서비스/시장 분석
│
└── [Support] 보조 에이전트
    └── General-Assistant (GPT Plus) — 문서 정리, 회의록, 일반 질의
```

### 2.2 에이전트별 OpenClaw 워크스페이스 구성

각 에이전트는 격리된 워크스페이스를 가진다:

```
/openclaw/
├── agents/
│   ├── orchestrator/
│   │   ├── persona.md          # 역할 정의, Non-goals 목록
│   │   ├── model-config.yaml   # Claude Max #1 → Opus 4.6
│   │   ├── tools/              # GitHub PR, Slack 알림
│   │   └── sessions/           # 세션 히스토리
│   ├── builder-backend/
│   │   ├── persona.md          # 백엔드 전문, RAG 구현
│   │   ├── model-config.yaml   # Claude Max #2 → Opus 4.6
│   │   ├── tools/              # GitHub, Docker, DB 접근
│   │   └── sandbox/            # 코드 실행 샌드박스
│   ├── builder-frontend/
│   │   ├── persona.md          # 프론트엔드 전문
│   │   ├── model-config.yaml   # GPT Pro Codex #1
│   │   └── tools/              # GitHub, Figma, 브라우저
│   └── ... (각 에이전트 동일 구조)
├── shared/
│   ├── knowledge-base/         # 단일 지식베이스 (RAG 저장소)
│   ├── ontology/               # 온톨로지 v0
│   ├── templates/              # PR/이슈/작업카드 템플릿
│   └── policies/               # 데이터 컴플라이언스 정책
└── routing/
    ├── channel-bindings.yaml   # 채널→에이전트 라우팅
    ├── failover-chains.yaml    # 사용량 초과 시 폴백
    └── complexity-router.yaml  # 작업 복잡도별 라우팅
```

### 2.3 폴백(Failover) 체인 설계

구독 사용량 한도 도달 시 자동으로 다음 모델로 전환한다:

```yaml
# failover-chains.yaml
builder_chain:
  primary: claude-max-2        # Opus 4.6
  secondary: gpt-pro-codex-1   # GPT-5.2
  tertiary: claude-pro          # Sonnet 4.5
  emergency: gpt-plus           # GPT-5.2 (제한적)

reviewer_chain:
  primary: claude-max-3         # Opus 4.6
  secondary: claude-pro         # Sonnet 4.5
  tertiary: gemini-pro-1        # Gemini 3 Pro

research_chain:
  primary: perplexity-pro-1
  secondary: perplexity-pro-2
  tertiary: perplexity-pro-3
  # 3개 순환으로 사용량 분산
```

---

## 3. TDD + Agile + XP 패턴 통합

### 3.1 XP(Extreme Programming) 원칙 매핑

| XP 원칙 | OpenClaw 구현 |
|----------|---------------|
| **페어 프로그래밍** | Builder가 코드 작성 → Reviewer가 실시간 리뷰 (같은 PR 내) |
| **TDD** | Builder-Infra(Codex)가 테스트 먼저 작성 → Builder-Backend/Frontend가 구현 |
| **지속적 통합** | Builder-Infra가 CI/CD 모니터링, 실패 시 자동 알림 및 수정 제안 |
| **집단 코드 소유** | shared/knowledge-base는 전체 공유, 코드 저장소는 Builder가 작성하되 Reviewer/Red-team이 읽기 접근 가능. "누구나 수정 가능"이 아닌 "누구나 지적 가능"으로 변형 적용 |
| **작은 릴리스** | 2주 스프린트, 스프린트 내 일일 머지 |
| **고객 상주** | Orchestrator가 PRD 기반으로 요구사항 일관성 검증 |
| **단순한 설계** | Red-team이 과잉 설계 지적, Orchestrator가 범위 축소 판단 |
| **리팩터링** | 매 스프린트 마지막 2일을 리팩터링/안정화에 할당 |

### 3.2 TDD 워크플로우 (에이전트 파이프라인)

**한 개 기능 개발 시 전체 흐름:**

```
[1단계: 스펙 확정]
   Orchestrator: PRD 섹션에서 요구사항 추출
   → Research(Perplexity): 관련 법규/기술 근거 리서치
   → Spec-Reviewer(Claude Pro): 스펙 정합성 검증

[2단계: 테스트 먼저 작성 (TDD Red)]
   Builder-Infra(Codex #2): 단위 테스트 + E2E 테스트 스켈레톤 작성
   → 모든 테스트 FAIL 상태 확인 (Red)

[3단계: 구현 (TDD Green)]
   Builder-Backend(Claude Max #2): API/서비스 로직 구현
   Builder-Frontend(Codex #1): UI 컴포넌트 구현
   → 테스트 PASS까지 반복 (Green)

[4단계: 리뷰 (TDD Refactor + XP Pair)]
   Code-Reviewer(Claude Max #3): 코드 품질/보안/성능 리뷰
   → 리팩터링 제안 → Builder가 수정 → 재리뷰

[5단계: Red-team 공격]
   Security-Attacker(Gemini #1): 프롬프트 인젝션 시나리오 10개
   Regulation-Checker(Gemini #2): 자문 유도 표현 탐지
   Edge-Case-Finder(Gemini #3): 경계 조건 실패 시나리오

[6단계: 최종 판단]
   Orchestrator(Claude Max #1):
   → Red-team 결과 심각도 분류
   → PR 승인/수정요청/범위축소 결정
   → GitHub PR에 결정 근거 기록
```

### 3.3 Agile 스프린트와 OpenClaw 운영 리듬

```
매일 (자동화):
  ├── 08:00  Orchestrator: 데일리 스탠드업 요약 생성 (전일 PR/이슈 현황)
  ├── 09:00  Builder-Infra: CI/CD 상태 점검, 실패 빌드 알림
  └── 18:00  Orchestrator: 일일 리캡 (완료/진행/블로커)

주 2회 (화, 금):
  ├── Red-team 시나리오 점검 (05_가이드 기준)
  └── 품질 지표 리뷰 (재작업률, 리그레션, 태깅 적중률)

스프린트 시작 (격주 월):
  ├── Orchestrator: 스프린트 백로그 우선순위 정리
  ├── Research: 필요 기술/법규 사전 리서치
  └── Builder-Infra: 테스트 스켈레톤 사전 준비

스프린트 종료 (격주 금):
  ├── Orchestrator: Non-goals 준수 점검
  ├── Code-Reviewer: 전체 코드 리그레션 점검
  └── Red-team: 스프린트 산출물 통합 공격 테스트
```

---

## 4. 에이전트별 상세 운영 규칙

### 4.1 Orchestrator (Claude Max #1 — Opus 4.6)

**페르소나:** 프로젝트 총괄. PRD/Non-goals의 수호자. 모든 의사결정의 최종 판단자.

**권한:** GitHub PR 최종 승인, 스프린트 백로그 우선순위 조정, 에이전트 간 작업 재분배

**금지사항:** 직접 코드 작성 금지 (편향 방지), 규제 판단을 단독으로 내리지 않음 (Red-team 필수 경유)

**프롬프트 시스템 메시지 핵심:**
```
당신은 법무 트리아지 플랫폼의 프로젝트 오케스트레이터입니다.
절대 수행하지 않는 것: 법률 자문, 승소 가능성 판단, 수임 권유.
모든 판단은 PRD와 Non-goals 문서를 근거로 합니다.
Builder/Reviewer/Red-team 결과를 종합하여 최종 결정합니다.
```

### 4.2 Builder 그룹

**Builder-Backend (Claude Max #2 — Opus 4.6)**
- 담당: Backend API, AI Orchestration Service, RAG Service
- 강점 활용: Opus의 200K 컨텍스트로 전체 아키텍처 맥락 유지
- 출력물: API 엔드포인트, 서비스 로직, DB 마이그레이션, RAG 파이프라인

**Builder-Frontend (GPT Pro Codex #1)**
- 담당: Web Frontend, 접수 챗 UI, 전문가 작업 공간 UI
- 강점 활용: Codex의 비동기 코드 생성, 빠른 프로토타이핑
- 출력물: React 컴포넌트, 페이지 라우팅, 상태 관리, E2E 시나리오

**Builder-Infra (GPT Pro Codex #2)**
- 담당: 테스트 자동화, CI/CD, Docker, 배포 스크립트
- 강점 활용: Codex의 테스트 코드 생성 특화
- 출력물: 단위 테스트, 통합 테스트, E2E 테스트, GitHub Actions, Dockerfile

### 4.3 Reviewer 그룹

**Code-Reviewer (Claude Max #3 — Opus 4.6)**
- 체크리스트: 경계조건, 에러 핸들링, 보안 취약점, 성능 병목, 민감정보 마스킹 누락
- 출력 포맷: `[심각도: Critical/Major/Minor] [카테고리] 설명 + 수정 제안`

**Spec-Reviewer (Claude Pro — Sonnet 4.5)**
- 체크리스트: PRD 정합성, API 스펙과 구현 일치, 온톨로지 매핑 정확도
- 비용 효율: Opus의 80-90% 품질을 20% 비용으로 → 문서 리뷰에 최적

### 4.4 Red-team 그룹

**Gemini Pro 3개를 Red-team에 배치하는 이유:**
- 100만 토큰 컨텍스트로 전체 코드베이스/정책 문서를 한 번에 로드 가능
- Claude와 다른 모델 계열이므로 Claude가 놓치는 맹점을 보완
- 구조화/분류 작업에 강해 시나리오 체계적 생성에 적합

**Security-Attacker (Gemini Pro #1):** 프롬프트 인젝션, 데이터 유출, 권한 우회 시나리오
**Regulation-Checker (Gemini Pro #2):** "자문처럼 보이는 표현" 자동 탐지, 규제 위반 체크
**Edge-Case-Finder (Gemini Pro #3):** 빈 입력, 초대형 파일, 동시 접수, 마스킹 실패 등 경계 조건

### 4.5 Research 그룹

**Perplexity Pro 3개를 리서치 전담으로 배치하는 이유:**
- 실시간 웹 검색 + 출처 자동 제공 → RAG 지식베이스 보강에 최적
- 3개 구독 순환으로 사용량 분산 (각각 다른 도메인 전담)

**Legal-Researcher (#1):** 법률 온톨로지 보강, 판례/법령 변경 추적
**Tech-Researcher (#2):** 라이브러리 업데이트, 보안 취약점 공지, 기술 트렌드
**Competitive-Researcher (#3):** 유사 서비스 분석, UX 벤치마크, 시장 동향

---

## 5. 얼리어답터 인사이트 및 적용

### 5.1 커뮤니티에서 확인된 핵심 패턴

**패턴 1: 복잡도 기반 라우팅으로 비용 50%+ 절감**
얼리어답터들은 작업 복잡도를 자동 측정하여 적합한 모델로 라우팅한다. 단순 질의는 저비용 모델, 복잡한 추론은 고비용 모델로 보내는 방식이다. 이 프로젝트에서는 이미 역할별로 고정 배치하므로, 폴백 체인에서 이 원칙을 적용한다.

**패턴 2: 에이전트 인격 부여가 생산성 향상**
솔로 파운더 사례에서 4개 에이전트에 이름과 성격을 부여했더니 "진짜 소규모 팀이 24/7 가동되는 느낌"이라고 보고했다. 이 프로젝트에서도 각 에이전트에 명확한 페르소나와 커뮤니케이션 스타일을 부여한다.

**패턴 3: 워크스페이스 격리가 보안의 핵심**
OpenClaw 인스턴스 135,000개 이상이 노출된 채 발견되었고, 230개 이상의 악성 스킬이 유포되고 있다. 에이전트별 크레덴셜 격리, 도구 접근 제한, 샌드박스 실행이 필수다.

**패턴 4: Antfarm 프레임워크 — YAML 기반 팀 정의**
커뮤니티에서 Antfarm이라는 도구로 OpenClaw 에이전트 팀을 YAML 한 파일로 정의한다: Planner(Opus), Developer(Opus), Verifier(Sonnet), Tester(Haiku), Reviewer(Opus). 이 프로젝트의 Builder/Reviewer/Red-team 구조와 유사하므로 참고하여 커스터마이즈한다.

**패턴 5: DevClaw 플러그인으로 개발 관리 자동화**
DevClaw는 오케스트레이터를 개발 매니저로 전환해 개발자 에이전트에게 작업을 배정하고, 코드 리뷰를 자동화하고, PR 파이프라인을 관리한다. 이 프로젝트의 Orchestrator 역할과 직접 대응된다.

### 5.2 이 프로젝트에 특화된 적용 포인트

**구독 토큰 vs API 키 — 중요 주의사항:**
OpenClaw는 API 키 기반으로 모델에 접근하는 것이 공식 지원 방식이다. 구독 토큰(세션 토큰)을 추출하여 사용하는 것은 각 서비스의 이용약관 위반 위험이 있다. 따라서 다음과 같이 분리 운영한다:

```
[구독 플랜 활용] — 사람이 직접 사용
  ├── Claude Max/Pro: claude.ai 웹에서 직접 사용
  ├── GPT Pro/Plus: ChatGPT 웹에서 직접 사용
  ├── Perplexity Pro: perplexity.ai에서 직접 사용
  └── Gemini Pro: gemini.google.com에서 직접 사용

[OpenClaw 통합] — API 키 기반 자동화 (별도 비용)
  ├── Anthropic API: Opus/Sonnet/Haiku → Builder/Reviewer
  ├── OpenAI API: GPT-5.2/Codex → Builder/Infra
  ├── Google AI API: Gemini 3 Pro → Red-team
  └── OpenRouter: 통합 라우팅 + 폴백 (선택)
```

**하이브리드 운영 전략:**
API 예산이 제한적인 초기에는 구독 플랜을 직접 사용하되, OpenClaw를 "자동화 파이프라인 코어"로만 활용한다. 구독 플랜의 사용량이 남는 시간대(야간/주말)에 OpenClaw가 자동으로 리서치/테스트/Red-team 작업을 수행하도록 스케줄링한다.

---

## 6. 구현 로드맵

### Phase 0: 환경 구축 (1-2일)

- VPS 또는 팀 서버에 OpenClaw 설치 (2+ CPU, 8GB RAM 권장)
- 보안 하드닝: 127.0.0.1 바인딩, Tailscale VPN, 방화벽 설정
- API 키 등록: Anthropic, OpenAI, Google AI (각 최소 권한)
- Slack/Discord 채널 바인딩 (팀 커뮤니케이션용)

### Phase 1: 에이전트 설정 (2-3일)

- 12개 에이전트 워크스페이스 생성 (2.1 구조 기준)
- 각 에이전트 페르소나/시스템 프롬프트 작성
- 폴백 체인 및 채널 바인딩 설정
- shared/knowledge-base에 5개 문서(PRD~가이드) 업로드

### Phase 2: 파이프라인 검증 (3-4일)

- 테스트 기능 1개로 전체 TDD 파이프라인 dry-run
- 테스트 작성(Red) → 구현(Green) → 리뷰(Refactor) → Red-team 공격 → 최종 판단
- 병목 구간 식별 및 프롬프트 튜닝
- 폴백 체인 동작 확인

### Phase 3: 스프린트 1 통합 운영 (Week 5-6)

- 캡스톤 Sprint 1(접수→요약→태깅→카드)에 OpenClaw 파이프라인 적용
- 일일 자동 스탠드업/리캡 활성화
- 품질 지표 자동 수집 시작

### Phase 4: 최적화 (지속적)

- 에이전트별 성과 측정 (응답 품질, 속도, 비용)
- 라우팅 규칙 미세 조정
- 불필요 에이전트 통합/제거 (05_가이드의 "에이전트 증식 금지" 원칙)

---

## 7. 비용 최적화 전략

### 7.1 구독 플랜 순환 사용

```
[Claude Max 3개 순환]
  Max #1 (Orchestrator): 의사결정 → 사용량 낮음
  Max #2 (Builder): 코드 생성 → 사용량 높음
  Max #3 (Reviewer): 리뷰 → 사용량 중간
  → #2 한도 도달 시 #1 또는 #3의 여유분 활용

[Perplexity Pro 3개 순환]
  도메인별 분리 + 일일 쿼리 한도 분산
  → 하루 총 가용 쿼리 = 3배

[Gemini Pro 3개 순환]
  Red-team 3개 역할 분리 + 100만 토큰 컨텍스트 활용
  → 전체 코드베이스 로드 비용 = 0 (구독 내)
```

### 7.2 API 비용 절감 팁 (얼리어답터 기준)

- 단순 질의/분류는 Haiku/Flash 급으로 라우팅 (10-50x 저렴)
- 프롬프트 캐싱 활용: 반복되는 시스템 프롬프트/지식베이스 컨텍스트
- OpenRouter 통합으로 최저가 라우팅 가능 (선택적)
- 야간/주말 배치 작업으로 비동기 처리 비용 절감

---

## 8. 보안 및 컴플라이언스

### 8.1 OpenClaw 보안 체크리스트

- [ ] 127.0.0.1 바인딩 (외부 노출 차단)
- [ ] Tailscale/WireGuard VPN으로만 원격 접근
- [ ] 에이전트별 API 키 격리 (크레덴셜 분리)
- [ ] 도구(Tool) allowlist 설정 (에이전트별 최소 권한)
- [ ] 민감정보 마스킹 규칙을 shared/policies에 등록
- [ ] 파괴적 액션(삭제, 배포) 실행 전 사람 승인 필수
- [ ] 커뮤니티 스킬 설치 금지 (공급망 공격 방지)
- [ ] 세션 로그 보관기간 설정 (04_정책 기준)

### 8.2 04_데이터 컴플라이언스 정책과의 정합

OpenClaw를 경유하는 모든 프롬프트/응답은 04_정책의 마스킹 규칙을 준수한다. 에이전트 시스템 프롬프트에 다음을 필수 포함한다:

```
[필수 규칙]
1. 실명/연락처/주민번호/주소/계좌는 자동 마스킹 후 처리
2. 법률 자문/의견/승소 가능성 판단 절대 금지
3. 출처 없는 단정형 답변 금지 (RAG 검색 우선)
4. 원문 프롬프트/응답 장기 저장 금지
```

---

## 9. 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 파이프라인 완주율 | >90% | Builder→Reviewer→Red-team 전 단계 완료 비율 |
| Red-team 발견 결함 수 | >5/스프린트 | 스프린트별 Red-team 이슈 카운트 |
| 폴백 발생률 | <10% | 자동 폴백 트리거 횟수 / 전체 요청 |
| 코드 재작업률 | <15% | Red-team 지적 후 재수정 비율 |
| Non-goals 위반 건수 | 0 | 자문 유도 표현 탐지 건수 |
| 일일 수동 전환 횟수 | 0 | 사람이 직접 AI를 전환한 횟수 |

---

## 10. 참고 자료 (리서치 출처)

- [OpenClaw 공식 문서 — Multi-Agent 개념](https://docs.openclaw.ai/concepts/multi-agent)
- [OpenClaw GitHub 저장소](https://github.com/openclaw/openclaw)
- [멀티모델 라우팅으로 비용 절감 가이드](https://velvetshark.com/openclaw-multi-model-routing)
- [API 비용 최적화: 스마트 라우팅](https://zenvanriel.nl/ai-engineer-blog/openclaw-api-cost-optimization-guide/)
- [멀티에이전트 팀 유즈케이스](https://github.com/hesamsheikh/awesome-openclaw-usecases/blob/main/usecases/multi-agent-team.md)
- [OpenClaw Advanced Config (프로덕션 설정)](https://github.com/TheSethRose/OpenClaw-Advanced-Config)
- [Antfarm: 에이전트 팀 빌더](https://github.com/snarktank/antfarm)
- [TDD 펌웨어 개발 with OpenClaw](https://blog.adafruit.com/2026/02/07/full-circle-test-driven-firmware-development-with-openclaw/)
- [E2E 테스트 자동화 가이드](https://jangwook.net/en/blog/en/openclaw-e2e-test-automation-guide/)
- [DevClaw: 멀티프로젝트 개발 파이프라인](https://github.com/laurentenhoor/devclaw)
- [OpenClaw 악성 스킬 공급망 공격 분석](https://www.authmind.com/post/openclaw-malicious-skills-agentic-ai-supply-chain)
- [OpenClaw KR 커뮤니티 (X)](https://x.com/i/communities/2017879415318007887)
- [코딩 모델 비교: Opus 4.6 vs Gemini 3 Pro vs GPT-5.2](https://composio.dev/blog/claude-4-5-opus-vs-gemini-3-pro-vs-gpt-5-codex-max-the-sota-coding-model)

---

*본 문서는 다음 5개 문서의 원칙과 Non-goals를 준수하며 작성되었습니다:*
*01_PRD_기획서 (MVP 범위/Non-goals), 02_개발계획서 (스프린트/품질게이트), 03_아키텍처_설계서 (논리구성요소/보안), 04_데이터_컴플라이언스_정책 (마스킹/감사), 05_AI워크플로우_운영가이드 (Builder/Reviewer/Red-team 3역할)*
*에이전트 증식 금지 원칙(05_가이드)에 따라, MVP 단계에서는 12개 이내로 제한하고, 실제 운영 시 불필요한 에이전트는 통합/제거합니다.*
*02_개발계획서의 10주 일정 및 품질 게이트(PR 템플릿, E2E 3개 이상, 린트/타입체크)는 OpenClaw 파이프라인의 자동 체크로 강화됩니다.*
*03_아키텍처_설계서의 논리 구성요소(AI Orchestration, RAG Service 등)는 Builder-Backend 에이전트의 주요 구현 범위입니다.*
