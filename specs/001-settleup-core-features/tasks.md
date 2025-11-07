# Tasks: SettleUp 핵심 기능

**Input**: `/specs/001-settleup-core-features/` 설계 문서
**Prerequisites**: plan.md, data-model.md, contracts/, quickstart.md

**Tests**: 이 프로젝트는 헌법 원칙 IV(핵심 경로 테스트 커버리지)에 따라 테스트가 필수입니다.

**Organization**: MLOps 실습을 위해 단계별로 구성되며, 각 사용자 스토리는 독립적으로 구현 및 테스트 가능합니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 사용자 스토리 (US1, US2, US3, US4, US5)
- 정확한 파일 경로 포함

## Path Conventions

- **Mobile**: `mobile/src/`
- **Backend**: `backend/src/main/java/com/settleup/`
- **ML Service**: `ml-service/src/`
- **Infrastructure**: `infrastructure/docker/`

---

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 초기화 및 기본 구조

- [ ] T001 Create root project structure (mobile/, backend/, ml-service/, infrastructure/)
- [ ] T002 Initialize infrastructure/docker/docker-compose.yml with PostgreSQL and Redis
- [ ] T003 Create database schema in infrastructure/docker/init-db.sql
- [ ] T004 [P] Initialize Spring Boot project in backend/ with Gradle build.gradle
- [ ] T005 [P] Configure backend/src/main/resources/application.yml
- [ ] T006 [P] Initialize React Native Expo project in mobile/
- [ ] T007 [P] Install mobile dependencies in mobile/package.json
- [ ] T008 [P] Initialize Python project in ml-service/ with requirements.txt
- [ ] T009 Start Docker containers and verify database connectivity

**Checkpoint**: Docker 환경 실행, 데이터베이스 스키마 생성 완료

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리에 필요한 핵심 인프라 (완료 전까지 US 구현 불가)

⚠️ **CRITICAL**: 이 Phase 완료 전까지 사용자 스토리 작업 시작 불가

- [ ] T010 [P] Create User entity in backend/src/main/java/com/settleup/domain/user/User.java
- [ ] T011 [P] Create Settlement entity in backend/src/main/java/com/settleup/domain/settlement/Settlement.java
- [ ] T012 [P] Create Participant entity in backend/src/main/java/com/settleup/domain/participant/Participant.java
- [ ] T013 [P] Create UserRepository in backend/src/main/java/com/settleup/repository/UserRepository.java
- [ ] T014 [P] Create SettlementRepository in backend/src/main/java/com/settleup/repository/SettlementRepository.java
- [ ] T015 [P] Create ParticipantRepository in backend/src/main/java/com/settleup/repository/ParticipantRepository.java
- [ ] T016 [P] Configure Redis in backend/src/main/java/com/settleup/config/RedisConfig.java
- [ ] T017 [P] Setup error handling in backend/src/main/java/com/settleup/exception/GlobalExceptionHandler.java
- [ ] T018 [P] Create API client in mobile/src/services/api/client.ts
- [ ] T019 [P] Setup SQLite database in mobile/src/services/storage/database.ts
- [ ] T020 [P] Create navigation structure in mobile/src/navigation/AppNavigator.tsx
- [ ] T021 Test foundation: Create basic settlement via API and verify in database

**Checkpoint**: 기본 엔티티, Repository, 모바일 인프라 준비 완료 - 사용자 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - 여행 정산 기본 (Priority: P1) 🎯 MVP

**Goal**: 참가자를 추가하고 지출을 입력하여 여행 정산 세션을 생성할 수 있다

**Independent Test**: 정산 생성 → 참가자 3명 추가 → 지출 2건 입력 → 데이터 저장 확인

### Tests for User Story 1 ⚠️

> **NOTE: 테스트를 먼저 작성하고, 실패 확인 후 구현**

- [ ] T022 [P] [US1] Unit test for Settlement calculation logic in backend/src/test/java/com/settleup/service/SettlementCalculationServiceTest.java
- [ ] T023 [P] [US1] Integration test for settlement creation in backend/src/test/java/com/settleup/integration/SettlementApiTest.java
- [ ] T024 [P] [US1] Contract test for POST /api/v1/settlements in backend/src/test/java/com/settleup/contract/SettlementContractTest.java
- [ ] T025 [P] [US1] Unit test for mobile settlement service in mobile/__tests__/services/settlementService.test.ts

### Implementation for User Story 1

**Backend**:
- [ ] T026 [P] [US1] Create Expense entity in backend/src/main/java/com/settleup/domain/expense/Expense.java
- [ ] T027 [P] [US1] Create ExpenseSplit entity in backend/src/main/java/com/settleup/domain/expense/ExpenseSplit.java
- [ ] T028 [P] [US1] Create ExpenseRepository in backend/src/main/java/com/settleup/repository/ExpenseRepository.java
- [ ] T029 [P] [US1] Create ExpenseSplitRepository in backend/src/main/java/com/settleup/repository/ExpenseSplitRepository.java
- [ ] T030 [US1] Create SettlementService in backend/src/main/java/com/settleup/service/SettlementService.java (depends on T014)
- [ ] T031 [US1] Create ParticipantService in backend/src/main/java/com/settleup/service/ParticipantService.java (depends on T015)
- [ ] T032 [US1] Create ExpenseService in backend/src/main/java/com/settleup/service/ExpenseService.java (depends on T028, T029)
- [ ] T033 [P] [US1] Create Settlement DTOs in backend/src/main/java/com/settleup/dto/SettlementDto.java
- [ ] T034 [P] [US1] Create Expense DTOs in backend/src/main/java/com/settleup/dto/ExpenseDto.java
- [ ] T035 [US1] Implement POST /api/v1/settlements in backend/src/main/java/com/settleup/controller/SettlementController.java
- [ ] T036 [US1] Implement GET /api/v1/settlements/{id} in backend/src/main/java/com/settleup/controller/SettlementController.java
- [ ] T037 [US1] Implement POST /api/v1/settlements/{id}/participants in backend/src/main/java/com/settleup/controller/SettlementController.java
- [ ] T038 [US1] Implement POST /api/v1/settlements/{id}/expenses in backend/src/main/java/com/settleup/controller/ExpenseController.java
- [ ] T039 [US1] Add validation and error handling for settlement creation

**Mobile**:
- [ ] T040 [P] [US1] Create Settlement model in mobile/src/models/Settlement.ts
- [ ] T041 [P] [US1] Create Participant model in mobile/src/models/Participant.ts
- [ ] T042 [P] [US1] Create Expense model in mobile/src/models/Expense.ts
- [ ] T043 [US1] Create SettlementService in mobile/src/services/api/settlementService.ts (depends on T018)
- [ ] T044 [US1] Implement local storage for settlements in mobile/src/services/storage/settlementStorage.ts (depends on T019)
- [ ] T045 [US1] Create HomeScreen in mobile/src/screens/HomeScreen.tsx
- [ ] T046 [US1] Create TravelSettlementScreen in mobile/src/screens/TravelSettlementScreen.tsx
- [ ] T047 [P] [US1] Create ParticipantList component in mobile/src/components/ParticipantList.tsx
- [ ] T048 [P] [US1] Create ExpenseItem component in mobile/src/components/ExpenseItem.tsx
- [ ] T049 [US1] Implement participant addition UI in TravelSettlementScreen
- [ ] T050 [US1] Implement expense input form in TravelSettlementScreen
- [ ] T051 [US1] Add offline sync queue in mobile/src/services/sync/syncService.ts

**Checkpoint**: 여행 정산 생성, 참가자 추가, 지출 입력 기능이 완전히 동작하며 독립적으로 테스트 가능

---

## Phase 4: User Story 2 - 여행 정산 결산 (Priority: P2)

**Goal**: 입력된 지출 데이터를 기반으로 중간 정산을 조회하고 최종 결산 결과를 확인할 수 있다

**Independent Test**: US1 데이터로 정산 계산 → 결과 조회 → 금액 검증

### Tests for User Story 2 ⚠️

- [ ] T052 [P] [US2] Unit test for settlement calculation algorithm in backend/src/test/java/com/settleup/service/SettlementCalculationServiceTest.java
- [ ] T053 [P] [US2] Integration test for /calculate endpoint in backend/src/test/java/com/settleup/integration/CalculationApiTest.java
- [ ] T054 [P] [US2] Component test for SettlementSummary in mobile/__tests__/components/SettlementSummary.test.tsx

### Implementation for User Story 2

**Backend**:
- [ ] T055 [P] [US2] Create Transaction entity in backend/src/main/java/com/settleup/domain/transaction/Transaction.java
- [ ] T056 [P] [US2] Create TransactionRepository in backend/src/main/java/com/settleup/repository/TransactionRepository.java
- [ ] T057 [US2] Implement settlement calculation algorithm in backend/src/main/java/com/settleup/service/SettlementCalculationService.java
- [ ] T058 [US2] Implement greedy balance optimization in SettlementCalculationService
- [ ] T059 [US2] Add Redis caching for calculation results in backend/src/main/java/com/settleup/service/SettlementCalculationService.java
- [ ] T060 [P] [US2] Create Transaction DTOs in backend/src/main/java/com/settleup/dto/TransactionDto.java
- [ ] T061 [US2] Implement POST /api/v1/settlements/{id}/calculate in backend/src/main/java/com/settleup/controller/SettlementController.java
- [ ] T062 [US2] Implement GET /api/v1/settlements/{id}/transactions in backend/src/main/java/com/settleup/controller/SettlementController.java
- [ ] T063 [US2] Add validation for edge cases (0원, 음수, 반올림) in SettlementCalculationService

**Mobile**:
- [ ] T064 [P] [US2] Create Transaction model in mobile/src/models/Transaction.ts
- [ ] T065 [US2] Create SettlementSummary component in mobile/src/components/SettlementSummary.tsx
- [ ] T066 [US2] Implement calculation trigger in mobile/src/services/api/settlementService.ts
- [ ] T067 [US2] Display intermediate balances in TravelSettlementScreen
- [ ] T068 [US2] Display final settlement transactions in SettlementSummary
- [ ] T069 [US2] Add refresh functionality for real-time updates

**Checkpoint**: 정산 계산 및 결과 조회가 완전히 동작하며, US1과 독립적으로 테스트 가능

---

## Phase 5: User Story 3 - 게임 정산 (Priority: P3)

**Goal**: 게임 라운드별 결과를 입력하고 최종 금액을 정산할 수 있다

**Independent Test**: 게임 정산 생성 → 참가자 3명 → 라운드 2개 입력 → 최종 정산 확인

### Tests for User Story 3 ⚠️

- [ ] T070 [P] [US3] Unit test for game calculation in backend/src/test/java/com/settleup/service/GameCalculationServiceTest.java
- [ ] T071 [P] [US3] Integration test for game rounds in backend/src/test/java/com/settleup/integration/GameApiTest.java
- [ ] T072 [P] [US3] Component test for GameSettlementScreen in mobile/__tests__/screens/GameSettlementScreen.test.tsx

### Implementation for User Story 3

**Backend**:
- [ ] T073 [P] [US3] Create GameRound entity in backend/src/main/java/com/settleup/domain/game/GameRound.java
- [ ] T074 [P] [US3] Create GameResult entity in backend/src/main/java/com/settleup/domain/game/GameResult.java
- [ ] T075 [P] [US3] Create GameRoundRepository in backend/src/main/java/com/settleup/repository/GameRoundRepository.java
- [ ] T076 [P] [US3] Create GameResultRepository in backend/src/main/java/com/settleup/repository/GameResultRepository.java
- [ ] T077 [US3] Create GameService in backend/src/main/java/com/settleup/service/GameService.java
- [ ] T078 [US3] Implement game settlement calculation in backend/src/main/java/com/settleup/service/GameCalculationService.java
- [ ] T079 [P] [US3] Create Game DTOs in backend/src/main/java/com/settleup/dto/GameDto.java
- [ ] T080 [US3] Implement POST /api/v1/settlements/{id}/rounds in backend/src/main/java/com/settleup/controller/GameController.java
- [ ] T081 [US3] Implement POST /api/v1/settlements/{id}/rounds/{roundId}/results in backend/src/main/java/com/settleup/controller/GameController.java
- [ ] T082 [US3] Implement game settlement finalization

**Mobile**:
- [ ] T083 [P] [US3] Create GameRound model in mobile/src/models/GameRound.ts
- [ ] T084 [P] [US3] Create GameResult model in mobile/src/models/GameResult.ts
- [ ] T085 [US3] Create GameSettlementScreen in mobile/src/screens/GameSettlementScreen.tsx
- [ ] T086 [US3] Create GameRoundInput component in mobile/src/components/GameRoundInput.tsx
- [ ] T087 [US3] Implement round result input UI
- [ ] T088 [US3] Display cumulative scores across rounds
- [ ] T089 [US3] Implement final game settlement display

**Checkpoint**: 게임 정산 기능이 완전히 동작하며, 여행 정산과 독립적으로 테스트 가능

---

## Phase 6: User Story 4 - 텍스트 공유 및 히스토리 (Priority: P4)

**Goal**: 정산 내용을 텍스트로 내보내고 과거 정산을 조회할 수 있다

**Independent Test**: 완료된 정산 → 텍스트 내보내기 → 공유 → 히스토리에서 재조회

### Tests for User Story 4 ⚠️

- [ ] T090 [P] [US4] Unit test for text export formatting in backend/src/test/java/com/settleup/service/ExportServiceTest.java
- [ ] T091 [P] [US4] Integration test for /export endpoint in backend/src/test/java/com/settleup/integration/ExportApiTest.java

### Implementation for User Story 4

**Backend**:
- [ ] T092 [P] [US4] Create ExportService in backend/src/main/java/com/settleup/service/ExportService.java
- [ ] T093 [US4] Implement text format export in ExportService
- [ ] T094 [US4] Implement markdown format export in ExportService
- [ ] T095 [US4] Implement GET /api/v1/settlements/{id}/export in backend/src/main/java/com/settleup/controller/SettlementController.java
- [ ] T096 [US4] Implement GET /api/v1/settlements with pagination and filtering in SettlementController
- [ ] T097 [US4] Add search functionality by date and participants

**Mobile**:
- [ ] T098 [US4] Implement text sharing in mobile/src/services/share/shareService.ts
- [ ] T099 [US4] Add export button to SettlementSummary component
- [ ] T100 [US4] Create SettlementHistoryScreen in mobile/src/screens/SettlementHistoryScreen.tsx
- [ ] T101 [US4] Implement settlement list with filtering
- [ ] T102 [US4] Add search functionality in SettlementHistoryScreen
- [ ] T103 [US4] Implement pull-to-refresh for settlement history

**Checkpoint**: 텍스트 공유 및 히스토리 조회 기능이 완전히 동작

---

## Phase 7: User Story 5 - AI 카테고리 분류 (Priority: P5) 🤖 MLOps

**Goal**: 지출 설명 텍스트를 입력하면 AI가 자동으로 카테고리를 추천한다

**Independent Test**: 지출 입력 시 "택시 요금" → AI가 "교통" 카테고리 추천 → 확인 및 저장

### Tests for User Story 5 ⚠️

- [ ] T104 [P] [US5] Unit test for FastText classifier in ml-service/tests/test_classifier.py
- [ ] T105 [P] [US5] API test for /categorize endpoint in ml-service/tests/test_api.py
- [ ] T106 [P] [US5] Integration test for category suggestion in backend/src/test/java/com/settleup/integration/CategoryApiTest.java

### Implementation for User Story 5

**ML Service**:
- [ ] T107 [P] [US5] Create FastAPI application in ml-service/src/api/main.py
- [ ] T108 [P] [US5] Implement text preprocessing in ml-service/src/preprocessing/text_processor.py
- [ ] T109 [US5] Train FastText model with sample data in ml-service/src/models/train_fasttext.py
- [ ] T110 [US5] Create inference service in ml-service/src/inference/fasttext_classifier.py
- [ ] T111 [US5] Implement POST /categorize endpoint in ml-service/src/api/main.py
- [ ] T112 [US5] Add confidence threshold filtering in inference service
- [ ] T113 [P] [US5] Create Dockerfile for ML service in ml-service/Dockerfile
- [ ] T114 [US5] Add ML service to infrastructure/docker/docker-compose.yml

**Backend Integration**:
- [ ] T115 [P] [US5] Create ML client in backend/src/main/java/com/settleup/client/MLServiceClient.java
- [ ] T116 [US5] Integrate ML categorization into ExpenseService
- [ ] T117 [US5] Implement POST /api/v1/settlements/{id}/expenses/categorize in ExpenseController
- [ ] T118 [US5] Add fallback handling for ML service unavailability

**Mobile Integration**:
- [ ] T119 [US5] Add AI category suggestion to expense input form
- [ ] T120 [US5] Display confidence score and alternatives
- [ ] T121 [US5] Allow manual category override

**Checkpoint**: AI 카테고리 분류가 동작하며, 오프라인 시 수동 입력으로 fallback

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 모든 사용자 스토리에 영향을 주는 개선 사항

- [ ] T122 [P] Add logging framework in backend/src/main/java/com/settleup/config/LoggingConfig.java
- [ ] T123 [P] Implement data validation across all DTOs
- [ ] T124 [P] Add API documentation with Swagger in backend/src/main/java/com/settleup/config/SwaggerConfig.java
- [ ] T125 [P] Optimize database queries with JPA indexes
- [ ] T126 [P] Add loading states and error handling in mobile app
- [ ] T127 [P] Implement optimistic UI updates in mobile
- [ ] T128 [P] Add internationalization (i18n) support for Korean/English
- [ ] T129 Create health check endpoints for all services
- [ ] T130 Setup CI/CD pipeline with GitHub Actions in .github/workflows/ci.yml
- [ ] T131 Add Docker build automation in .github/workflows/docker.yml
- [ ] T132 Run quickstart.md validation end-to-end
- [ ] T133 Performance testing for 50 participants scenario
- [ ] T134 Security audit and OWASP compliance check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 - 모든 사용자 스토리 BLOCK
- **User Stories (Phase 3-7)**: Foundational 완료 후
  - US1 (P1): Foundation 이후 즉시 시작 가능
  - US2 (P2): US1 데이터 의존 (독립 테스트 가능)
  - US3 (P3): Foundation만 의존 (US1/US2와 독립)
  - US4 (P4): US1 또는 US3 완료 후 (내보낼 데이터 필요)
  - US5 (P5): US1 완료 후 (지출 입력 UI 필요)
- **Polish (Phase 8)**: 원하는 스토리 완료 후

### User Story Dependencies

- **User Story 1 (P1)**: Foundation 이후 - 다른 스토리 의존성 없음
- **User Story 2 (P2)**: US1 데이터 사용 (계산할 지출 필요) - 독립 테스트 가능
- **User Story 3 (P3)**: Foundation만 의존 - US1/US2와 완전 독립
- **User Story 4 (P4)**: US1 또는 US3 완료 후 - 내보낼 정산 필요
- **User Story 5 (P5)**: US1 완료 후 - 지출 입력 흐름 통합

### Within Each User Story

- 테스트 먼저 작성 → 실패 확인 → 구현
- 엔티티 → Repository → Service → Controller
- 모바일: Model → Service → Screen → Component
- 핵심 구현 → 통합 → 완성
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- **Setup phase**: T004-T008 병렬 실행 가능
- **Foundational phase**: T010-T020 모두 병렬 가능
- **Foundation 완료 후**: US1, US3 병렬 시작 가능
- **각 스토리 내**: 테스트, 엔티티, DTO는 [P] 마크된 것 병렬 가능
- **서로 다른 스토리**: 여러 팀원이 동시 작업 가능

---

## Parallel Example: User Story 1

```bash
# US1 테스트들 병렬 실행:
T022, T023, T024, T025 동시 실행

# US1 엔티티들 병렬 실행:
T026, T027 동시 실행

# US1 Repository들 병렬 실행:
T028, T029 동시 실행

# US1 DTO들 병렬 실행:
T033, T034 동시 실행

# US1 모바일 모델들 병렬 실행:
T040, T041, T042 동시 실행
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - 모든 스토리 블록)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: US1 독립 테스트
5. 배포/데모 준비 완료

### Incremental Delivery (MLOps 실습 추천)

1. **Iteration 1**: Setup + Foundation → Foundation 준비 완료
2. **Iteration 2**: US1 (여행 정산 기본) → 독립 테스트 → 배포/데모 (MVP!)
3. **Iteration 3**: US2 (여행 정산 결산) → 독립 테스트 → 배포/데모
4. **Iteration 4**: US3 (게임 정산) → 독립 테스트 → 배포/데모
5. **Iteration 5**: US5 (AI 분류) → ML 파이프라인 실습 → 배포/데모
6. **Iteration 6**: US4 + Polish → 최종 완성

각 iteration마다 Docker 이미지 빌드, 배포, 모니터링 실습

### Parallel Team Strategy

여러 개발자가 있는 경우:

1. 팀이 함께 Setup + Foundational 완료
2. Foundation 완료 후:
   - Developer A: User Story 1 (여행 정산 기본)
   - Developer B: User Story 3 (게임 정산)
   - Developer C: ML Service (US5)
3. 각 스토리 독립 완성 및 통합

---

## MLOps 실습 체크포인트

### Docker & Containerization
- [ ] Phase 1 완료 후: Docker Compose로 전체 스택 실행
- [ ] US5 완료 후: ML 서비스 컨테이너 추가
- [ ] 각 서비스별 Dockerfile 작성 및 빌드

### Model Training & Versioning
- [ ] T109: FastText 모델 훈련 (v1.0)
- [ ] 모델 파일 버저닝 (models/v1.0/, v2.0/)
- [ ] Phase 2 (선택): MobileBERT로 업그레이드

### CI/CD Pipeline
- [ ] T130-T131: GitHub Actions 설정
- [ ] 자동 테스트 실행
- [ ] Docker 이미지 자동 빌드
- [ ] 컨테이너 레지스트리 푸시

### Monitoring & Observability
- [ ] T122: 로깅 프레임워크
- [ ] T129: Health check 엔드포인트
- [ ] (고급) Prometheus + Grafana 추가

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음
- [Story] 레이블로 작업을 스토리에 매핑
- 각 사용자 스토리는 독립적으로 완성 및 테스트 가능
- 테스트 먼저, 실패 확인 후 구현
- 각 작업 또는 논리적 그룹 후 커밋
- 체크포인트에서 멈춰 스토리 독립 검증
- 회피: 모호한 작업, 파일 충돌, 스토리 독립성 깨는 의존성

---

## Summary

**Total Tasks**: 134
**User Story Breakdown**:
- Setup: 9 tasks
- Foundation: 12 tasks
- US1 (여행 정산 기본): 30 tasks
- US2 (여행 정산 결산): 18 tasks
- US3 (게임 정산): 20 tasks
- US4 (공유 & 히스토리): 14 tasks
- US5 (AI 분류): 18 tasks
- Polish: 13 tasks

**Parallel Opportunities**: ~50 tasks 병렬 실행 가능
**MVP Scope**: Phase 1 + 2 + US1 (51 tasks)
**MLOps Focus**: US5 + CI/CD + Docker (20+ tasks)

**Independent Test Criteria**:
- US1: 정산 생성, 참가자 추가, 지출 입력이 독립 동작
- US2: US1 데이터로 계산 결과 조회
- US3: 게임 정산이 여행 정산과 독립 동작
- US4: 완료된 정산 내보내기 및 조회
- US5: AI 분류가 지출 입력에 통합

**Format Validation**: ✅ 모든 134개 작업이 체크리스트 형식 준수
