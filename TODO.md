# SettleUp TODO

## 📋 프로젝트 진행 상황

### ✅ Phase 1: 프로젝트 초기 설정 (완료)

- [x] 프로젝트 구조 설계
- [x] 백엔드 Spring Boot 프로젝트 설정
- [x] 모바일 Expo 프로젝트 설정
- [x] TypeScript 설정
- [x] PostgreSQL 데이터베이스 설정
- [x] Git 저장소 초기화

### ✅ Phase 2: 백엔드 API 개발 (완료)

#### 정산 (Settlement)
- [x] Settlement 엔티티 및 DTO 정의
- [x] Settlement CRUD API
  - [x] POST /settlements (정산 생성)
  - [x] GET /settlements (정산 목록 조회)
  - [x] GET /settlements/{id} (정산 상세 조회)
  - [x] PUT /settlements/{id} (정산 수정)
  - [x] DELETE /settlements/{id} (정산 삭제)

#### 참가자 (Participant)
- [x] Participant 엔티티 및 DTO 정의
- [x] Participant CRUD API
  - [x] POST /settlements/{id}/participants (참가자 추가)
  - [x] GET /settlements/{id}/participants (참가자 목록 조회)
  - [x] PUT /participants/{id} (참가자 수정)
  - [x] DELETE /participants/{id} (참가자 삭제)

#### 지출 (Expense)
- [x] Expense 엔티티 및 DTO 정의
- [x] ExpenseSplit 엔티티 정의
- [x] Expense CRUD API
  - [x] POST /settlements/{id}/expenses (지출 추가)
  - [x] GET /settlements/{id}/expenses (지출 목록 조회)
  - [x] GET /expenses/{id} (지출 상세 조회)
  - [x] PUT /expenses/{id} (지출 수정)
  - [x] DELETE /expenses/{id} (지출 삭제)
- [x] splits 필드를 optional로 변경 (나중에 정산 시 지정)

### ✅ Phase 3: 모바일 앱 기본 구조 (완료)

#### 네비게이션
- [x] React Navigation 설정
- [x] Bottom Tab Navigator (홈, 히스토리)
- [x] Stack Navigator (화면 스택)
- [x] 화면 등록
  - [x] HomeScreen
  - [x] TravelSettlementScreen
  - [x] CreateSettlementScreen
  - [x] SettlementResultScreen (placeholder)

#### 데이터 관리
- [x] SQLite 데이터베이스 초기화
- [x] 로컬 스토리지 구조
- [x] API 클라이언트 설정
- [x] 모델 타입 정의 (Settlement, Participant, Expense)

### ✅ Phase 4: 핵심 기능 구현 (진행 중)

#### 정산 관리
- [x] 정산 목록 화면 (HomeScreen)
  - [x] 정산 목록 조회 및 표시
  - [x] 정산 생성 버튼
  - [x] 정산 카드 UI
  - [x] 로딩 상태 표시
  - [x] 에러 처리
- [x] 정산 생성 화면 (CreateSettlementScreen)
  - [x] 정산 타입 선택 (여행/게임)
  - [x] 제목 입력
  - [x] 설명 입력
  - [x] 통화 표시
  - [x] 유효성 검증
  - [x] API 연동
  - [x] 로컬 저장소 동기화
- [ ] 정산 수정 기능
- [ ] 정산 삭제 기능

#### 정산 상세 화면
- [x] 정산 정보 표시
- [x] 탭 네비게이션 (참가자, 지출)
- [x] 참가자 탭
  - [x] 참가자 목록 표시
  - [x] 참가자 추가 모달
  - [x] API 연동
- [x] 지출 탭
  - [x] 지출 목록 표시
  - [x] 지출 추가 모달
  - [x] API 연동
  - [x] 분담 방식 입력 제거 (나중에 정산 시 지정)
  - [x] 날짜 형식 수정 (LocalDateTime 호환)
- [x] 참가자 수정 기능
  - [x] EditParticipantModal 컴포넌트 구현
  - [x] ParticipantList에 수정 버튼 추가
  - [x] API 연동 및 목록 자동 새로고침
- [x] 참가자 삭제 기능
- [x] 지출 수정 기능
  - [x] EditExpenseModal 컴포넌트 (DatePicker 포함)
  - [x] API 연동 및 목록 자동 새로고침
- [x] 지출 삭제 기능
- [x] 정산하기 버튼 구현

---

## ✅ Phase 5: 정산 결과 계산 (완료)

### 백엔드
- [x] 정산 결과 계산 서비스 구현
  - [x] 각 참가자별 총 지출 계산
  - [x] 각 참가자별 분담해야 할 금액 계산
  - [x] 최소 송금 횟수로 정산 경로 계산 (그리디 알고리즘)
  - [x] 정산 결과 DTO 정의
- [x] 정산 결과 API
  - [x] POST /settlements/{id}/calculate (정산 계산 및 결과 조회)
- [x] 백엔드 테스트 코드 작성
  - [x] SettlementCalculationService 단위 테스트
    - [x] 참가자별 잔액 계산 테스트
    - [x] 최소 송금 경로 계산 테스트
    - [x] 엣지 케이스 (0원, 소수점 처리, 다수 참가자)
  - [x] 정산 계산 API 통합 테스트
  - [x] 기존 Service 단위 테스트 (SettlementService, ParticipantService, ExpenseService)
  - [x] 기존 API 통합 테스트 (모든 엔드포인트)

### 모바일
- [x] 나머지 처리 UI 구현
  - [x] 나머지 발생 감지 및 알림
  - [x] 추가 지불자 선택 (셀렉트 박스)
  - [x] 추가 금액 입력 (숫자 입력칸)
  - [x] 실시간 검증: (총액 - 추가금) % 인원수 === 0
  - [x] 검증 결과 시각적 피드백 (✅/⚠️)
- [x] SettlementResultScreen 실제 구현
  - [x] 정산 결과 API 연동
  - [x] 참가자별 지출 요약 표시
  - [x] 정산 경로 표시 ("A → B: 10,000원")
  - [x] 공유 기능 (텍스트로 정산 결과 공유)
  - [x] 완료 처리

---

## ✅ Phase 6: 지출 분담 설정 (완료)

### 백엔드
- [x] 지출 분담 설정 API
  - [x] PUT /expenses/{id}/splits (지출 분담 설정)
  - [x] 균등 분할 자동 계산 옵션
  - [x] 수동 분담 금액 입력
  - [x] 분담 금액 합계 검증
- [x] 단위 테스트 작성 (5개 테스트 케이스)

### 모바일
- [x] 지출 분담 설정 화면
  - [x] 분담 방식 선택 (균등 분할/수동 입력)
  - [x] 참가자별 분담 금액 입력
  - [x] 실시간 합계 검증
  - [x] API 연동
- [x] ExpenseSplitModal 컴포넌트 구현
- [x] ExpenseItem에 분담설정 버튼 추가

---

## ✅ Phase 7: 수정/삭제 기능 (완료)

### 모바일
- [x] 지출 수정 기능 (EditExpenseModal)
- [x] 지출 삭제 기능
- [x] 참가자 수정 기능 (EditParticipantModal)
- [x] 참가자 삭제 기능
- [x] 정산 수정 기능 (EditSettlementModal)
- [x] 정산 삭제 기능

---

## ✅ Phase 8: 히스토리 및 검색 (완료)

### 백엔드
- [x] 정산 히스토리 API
  - [x] 정산 상태별 필터링 (진행 중/완료/보관)
  - [x] 타입별 필터링 (여행/게임)
  - [x] 페이지네이션 지원
- [x] 정산 검색 API
  - [x] 제목으로 검색 (대소문자 무관)
  - [x] 설명으로 검색
  - [x] GET /settlements/search 엔드포인트 구현
- [x] Repository 메서드 확장
  - [x] findByTitleContainingIgnoreCaseOrDescriptionContaining
  - [x] findByStatusOrderByUpdatedAtDesc
  - [x] findByTypeOrderByUpdatedAtDesc
  - [x] findAllByOrderByUpdatedAtDesc
- [x] 포괄적인 단위 테스트 작성 (검색/필터링)

### 모바일
- [x] 히스토리 화면 구현 (SettlementHistoryScreen)
  - [x] 정산 목록 표시
  - [x] 상태별 필터 (진행 중/완료/보관)
  - [x] 타입별 필터 (여행/게임)
  - [x] 검색 기능 (제목/설명)
  - [x] Pull-to-refresh 지원
  - [x] 빈 상태 처리
  - [x] 실시간 필터링 및 결과 카운트
- [x] 정산 상세 히스토리
  - [x] 완료된 정산 조회
  - [x] 정산 결과 재확인
- [x] 네비게이션 통합 (Bottom Tab)
- [x] API 연동 완료 (searchSettlements 추가)

---

## 🔲 Phase 9: 오프라인 동기화

### 모바일
- [ ] 오프라인 큐 시스템 구현
  - [ ] 로컬 작업 큐 저장
  - [ ] 네트워크 상태 감지
  - [ ] 자동 동기화
  - [ ] 충돌 해결 전략
- [ ] 동기화 상태 표시
  - [ ] 동기화 중 표시
  - [ ] 동기화 실패 처리
  - [ ] 재시도 기능

---

## ✅ Phase 10: UI/UX 개선

### 디자인
- [x] 일관된 디자인 시스템 적용
  - [x] 색상 팔레트 정의 (Colors.ts)
  - [x] 타이포그래피 스타일 (Typography.ts)
  - [x] 간격(spacing) 시스템 (Spacing.ts)
  - [x] 주요 컴포넌트에 디자인 시스템 적용 (ExpenseItem, ParticipantList, SettlementHistoryScreen)
  - [x] 텍스트 표시 문제 모두 해결
- [x] 로딩 상태 개선
  - [x] 스켈레톤 UI (LoadingComponents.tsx)
  - [x] 프로그레스 인디케이터
  - [x] 로딩 래퍼 컴포넌트
- [x] 에러 처리 개선
  - [x] 사용자 친화적 에러 메시지
  - [x] 토스트 메시지 시스템 (ToastMessage.tsx)
  - [x] 글로벌 토스트 매니저
- [x] 애니메이션 추가
  - [x] 화면 전환 애니메이션
  - [x] 리스트 아이템 애니메이션
  - [x] 버튼 피드백

---

## 🔲 Phase 11: 추가 기능

### 게임 정산
- [x] 라운드별 금액 입출 기록 시스템
  - [x] 라운드 추가/삭제 기능
  - [x] 승리자 선택 + 금액 입력 → 패배자 자동 계산
  - [x] 라운드별 참가자 제외 기능
  - [x] 라운드별 총합 검증 (합계 = 0 확인)
- [x] 게임 정산 화면
  - [x] 세로 아코디언 UI
  - [x] 승리자/금액 입력 + 정산 미리보기
  - [x] 참가자 관리 섹션 (추가/토글/삭제)
  - [x] 누적 현황 실시간 표시
  - [x] 최종 정산 계산 및 결과

### 고급 기능
- [ ] 영수증 사진 첨부
  - [ ] 이미지 업로드
  - [ ] 저장 및 표시
- [ ] OCR로 영수증 인식
  - [ ] 금액 자동 인식
  - [ ] 날짜 자동 인식
- [ ] 통계 및 리포트
  - [ ] 월별/연도별 지출 통계
  - [ ] 카테고리별 분석
  - [ ] 차트 표시
- [ ] 알림 기능
  - [ ] 정산 완료 알림
  - [ ] 미정산 금액 리마인더
- [ ] 나머지 금액 처리 개선
  - [ ] 사용자가 나머지 처리자를 미리 선택할 수 있도록 개선
  - [ ] 균등분할 시 나머지 분배 방식 옵션 제공 (첫 번째 참가자/마지막 참가자/랜덤 등)

---

## 🔲 Phase 12: 테스트 및 배포

### 테스트
- [ ] 유닛 테스트
  - [ ] 백엔드 서비스 테스트
  - [ ] 모바일 유틸리티 함수 테스트
- [ ] 통합 테스트
  - [ ] API 통합 테스트
- [ ] E2E 테스트
  - [ ] 주요 사용자 플로우 테스트

### 배포
- [ ] 백엔드 배포
  - [ ] Docker 이미지 생성
  - [ ] AWS/GCP 배포 설정
  - [ ] CI/CD 파이프라인
- [ ] 모바일 배포
  - [ ] iOS 앱 스토어 배포
  - [ ] Android Play 스토어 배포
  - [ ] EAS Build 설정

---

## 📝 메모

### 최근 작업 (2025-12-18)
- ✅ 게임 정산 기능 완전 구현 (Phase 11 일부 완료)
  - ✅ 게임 정산 모델 및 타입 정의: GameSettlement.ts
  - ✅ 게임 정산 유틸리티 함수: gameSettlementUtils.ts
  - ✅ 포괄적인 단위 테스트 (18개 테스트 케이스)
  - ✅ 로컬 스토리지 기반 게임 정산 서비스
  - ✅ GameSettlementScreen: 라운드별 금액 입출 UI
  - ✅ GameSettlementResultScreen: 최종 정산 결과 화면
  - ✅ 네비게이션 통합 및 기존 화면 연동
  - ✅ 통합 테스트 작성

- ✅ Phase 10 애니메이션 완전 구현 (Phase 10 완료)
  - ✅ 화면 전환 애니메이션: slideFromRight, slideFromBottom, fadeIn
  - ✅ 리스트 아이템 순차 애니메이션: ExpenseItem, ParticipantList
  - ✅ 버튼 피드백 애니메이션: AnimatedButton 컴포넌트
  - ✅ 터치 스케일, 펄스, 셰이크 피드백 효과
  - ✅ 모든 주요 버튼에 애니메이션 적용

### 이전 작업 (2025-12-17)
- ✅ UI/UX 개선 완전 구현 (Phase 10 디자인 시스템)
  - ✅ 디자인 시스템 구축: Colors.ts, Typography.ts, Spacing.ts
  - ✅ 로딩 상태 UI 컴포넌트: LoadingComponents.tsx
  - ✅ 토스트 메시지 시스템: ToastMessage.tsx
  - ✅ 주요 컴포넌트에 디자인 시스템 적용
  - ✅ 텍스트 표시 문제 모두 해결 (섹션 타이틀, 목록 데이터, 버튼 텍스트)

- ✅ 히스토리 및 검색 기능 완전 구현 (Phase 8 완료)
  - ✅ 백엔드 검색 API 개선: GET /settlements/search
  - ✅ 페이지네이션, 필터링, 검색 모두 지원
  - ✅ SettlementHistoryScreen 이미 완전 구현됨 확인
  - ✅ 실시간 검색/필터링 및 Pull-to-refresh
  - ✅ 포괄적인 단위 테스트 추가

- ✅ 지출 분담 설정 기능 완전 구현 (Phase 6 완료)
  - ✅ 백엔드 API 구현: PUT /expenses/{id}/splits
  - ✅ 균등분할과 수동입력 두 방식 모두 지원
  - ✅ ExpenseSplitModal 컴포넌트 구현
  - ✅ 실시간 금액 검증 및 시각적 피드백
  - ✅ 포괄적인 단위 테스트 5개 작성

### 이전 작업 (2025-12-15)
- ✅ SafeArea 처리 일관성 개선 및 상단 여백 최적화
- ✅ 참가자 수정 기능 완전 구현 (EditParticipantModal)
- ✅ 지출 수정/삭제 기능 확인 완료 (이미 구현됨)
- ✅ 참가자 삭제 기능 확인 완료 (이미 구현됨)
- ✅ 정산 결과 화면 완전 구현 확인 (SettlementResultScreen)
- ✅ Phase 4, 5 핵심 기능 모두 완료

### 이전 작업 (2025-11-26)
- ✅ 지출 추가 시 분담 방식 입력 제거
- ✅ 날짜 형식을 LocalDateTime 호환으로 수정
- ✅ SettlementResultScreen placeholder 추가
- ✅ 백엔드 splits 필드 optional로 변경

### 최근 작업 (2025-02-11)
- ✅ 게임 정산 참가자 관리 기능 추가
  - ✅ 라운드별 참가자 제외 기능 (excludedParticipantIds)
  - ✅ 참가자 관리 섹션 (칩 UI, 추가/토글/삭제)
  - ✅ 승리자 선택 + 금액 입력 방식으로 라운드 입력 변경
  - ✅ 패배자 자동 계산 (균등 분배 + 나머지 처리)
  - ✅ 정산 미리보기 표시

---

## 🚨 다음 스프린트 - 기획 리뷰 기반 (2025-02-11)

### P0 - 릴리즈 전 필수

- [ ] **게임 정산 백엔드 API 구현 및 연동** (3일)
  - 게임 라운드 Entity/Controller/Service 생성
  - 모바일에서 AsyncStorage → API 전환
  - 기존 로컬 데이터 마이그레이션 처리
  - 현재 앱 삭제 시 모든 게임 데이터 손실됨

- [ ] **초대 코드 입력 화면 구현** (1일)
  - JoinSettlementScreen 신규 생성
  - AppNavigator에 라우트 추가
  - joinByInviteCode API 연동 (API는 이미 있음)

- [ ] **정산 완료 후 수정 방지 강화** (0.5일)
  - 게임 정산에서 완료 상태에서도 라운드 추가 가능한 버그 수정
  - 여행/게임 정산 완료 후 편집 차단 일관성 검토

- [ ] **더블 탭 중복 제출 방지** (0.5일)
  - AnimatedButton에 onPress 실행 중 disabled 처리 추가

### P1 - 중요

- [ ] **게임 정산 결과 공유 기능** (0.5일)
  - GameSettlementResultScreen에 Share 구현 (버튼만 있고 미구현)
  - SettlementResultScreen의 handleShare 참고

- [ ] **정산 목록에 금액 미리보기** (1일)
  - 백엔드: 정산 요약 API 추가
  - HomeScreen 카드에 총 지출/내 잔액 표시

- [ ] **게임 라운드 수정 기능** (1일)
  - 저장된 라운드 재편집 UI 추가 (현재 삭제 후 재입력만 가능)

- [ ] **지출 입력 시 참가자 0명 사전 차단** (0.5일)
  - AddExpenseModal 열기 전 참가자 존재 여부 검증
  - 안내 메시지 표시

- [ ] **정산 검색 UI** (0.5일)
  - HomeScreen에 검색바 추가 (백엔드 searchSettlements API는 이미 있음)

### P2 - 개선

- [ ] **금액 검증 강화** - 0원/음수 지출 차단 (모바일 + 백엔드)
- [ ] **엣지 케이스 처리** - 전체 참가자 비활성화, 라운드 전원 제외 시 방어 로직
- [ ] **모달 뒤로가기 확인** - 입력 중 데이터 손실 방지 다이얼로그
- [ ] **온보딩 튜토리얼** - 첫 사용자 안내 화면
- [ ] **오프라인 동기화 완성** - 충돌 해결 로직, 동기화 상태 표시
- [ ] **AI 카테고리 연동** - ML 서비스 → 백엔드 → 모바일 파이프라인
- [ ] **다크 모드** - Colors.ts 토큰 기반 테마 전환
