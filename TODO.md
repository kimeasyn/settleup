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

## 🔲 Phase 6: 지출 분담 설정

### 백엔드
- [ ] 지출 분담 설정 API
  - [ ] PUT /expenses/{id}/splits (지출 분담 설정)
  - [ ] 균등 분할 자동 계산 옵션
  - [ ] 수동 분담 금액 입력
  - [ ] 분담 금액 합계 검증

### 모바일
- [ ] 지출 분담 설정 화면
  - [ ] 분담 방식 선택 (균등 분할/수동 입력)
  - [ ] 참가자별 분담 금액 입력
  - [ ] 실시간 합계 검증
  - [ ] API 연동

---

## 🔲 Phase 7: 수정/삭제 기능

### 모바일
- [ ] 지출 수정 기능
  - [ ] 수정 모달 UI
  - [ ] API 연동
  - [ ] 낙관적 업데이트
- [ ] 지출 삭제 기능
  - [ ] 삭제 확인 다이얼로그
  - [ ] API 연동
  - [ ] 목록 업데이트
- [ ] 참가자 수정 기능
  - [ ] 수정 모달 UI
  - [ ] API 연동
- [ ] 참가자 삭제 기능
  - [ ] 삭제 확인 다이얼로그
  - [ ] API 연동
  - [ ] 관련 지출 처리 확인
- [ ] 정산 수정 기능
  - [ ] 수정 화면 UI
  - [ ] API 연동
- [ ] 정산 삭제 기능
  - [ ] 삭제 확인 다이얼로그
  - [ ] API 연동
  - [ ] 관련 데이터 정리

---

## 🔲 Phase 8: 히스토리 및 검색

### 백엔드
- [ ] 정산 히스토리 API
  - [ ] 정산 상태별 필터링 (진행 중/완료)
  - [ ] 날짜 범위 검색
  - [ ] 페이지네이션
- [ ] 정산 검색 API
  - [ ] 제목으로 검색
  - [ ] 참가자 이름으로 검색

### 모바일
- [ ] 히스토리 화면 구현
  - [ ] 정산 목록 표시
  - [ ] 상태별 필터 (진행 중/완료)
  - [ ] 검색 기능
  - [ ] 무한 스크롤
- [ ] 정산 상세 히스토리
  - [ ] 완료된 정산 조회
  - [ ] 정산 결과 재확인

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

## 🔲 Phase 10: UI/UX 개선

### 디자인
- [ ] 일관된 디자인 시스템 적용
  - [ ] 색상 팔레트 정의
  - [ ] 타이포그래피 스타일
  - [ ] 간격(spacing) 시스템
  - [ ] 컴포넌트 스타일 가이드
- [ ] 로딩 상태 개선
  - [ ] 스켈레톤 UI
  - [ ] 프로그레스 인디케이터
- [ ] 에러 처리 개선
  - [ ] 사용자 친화적 에러 메시지
  - [ ] 재시도 버튼
  - [ ] 토스트 메시지
- [ ] 애니메이션 추가
  - [ ] 화면 전환 애니메이션
  - [ ] 리스트 아이템 애니메이션
  - [ ] 버튼 피드백

---

## 🔲 Phase 11: 추가 기능

### 게임 정산 (선택)
- [ ] 게임 정산 타입별 계산 로직
  - [ ] 포커 정산 (점수 → 금액 변환)
  - [ ] 마작 정산
  - [ ] 기타 게임
- [ ] 게임 정산 화면
  - [ ] 라운드 관리
  - [ ] 점수 입력
  - [ ] 실시간 계산

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

### 최근 작업 (2025-12-15)
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

### 다음 우선순위
1. 지출 분담 설정 기능 (Phase 6)
2. 히스토리 및 검색 기능 (Phase 8)
3. UI/UX 개선 (Phase 10)
