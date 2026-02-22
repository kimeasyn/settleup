# SettleUp TODO

## 프로젝트 진행 상황

### Phase 1: 프로젝트 초기 설정 (완료)

- [x] 프로젝트 구조 설계
- [x] 백엔드 Spring Boot 프로젝트 설정
- [x] 모바일 Expo 프로젝트 설정
- [x] TypeScript 설정
- [x] PostgreSQL 데이터베이스 설정
- [x] Git 저장소 초기화

### Phase 2: 백엔드 API 개발 (완료)

#### 정산 (Settlement)
- [x] Settlement 엔티티 및 DTO 정의
- [x] Settlement CRUD API

#### 참가자 (Participant)
- [x] Participant 엔티티 및 DTO 정의
- [x] Participant CRUD API

#### 지출 (Expense)
- [x] Expense 엔티티 및 DTO 정의
- [x] ExpenseSplit 엔티티 정의
- [x] Expense CRUD API
- [x] splits 필드를 optional로 변경

### Phase 3: 모바일 앱 기본 구조 (완료)

- [x] React Navigation 설정 (Bottom Tab + Stack)
- [x] SQLite / API 클라이언트 설정
- [x] 모델 타입 정의

### Phase 4: 핵심 기능 구현 (완료)

- [x] 정산 목록 화면 (HomeScreen)
- [x] 정산 생성 화면 (CreateSettlementScreen)
- [x] 정산 수정 기능 (EditSettlementModal)
- [x] 정산 삭제 기능
- [x] 정산 상세 화면 (참가자/지출 탭)
- [x] 참가자 CRUD (추가/수정/삭제/토글)
- [x] 지출 CRUD (추가/수정/삭제)

### Phase 5: 정산 결과 계산 (완료)

- [x] 백엔드 정산 계산 서비스 (그리디 알고리즘)
- [x] 나머지 처리 UI
- [x] SettlementResultScreen (결과 표시 + 공유)
- [x] 정산 결과 저장/조회 API

### Phase 6: 지출 분담 설정 (완료)

- [x] 백엔드 API (균등분할/수동입력)
- [x] ExpenseSplitModal 컴포넌트

### Phase 7: 수정/삭제 기능 (완료)

- [x] 지출/참가자/정산 수정/삭제 모달 전체 구현

### Phase 8: 히스토리 및 검색 (완료)

- [x] 백엔드 검색/필터링/페이지네이션 API
- [x] SettlementHistoryScreen

### Phase 9: 인증 시스템 (완료)

- [x] JWT 인증 시스템 및 Spring Security 설정
- [x] Google 소셜 로그인 (OAuth2 + PKCE)
- [x] Kakao 소셜 로그인 (OIDC)
- [x] 토큰 저장 및 자동 갱신
- [x] 로그인/로그아웃 화면

### Phase 10: UI/UX 개선 (완료)

- [x] 디자인 시스템 (Colors, Typography, Spacing)
- [x] 로딩/에러/토스트 UI
- [x] 애니메이션 (화면 전환, 리스트, 버튼 피드백)

### Phase 11: 게임 정산 (완료)

- [x] 게임 정산 백엔드 API 구현 및 모바일 연동
- [x] 라운드별 금액 입출 기록 (승리자/금액 입력, 패배자 자동 계산)
- [x] 라운드별 참가자 제외 기능
- [x] 게임 정산 화면 (세로 아코디언 UI)
- [x] 게임 정산 결과 화면
- [x] 정산 완료 후 라운드 입력/삭제 비활성화

### Phase 12: 정산 멤버 관리 (완료)

- [x] 정산 멤버 테이블 (OWNER/MEMBER 역할)
- [x] 초대 코드 생성/검증 API (8자 코드, 24시간 유효)
- [x] 멤버 목록 조회

### Phase 13: 화면 간소화 및 보안 (완료)

- [x] TravelSettlementScreen 간소화 (949줄 -> 592줄)
- [x] ParticipantManagementScreen 분리
- [x] ExpenseListScreen 분리
- [x] 수정/삭제/완료 버튼 디자인 통일
- [x] 하드코딩된 시크릿 제거 (Google Client ID, DB 비밀번호)
- [x] 환경변수 기반 설정 전환 (spring-dotenv, .env)
- [x] DB/Redis/OAuth/JWT 환경변수화

---

## 다음 작업 우선순위

### P0 - 배포 전 필수

- [ ] **초대 코드 입력 화면 구현** (1일)
  - JoinSettlementScreen 신규 생성
  - AppNavigator에 라우트 추가
  - joinByInviteCode API 연동 (API는 이미 있음)

- [x] **더블 탭 중복 제출 방지** (0.5일)
  - AnimatedButton에 onPress 실행 중 disabled 처리
  - TravelSettlement/GameSettlement 삭제·완료 버튼에 actionInProgress 가드 추가

- [ ] **지출 입력 시 참가자 0명 사전 차단** (0.5일)
  - AddExpenseModal 열기 전 참가자 존재 여부 검증

- [ ] **금액 검증 강화** (0.5일)
  - 0원/음수 지출 차단 (모바일 + 백엔드)

### P1 - 배포 품질

- [ ] **게임 정산 결과 공유 기능** (0.5일)
  - GameSettlementResultScreen에 Share 구현 (버튼만 있고 미구현)

- [ ] **게임 라운드 수정 기능** (1일)
  - 저장된 라운드 재편집 UI 추가 (현재 삭제 후 재입력만 가능)

- [ ] **정산 목록에 금액 미리보기** (1일)
  - 백엔드: 정산 요약 API 추가
  - HomeScreen 카드에 총 지출/내 잔액 표시

- [ ] **정산 검색 UI** (0.5일)
  - HomeScreen에 검색바 추가 (백엔드 API는 이미 있음)

### P2 - 배포 후 개선

- [ ] 엣지 케이스 처리 (전체 참가자 비활성화, 라운드 전원 제외 방어 로직)
- [ ] 모달 뒤로가기 확인 (입력 중 데이터 손실 방지)
- [ ] 온보딩 튜토리얼
- [ ] 오프라인 동기화
- [ ] AI 카테고리 연동 (ML 서비스)
- [ ] 다크 모드

### P3 - 장기 로드맵

- [ ] 영수증 사진 첨부 / OCR 인식
- [ ] 통계 및 리포트 (월별/카테고리별 차트)
- [ ] 알림 기능 (정산 완료, 미정산 리마인더)

---

## 배포 준비

- [x] 백엔드 Dockerfile 작성
- [x] 모바일 EAS Build 설정 (eas.json)
- [x] CI/CD 파이프라인 (GitHub Actions)
- [x] 운영 환경 설정 (application-prod 프로필)
- [x] main 브랜치 병합

---

## 최근 작업 기록

### 2026-02-12
- 여행 정산 상세 화면 간소화 및 참가자/지출 화면 분리
- 수정/삭제/완료 버튼 디자인 통일
- 하드코딩된 시크릿 제거 및 환경변수 전환
- spring-dotenv 도입, .env 기반 환경변수 관리

### 2026-02-11
- 정산 멤버 관리 및 초대 코드 기능 추가
- 완료 상태 수정 차단, 정산 결과 저장/조회 API
- 카카오 OIDC 전환
- 모바일 UI 개선 (정산 결과, 지출 분할, 게임 유틸)
- 테스트 코드 업데이트

### 2025-12-18
- 게임 정산 백엔드 API 구현 및 모바일 연동
- 게임 정산 UI를 세로 아코디언으로 변경
- 게임 정산 완료 상태에서 라운드 비활성화

### 2025-12-17
- UI/UX 개선 (디자인 시스템, 로딩, 토스트, 애니메이션)
- 히스토리 및 검색 기능
- 지출 분담 설정

### 이전
- Google/Kakao 소셜 로그인 구현
- JWT 인증 시스템
- 정산 결과 계산 (그리디 알고리즘)
- 참가자/지출 CRUD 전체 구현
