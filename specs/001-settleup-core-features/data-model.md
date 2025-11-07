# 데이터 모델: SettleUp

**Date**: 2025-11-07
**Purpose**: 엔티티, 관계, 검증 규칙 정의

## 개요

SettleUp의 데이터 모델은 여행 정산과 게임 정산 두 가지 주요 도메인을 지원합니다.
오프라인 우선 아키텍처를 위해 모바일과 서버 모두 동일한 데이터 구조를 유지하며,
동기화를 위한 메타데이터를 포함합니다.

## 핵심 엔티티

### 1. User (사용자)

**목적**: 앱 사용자 정보

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 사용자 고유 ID |
| name | String | NOT NULL, 2-50자 | 사용자 이름 |
| email | String | UNIQUE, 이메일 형식 | 이메일 (선택사항) |
| createdAt | Timestamp | NOT NULL | 생성 시각 |
| updatedAt | Timestamp | NOT NULL | 수정 시각 |

**검증 규칙**:
- name: 2-50자, 공백만으로 구성 불가
- email: RFC 5322 이메일 형식 (선택사항)

**관계**:
- `settlements`: 1:N → Settlement (생성한 정산)
- `participations`: 1:N → Participant (참여한 정산)

---

### 2. Settlement (정산)

**목적**: 여행 정산 또는 게임 정산 세션

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 정산 고유 ID |
| title | String | NOT NULL, 1-100자 | 정산 제목 |
| type | Enum | NOT NULL | TRAVEL 또는 GAME |
| status | Enum | NOT NULL | ACTIVE, COMPLETED, ARCHIVED |
| creatorId | UUID | FK → User, NOT NULL | 생성자 ID |
| description | String | 0-500자 | 설명 (선택사항) |
| startDate | Date | NULL | 시작 날짜 (여행용) |
| endDate | Date | NULL | 종료 날짜 (여행용) |
| currency | String | NOT NULL, 기본 'KRW' | 통화 코드 (ISO 4217) |
| createdAt | Timestamp | NOT NULL | 생성 시각 |
| updatedAt | Timestamp | NOT NULL | 수정 시각 |
| version | Integer | NOT NULL, 기본 0 | 동기화용 버전 |
| syncStatus | Enum | NOT NULL | PENDING, SYNCED, CONFLICT |

**검증 규칙**:
- title: 1-100자, 공백만 불가
- type: TRAVEL 또는 GAME
- status: ACTIVE, COMPLETED, ARCHIVED
- endDate >= startDate (여행인 경우)
- currency: ISO 4217 코드 (KRW, USD, JPY 등)

**관계**:
- `creator`: N:1 → User
- `participants`: 1:N → Participant
- `expenses`: 1:N → Expense (type=TRAVEL인 경우)
- `gameRounds`: 1:N → GameRound (type=GAME인 경우)
- `transactions`: 1:N → Transaction (최종 정산 결과)

**인덱스**:
- (creatorId, createdAt DESC)
- (type, status)

---

### 3. Participant (참가자)

**목적**: 정산에 참여하는 사람

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 참가자 고유 ID |
| settlementId | UUID | FK → Settlement, NOT NULL | 정산 ID |
| userId | UUID | FK → User, NULL | 사용자 ID (등록 사용자) |
| name | String | NOT NULL, 1-50자 | 참가자 이름 |
| isActive | Boolean | NOT NULL, 기본 true | 활성 상태 |
| joinedAt | Timestamp | NOT NULL | 참가 시각 |

**검증 규칙**:
- name: 1-50자
- settlementId + name: UNIQUE (한 정산 내 이름 중복 불가)
- userId는 NULL 가능 (비회원 참가자)

**관계**:
- `settlement`: N:1 → Settlement
- `user`: N:1 → User (NULL 가능)
- `expensesPaid`: 1:N → Expense (지불한 비용)
- `gameResults`: 1:N → GameResult (게임 결과)

**인덱스**:
- (settlementId, name)
- (userId)

---

### 4. Expense (지출) - 여행 정산용

**목적**: 여행 중 발생한 비용 기록

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 지출 고유 ID |
| settlementId | UUID | FK → Settlement, NOT NULL | 정산 ID |
| payerId | UUID | FK → Participant, NOT NULL | 지불자 ID |
| amount | Decimal(12,2) | NOT NULL, > 0 | 금액 |
| category | String | NULL | 카테고리 |
| categoryAI | String | NULL | AI 추천 카테고리 |
| description | String | NOT NULL, 1-200자 | 설명 |
| expenseDate | Timestamp | NOT NULL | 지출 일시 |
| createdAt | Timestamp | NOT NULL | 생성 시각 |
| updatedAt | Timestamp | NOT NULL | 수정 시각 |
| version | Integer | NOT NULL, 기본 0 | 동기화용 버전 |

**검증 규칙**:
- amount: > 0, 최대 12자리 (소수점 2자리)
- description: 1-200자
- category: 교통, 식사, 숙박, 쇼핑, 엔터테인먼트, 기타 (선택사항)

**관계**:
- `settlement`: N:1 → Settlement
- `payer`: N:1 → Participant
- `splits`: 1:N → ExpenseSplit (비용 분할)

**인덱스**:
- (settlementId, expenseDate DESC)
- (payerId)

---

### 5. ExpenseSplit (비용 분할)

**목적**: 지출을 참가자 간 분할

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 분할 고유 ID |
| expenseId | UUID | FK → Expense, NOT NULL | 지출 ID |
| participantId | UUID | FK → Participant, NOT NULL | 참가자 ID |
| share | Decimal(12,2) | NOT NULL, >= 0 | 부담 금액 |

**검증 규칙**:
- share: >= 0
- SUM(share for expenseId) = Expense.amount (비용 총합 일치)

**관계**:
- `expense`: N:1 → Expense
- `participant`: N:1 → Participant

**인덱스**:
- (expenseId)
- (participantId)

---

### 6. GameRound (게임 라운드) - 게임 정산용

**목적**: 게임의 각 라운드/세션

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 라운드 고유 ID |
| settlementId | UUID | FK → Settlement, NOT NULL | 정산 ID |
| roundNumber | Integer | NOT NULL, > 0 | 라운드 번호 |
| name | String | NULL, 1-100자 | 라운드 이름 (선택사항) |
| baseAmount | Decimal(12,2) | NULL, > 0 | 기본 금액 (판돈) |
| multiplier | Decimal(5,2) | NOT NULL, 기본 1.0 | 배수 |
| playedAt | Timestamp | NOT NULL | 게임 시각 |
| createdAt | Timestamp | NOT NULL | 생성 시각 |

**검증 규칙**:
- roundNumber: > 0, settlementId 내 중복 불가
- baseAmount: > 0 또는 NULL
- multiplier: >= 0

**관계**:
- `settlement`: N:1 → Settlement
- `results`: 1:N → GameResult

**인덱스**:
- (settlementId, roundNumber)

**유니크 제약**:
- (settlementId, roundNumber): UNIQUE

---

### 7. GameResult (게임 결과)

**목적**: 각 라운드에서 참가자별 결과

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 결과 고유 ID |
| roundId | UUID | FK → GameRound, NOT NULL | 라운드 ID |
| participantId | UUID | FK → Participant, NOT NULL | 참가자 ID |
| outcome | Enum | NOT NULL | WIN, LOSE, DRAW |
| amount | Decimal(12,2) | NOT NULL | 획득/손실 금액 |
| note | String | NULL, 0-200자 | 메모 (선택사항) |

**검증 규칙**:
- outcome: WIN, LOSE, DRAW
- amount: WIN이면 > 0, LOSE면 < 0, DRAW면 0
- (roundId, participantId): UNIQUE (한 라운드당 1 결과)

**관계**:
- `round`: N:1 → GameRound
- `participant`: N:1 → Participant

**인덱스**:
- (roundId)
- (participantId)

**유니크 제약**:
- (roundId, participantId): UNIQUE

---

### 8. Transaction (최종 정산 거래)

**목적**: 정산 완료 시 실제 송금해야 할 거래

**속성**:
| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK, NOT NULL | 거래 고유 ID |
| settlementId | UUID | FK → Settlement, NOT NULL | 정산 ID |
| fromParticipantId | UUID | FK → Participant, NOT NULL | 지불자 ID |
| toParticipantId | UUID | FK → Participant, NOT NULL | 수령자 ID |
| amount | Decimal(12,2) | NOT NULL, > 0 | 거래 금액 |
| status | Enum | NOT NULL | PENDING, COMPLETED, CANCELLED |
| completedAt | Timestamp | NULL | 완료 시각 |
| createdAt | Timestamp | NOT NULL | 생성 시각 |

**검증 규칙**:
- amount: > 0
- fromParticipantId != toParticipantId
- status: PENDING, COMPLETED, CANCELLED

**관계**:
- `settlement`: N:1 → Settlement
- `fromParticipant`: N:1 → Participant
- `toParticipant`: N:1 → Participant

**인덱스**:
- (settlementId, status)
- (fromParticipantId)
- (toParticipantId)

---

## 엔티티 관계도 (ERD)

```
User (사용자)
├─ 1:N → Settlement (생성한 정산)
└─ 1:N → Participant (참여한 정산)

Settlement (정산)
├─ N:1 → User (creator)
├─ 1:N → Participant
├─ 1:N → Expense (type=TRAVEL인 경우)
├─ 1:N → GameRound (type=GAME인 경우)
└─ 1:N → Transaction

Participant (참가자)
├─ N:1 → Settlement
├─ N:1 → User (NULL 가능)
├─ 1:N → Expense (payerId)
├─ 1:N → ExpenseSplit
└─ 1:N → GameResult

Expense (지출)
├─ N:1 → Settlement
├─ N:1 → Participant (payer)
└─ 1:N → ExpenseSplit

ExpenseSplit (비용 분할)
├─ N:1 → Expense
└─ N:1 → Participant

GameRound (게임 라운드)
├─ N:1 → Settlement
└─ 1:N → GameResult

GameResult (게임 결과)
├─ N:1 → GameRound
└─ N:1 → Participant

Transaction (최종 정산)
├─ N:1 → Settlement
├─ N:1 → Participant (from)
└─ N:1 → Participant (to)
```

---

## 동기화 전략

### 동기화 메타데이터
모든 주요 엔티티에 포함:
- `version`: 낙관적 잠금용 버전
- `updatedAt`: 최종 수정 시각
- `syncStatus`: PENDING, SYNCED, CONFLICT

### 충돌 해결
1. **자동 해결 (LWW)**: `updatedAt` 기준 최신 데이터 우선
2. **사용자 해결**: `version` 불일치 시 사용자 선택

### 동기화 순서
```
1. User
2. Settlement
3. Participant
4. Expense / GameRound (병렬)
5. ExpenseSplit / GameResult (병렬)
6. Transaction
```

---

## 데이터 제약 조건 요약

### 무결성 제약
1. Settlement의 type에 따라 Expense 또는 GameRound만 존재
2. ExpenseSplit의 합 = Expense.amount
3. GameResult의 (roundId, participantId) 유일성
4. Transaction의 fromParticipant != toParticipant
5. Settlement의 endDate >= startDate

### 성능 제약
1. Settlement당 최대 50 Participants
2. Expense당 최대 50 ExpenseSplits
3. GameRound당 최대 50 GameResults

---

## 샘플 데이터 시나리오

### 여행 정산 예시
```json
{
  "settlement": {
    "id": "s1",
    "title": "제주도 여행",
    "type": "TRAVEL",
    "status": "ACTIVE",
    "startDate": "2025-11-10",
    "endDate": "2025-11-12"
  },
  "participants": [
    {"id": "p1", "name": "철수"},
    {"id": "p2", "name": "영희"},
    {"id": "p3", "name": "민수"}
  ],
  "expenses": [
    {
      "id": "e1",
      "payerId": "p1",
      "amount": 150000,
      "description": "렌터카",
      "category": "교통",
      "splits": [
        {"participantId": "p1", "share": 50000},
        {"participantId": "p2", "share": 50000},
        {"participantId": "p3", "share": 50000}
      ]
    },
    {
      "id": "e2",
      "payerId": "p2",
      "amount": 90000,
      "description": "저녁 식사",
      "category": "식사",
      "splits": [
        {"participantId": "p1", "share": 30000},
        {"participantId": "p2", "share": 30000},
        {"participantId": "p3", "share": 30000}
      ]
    }
  ]
}
```

**정산 결과**:
- 철수: 지불 150,000 - 부담 80,000 = +70,000 (받을 금액)
- 영희: 지불 90,000 - 부담 80,000 = +10,000 (받을 금액)
- 민수: 지불 0 - 부담 80,000 = -80,000 (줄 금액)

**Transactions**:
```json
[
  {"from": "p3", "to": "p1", "amount": 70000},
  {"from": "p3", "to": "p2", "amount": 10000}
]
```

### 게임 정산 예시
```json
{
  "settlement": {
    "id": "s2",
    "title": "고스톱 게임",
    "type": "GAME",
    "status": "COMPLETED"
  },
  "participants": [
    {"id": "p1", "name": "철수"},
    {"id": "p2", "name": "영희"},
    {"id": "p3", "name": "민수"}
  ],
  "gameRounds": [
    {
      "id": "r1",
      "roundNumber": 1,
      "baseAmount": 10000,
      "multiplier": 2.0,
      "results": [
        {"participantId": "p1", "outcome": "WIN", "amount": 40000},
        {"participantId": "p2", "outcome": "LOSE", "amount": -20000},
        {"participantId": "p3", "outcome": "LOSE", "amount": -20000}
      ]
    },
    {
      "id": "r2",
      "roundNumber": 2,
      "baseAmount": 10000,
      "multiplier": 1.0,
      "results": [
        {"participantId": "p1", "outcome": "LOSE", "amount": -10000},
        {"participantId": "p2", "outcome": "WIN", "amount": 20000},
        {"participantId": "p3", "outcome": "LOSE", "amount": -10000}
      ]
    }
  ]
}
```

**정산 결과**:
- 철수: +40,000 - 10,000 = +30,000 (받을 금액)
- 영희: -20,000 + 20,000 = 0 (없음)
- 민수: -20,000 - 10,000 = -30,000 (줄 금액)

**Transactions**:
```json
[
  {"from": "p3", "to": "p1", "amount": 30000}
]
```

---

## 다음 단계

- ✅ 데이터 모델 정의 완료
- ⏭ API 계약 작성 (`contracts/`)
- ⏭ 퀵스타트 가이드 작성 (`quickstart.md`)
