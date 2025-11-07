# 구현 계획: SettleUp 핵심 기능

**Branch**: `001-settleup-core-features` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)
**Input**: 여행 정산 및 게임 정산 기능을 포함한 모바일 앱

**Note**: 이 문서는 `/speckit.plan` 명령으로 작성되었습니다.

## 요약

SettleUp은 여행 및 게임 세션에서 발생하는 비용을 정산하는 모바일 애플리케이션입니다.
React Native 프론트엔드와 Spring Boot API 서버로 구성되며, MLOps 실습을 위한
컨테이너화된 환경과 AI 기반 비용 카테고리 분류 기능을 포함합니다.

## Technical Context

**Language/Version**:
- Frontend: JavaScript/TypeScript (React Native 0.73+)
- Backend: Java 17+ (Spring Boot 3.2+)
- AI Model: Python 3.10+ (FastAPI for model serving)

**Primary Dependencies**:
- Frontend: React Native, React Navigation, AsyncStorage, Expo (선택사항)
- Backend: Spring Boot, Spring Data JPA, Spring Security
- Database: PostgreSQL 15+
- Cache: Redis 7+
- AI/ML: TensorFlow Lite 또는 ONNX Runtime (경량 모델)

**Storage**:
- Primary DB: PostgreSQL (관계형 데이터, 트랜잭션)
- Cache: Redis (세션, 임시 계산 결과)
- Mobile Local: AsyncStorage 또는 SQLite (오프라인 데이터)

**Testing**:
- Frontend: Jest, React Native Testing Library
- Backend: JUnit 5, Spring Boot Test, Testcontainers
- Integration: RestAssured, Postman/Newman

**Target Platform**:
- Mobile: iOS 14+ 및 Android 8.0+ (API 26+)
- Server: Docker containers (Linux)
- Development: macOS, Windows, Linux

**Project Type**: Mobile + API (React Native app + Spring Boot backend + ML service)

**Performance Goals**:
- 정산 계산: 최대 50명 참가자에 대해 500ms 이내
- API 응답: p95 < 200ms
- 모바일 앱 시작 시간: < 3초
- AI 카테고리 추론: < 100ms per request

**Constraints**:
- 오프라인 모드 필수 (핵심 기능 오프라인 동작)
- 모바일 앱 메모리: < 150MB
- 배터리 효율적 (백그라운드 동기화 최소화)
- Docker 기반 배포 (MLOps 실습 목적)

**Scale/Scope**:
- 초기 목표: 100-500명 사용자
- 세션당 최대 50명 참가자
- 사용자당 최대 1000개 정산 세션
- 실습 프로젝트 (프로덕션 스케일 아님)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. 데이터 무결성 우선 ✅

**상태**: 준수
**계획**:
- 정산 계산 로직에 대한 포괄적인 단위 테스트
- 엣지 케이스 테스트 (0원, 음수, 소수점 반올림)
- 계산 추적을 위한 감사 로그
- 결정적 알고리즘 사용 (동일 입력 → 동일 출력)

### II. 오프라인 우선 아키텍처 ✅

**상태**: 준수
**계획**:
- AsyncStorage/SQLite를 통한 로컬 데이터 저장
- 오프라인 큐 기반 동기화
- 네트워크 불가 시에도 모든 핵심 기능 동작
- 충돌 해결 전략 (last-write-wins 또는 사용자 선택)

### III. 사용자 경험 단순성 ✅

**상태**: 준수
**계획**:
- 최소 3-4단계 내 주요 작업 완료
- 명확한 시각적 피드백 및 로딩 상태
- 사람이 읽을 수 있는 텍스트 내보내기 형식
- 직관적인 네비게이션 (탭 기반 메인 화면)

### IV. 핵심 경로 테스트 커버리지 ✅

**상태**: 준수
**계획**:
- 정산 계산 엔진: > 90% 코드 커버리지
- 통합 테스트: 전체 정산 흐름
- 회귀 테스트: CI/CD 파이프라인 통합
- 다수 참가자 시나리오 테스트 케이스

### V. 데이터 지속성 및 복구 ✅

**상태**: 준수
**계획**:
- 자동 저장 (모든 변경 즉시 저장)
- 텍스트 내보내기를 통한 데이터 백업
- 로컬 DB 손상 시 복구 메커니즘
- 삭제 전 확인 UI

### 추가 고려사항: MLOps 및 컨테이너화 ⚠️

**상태**: 확장 기능
**계획**:
- Docker Compose로 개발 환경 구성
- AI 모델 서빙을 위한 별도 컨테이너
- 단계별 구축 (실습 형식)
- CI/CD 파이프라인 구성

**정당화**: MLOps 실습이 프로젝트 목적이므로 인프라 복잡도 증가는 교육적 가치를 위해 허용

## Project Structure

### Documentation (this feature)

```text
specs/001-settleup-core-features/
├── plan.md              # 이 파일
├── research.md          # Phase 0 기술 조사
├── data-model.md        # Phase 1 데이터 모델
├── quickstart.md        # Phase 1 퀵스타트 가이드
├── contracts/           # Phase 1 API 계약
│   ├── settlements-api.yaml
│   ├── games-api.yaml
│   └── categories-api.yaml
└── tasks.md             # Phase 2 작업 목록 (/speckit.tasks로 생성)
```

### Source Code (repository root)

```text
# Mobile + API 구조
mobile/
├── src/
│   ├── screens/         # 화면 컴포넌트
│   │   ├── HomeScreen.tsx
│   │   ├── TravelSettlementScreen.tsx
│   │   └── GameSettlementScreen.tsx
│   ├── components/      # 재사용 컴포넌트
│   │   ├── ParticipantList.tsx
│   │   ├── ExpenseItem.tsx
│   │   └── SettlementSummary.tsx
│   ├── services/        # API 클라이언트, 로컬 DB
│   │   ├── api/
│   │   ├── storage/
│   │   └── sync/
│   ├── models/          # 데이터 모델
│   ├── navigation/      # 네비게이션 설정
│   └── utils/           # 정산 계산 로직
└── __tests__/           # 테스트

backend/
├── src/main/java/com/settleup/
│   ├── domain/          # 엔티티 및 도메인 로직
│   │   ├── settlement/
│   │   ├── game/
│   │   └── participant/
│   ├── repository/      # Spring Data JPA
│   ├── service/         # 비즈니스 로직
│   ├── controller/      # REST API
│   ├── dto/             # 데이터 전송 객체
│   ├── config/          # 설정 (Redis, Security)
│   └── exception/       # 예외 처리
└── src/test/java/       # 테스트

ml-service/
├── src/
│   ├── models/          # AI 모델 파일
│   ├── api/             # FastAPI 엔드포인트
│   ├── preprocessing/   # 텍스트 전처리
│   └── inference/       # 추론 로직
└── tests/

infrastructure/
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.ml
│   └── nginx.conf
├── k8s/                 # Kubernetes (선택사항, 고급 단계)
└── scripts/             # 빌드, 배포 스크립트
```

**Structure Decision**: Mobile + API 구조 선택 (Option 3 변형)
- React Native 앱은 크로스 플랫폼이므로 단일 `mobile/` 디렉토리
- Backend는 `backend/`에 Spring Boot 애플리케이션
- ML 서비스는 별도 `ml-service/`로 분리 (마이크로서비스 패턴)
- Infrastructure 코드는 `infrastructure/`에 Docker, K8s 설정

## Complexity Tracking

| 위반 사항 | 필요한 이유 | 거부된 단순한 대안 |
|-----------|------------|---------------------|
| 3개 서비스 (Mobile + Backend + ML) | MLOps 실습 목적상 ML 서비스 분리 필요, 모바일 오프라인 기능 필요 | 단일 모놀리스: AI 모델 통합이 복잡하고 MLOps 실습 목적 달성 불가 |
| Docker/K8s 인프라 | MLOps 파이프라인 구축 실습이 프로젝트 목표 | 로컬 개발만: MLOps 실습 목적 달성 불가, 컨테이너화는 필수 학습 요소 |
| Redis 캐시 추가 | 정산 계산 결과 캐싱으로 성능 향상, 세션 관리 | DB만 사용: 반복 계산 시 성능 저하, 세션 관리 복잡도 증가 |

## Phase 0: Research & Technology Decisions

**목표**: Technical Context의 NEEDS CLARIFICATION 해결 및 기술 선택 검증

다음 섹션에서 `research.md`를 생성합니다 (별도 파일).

## Phase 1: Design & Contracts

**목표**: 데이터 모델, API 계약, 퀵스타트 가이드 생성

다음 단계에서 생성될 파일:
- `data-model.md`: 엔티티, 관계, 검증 규칙
- `contracts/`: OpenAPI 스펙
- `quickstart.md`: 개발 환경 설정 가이드

## Phase 2: Task Generation

**Note**: `/speckit.tasks` 명령으로 별도 실행됩니다.

---

**다음 단계**: Phase 0 research.md 생성
