# SettleUp 퀵스타트 가이드

**Version**: 1.0.0
**Date**: 2025-11-07
**Purpose**: MLOps 실습을 위한 단계별 개발 환경 구축

## 개요

이 가이드는 SettleUp 프로젝트를 실습 형식으로 구축하는 방법을 안내합니다.
각 Phase별로 나누어 점진적으로 기능을 추가하며, MLOps 파이프라인을 학습합니다.

## 사전 요구사항

### 필수 도구
- **Node.js**: 18.x 이상
- **Java**: JDK 17 이상
- **Python**: 3.10 이상
- **Docker**: 20.x 이상
- **Docker Compose**: 2.x 이상
- **Git**: 2.x 이상

### 선택 도구
- **Expo CLI**: React Native 개발 (npm install -g expo-cli)
- **Postman/Insomnia**: API 테스트
- **PostgreSQL Client**: 데이터베이스 관리 (DBeaver, pgAdmin)

---

## Phase 1: 기본 인프라 구축 (Docker 환경)

### 목표
- PostgreSQL 및 Redis 컨테이너 실행
- 데이터베이스 스키마 생성
- 기본 연결 테스트

### 1.1 프로젝트 디렉토리 생성

```bash
# 프로젝트 루트 생성
mkdir settleup
cd settleup

# 디렉토리 구조 생성
mkdir -p infrastructure/docker
mkdir -p backend/src/main/java/com/settleup
mkdir -p mobile/src
mkdir -p ml-service/src
```

### 1.2 Docker Compose 설정

**파일**: `infrastructure/docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: settleup-postgres
    environment:
      POSTGRES_DB: settleup
      POSTGRES_USER: settleup
      POSTGRES_PASSWORD: settleup123
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U settleup"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: settleup-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres-data:
  redis-data:
```

### 1.3 데이터베이스 초기화 스크립트

**파일**: `infrastructure/docker/init-db.sql`

```sql
-- Users 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL CHECK (LENGTH(TRIM(name)) >= 2),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Settlements 테이블
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL CHECK (LENGTH(TRIM(title)) >= 1),
    type VARCHAR(20) NOT NULL CHECK (type IN ('TRAVEL', 'GAME')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    creator_id UUID NOT NULL REFERENCES users(id),
    description VARCHAR(500),
    start_date DATE,
    end_date DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 0,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Participants 테이블
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    name VARCHAR(50) NOT NULL CHECK (LENGTH(TRIM(name)) >= 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(settlement_id, name)
);

-- Expenses 테이블 (여행 정산)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES participants(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50),
    category_ai VARCHAR(50),
    description VARCHAR(200) NOT NULL CHECK (LENGTH(TRIM(description)) >= 1),
    expense_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 0
);

-- Expense Splits 테이블
CREATE TABLE expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id),
    share DECIMAL(12,2) NOT NULL CHECK (share >= 0)
);

-- Game Rounds 테이블 (게임 정산)
CREATE TABLE game_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number > 0),
    name VARCHAR(100),
    base_amount DECIMAL(12,2) CHECK (base_amount IS NULL OR base_amount > 0),
    multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (multiplier >= 0),
    played_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(settlement_id, round_number)
);

-- Game Results 테이블
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id),
    outcome VARCHAR(10) NOT NULL CHECK (outcome IN ('WIN', 'LOSE', 'DRAW')),
    amount DECIMAL(12,2) NOT NULL,
    note VARCHAR(200),
    UNIQUE(round_id, participant_id)
);

-- Transactions 테이블 (최종 정산)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    from_participant_id UUID NOT NULL REFERENCES participants(id),
    to_participant_id UUID NOT NULL REFERENCES participants(id),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (from_participant_id != to_participant_id)
);

-- 인덱스 생성
CREATE INDEX idx_settlements_creator ON settlements(creator_id, created_at DESC);
CREATE INDEX idx_settlements_type_status ON settlements(type, status);
CREATE INDEX idx_participants_settlement ON participants(settlement_id, name);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_expenses_settlement_date ON expenses(settlement_id, expense_date DESC);
CREATE INDEX idx_expenses_payer ON expenses(payer_id);
CREATE INDEX idx_expense_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_expense_splits_participant ON expense_splits(participant_id);
CREATE INDEX idx_game_rounds_settlement ON game_rounds(settlement_id, round_number);
CREATE INDEX idx_game_results_round ON game_results(round_id);
CREATE INDEX idx_game_results_participant ON game_results(participant_id);
CREATE INDEX idx_transactions_settlement ON transactions(settlement_id, status);
```

### 1.4 인프라 시작

```bash
cd infrastructure/docker
docker-compose up -d

# 헬스 체크
docker-compose ps
docker-compose logs postgres
docker-compose logs redis

# DB 연결 테스트
psql -h localhost -U settleup -d settleup
# 비밀번호: settleup123

# 테이블 확인
\dt
\q
```

---

## Phase 2: Spring Boot 백엔드 구축

### 목표
- Spring Boot 프로젝트 초기화
- JPA 엔티티 및 Repository 구현
- REST API 엔드포인트 구현
- 정산 계산 로직 구현

### 2.1 Spring Boot 프로젝트 생성

**방법 1: Spring Initializr 사용**
1. https://start.spring.io 접속
2. 설정:
   - Project: Gradle - Groovy
   - Language: Java
   - Spring Boot: 3.2.x
   - Java: 17
   - Dependencies: Spring Web, Spring Data JPA, PostgreSQL Driver, Spring Data Redis, Lombok, Validation

**방법 2: CLI**
```bash
cd backend
./gradlew init
```

### 2.2 application.yml 설정

**파일**: `backend/src/main/resources/application.yml`

```yaml
spring:
  application:
    name: settleup-backend

  datasource:
    url: jdbc:postgresql://localhost:5432/settleup
    username: settleup
    password: settleup123
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: validate  # 스키마는 init-db.sql로 관리
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  data:
    redis:
      host: localhost
      port: 6379
      timeout: 2000ms

server:
  port: 8080

logging:
  level:
    com.settleup: DEBUG
    org.hibernate.SQL: DEBUG
```

### 2.3 핵심 엔티티 예시

**파일**: `backend/src/main/java/com/settleup/domain/settlement/Settlement.java`

```java
package com.settleup.domain.settlement;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "settlements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementStatus status;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(length = 500)
    private String description;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false, length = 3)
    private String currency = "KRW";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    private Integer version = 0;

    @Column(name = "sync_status", nullable = false, length = 20)
    private String syncStatus = "SYNCED";

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = SettlementStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

enum SettlementType {
    TRAVEL, GAME
}

enum SettlementStatus {
    ACTIVE, COMPLETED, ARCHIVED
}
```

### 2.4 백엔드 실행

```bash
cd backend
./gradlew bootRun

# 또는 IDE에서 실행
# SettleUpApplication.java → Run
```

### 2.5 API 테스트

```bash
# Settlement 생성
curl -X POST http://localhost:8080/api/v1/settlements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "제주도 여행",
    "type": "TRAVEL",
    "startDate": "2025-11-10",
    "endDate": "2025-11-12"
  }'
```

---

## Phase 3: React Native 모바일 앱 구축

### 목표
- Expo React Native 프로젝트 초기화
- 기본 네비게이션 설정
- API 통합
- 오프라인 저장소 구현

### 3.1 Expo 프로젝트 생성

```bash
cd mobile
npx create-expo-app . --template blank-typescript

# 의존성 설치
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install expo-sqlite expo-sharing axios
npm install @react-native-async-storage/async-storage
npm install react-native-screens react-native-safe-area-context
```

### 3.2 프로젝트 구조

```
mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── TravelSettlementScreen.tsx
│   │   └── GameSettlementScreen.tsx
│   ├── components/
│   ├── services/
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── storage/
│   │       └── database.ts
│   ├── models/
│   └── navigation/
│       └── AppNavigator.tsx
├── App.tsx
└── package.json
```

### 3.3 API 클라이언트 설정

**파일**: `mobile/src/services/api/client.ts`

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const settlementsAPI = {
  getAll: () => apiClient.get('/settlements'),
  create: (data: any) => apiClient.post('/settlements', data),
  getById: (id: string) => apiClient.get(`/settlements/${id}`),
};
```

### 3.4 모바일 앱 실행

```bash
cd mobile
npm start

# iOS 시뮬레이터
i

# Android 에뮬레이터
a

# 실제 디바이스 (Expo Go 앱 필요)
# QR 코드 스캔
```

---

## Phase 4: ML 서비스 구축 (AI 카테고리 분류)

### 목표
- FastText 기반 카테고리 분류 모델 구축
- FastAPI 서버 구현
- Docker 컨테이너화

### 4.1 ML 서비스 디렉토리 생성

```bash
cd ml-service

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install fastapi uvicorn fasttext scikit-learn numpy
```

### 4.2 간단한 FastAPI 서버

**파일**: `ml-service/src/api/main.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import fasttext
import os

app = FastAPI(title="SettleUp ML Service")

# 모델 로드 (Phase 1: Mock)
class CategoryRequest(BaseModel):
    description: str

class CategoryResponse(BaseModel):
    category: str
    confidence: float
    alternatives: list

@app.post("/categorize", response_model=CategoryResponse)
async def categorize_expense(request: CategoryRequest):
    """지출 설명을 기반으로 카테고리 추천"""

    # Mock 구현 (Phase 1)
    # TODO: 실제 FastText 모델로 교체
    categories = {
        "택시": "교통",
        "버스": "교통",
        "식당": "식사",
        "카페": "식사",
        "호텔": "숙박",
        "편의점": "쇼핑",
    }

    description = request.description.lower()
    category = "기타"
    confidence = 0.5

    for keyword, cat in categories.items():
        if keyword in description:
            category = cat
            confidence = 0.9
            break

    return CategoryResponse(
        category=category,
        confidence=confidence,
        alternatives=[
            {"category": "교통", "confidence": 0.2},
            {"category": "식사", "confidence": 0.1},
        ]
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 4.3 ML 서비스 실행

```bash
cd ml-service
source venv/bin/activate
uvicorn src.api.main:app --reload --port 8000

# 테스트
curl -X POST http://localhost:8000/categorize \
  -H "Content-Type: application/json" \
  -d '{"description": "택시 요금"}'
```

---

## Phase 5: Docker Compose로 전체 통합

### 목표
- 모든 서비스를 Docker Compose로 통합
- 서비스 간 통신 설정
- 단일 명령으로 전체 환경 실행

### 5.1 통합 Docker Compose

**파일**: `docker-compose.yml` (루트)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    # ... (Phase 1과 동일)

  redis:
    image: redis:7-alpine
    # ... (Phase 1과 동일)

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/settleup
      SPRING_REDIS_HOST: redis

  ml-service:
    build:
      context: ./ml-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./ml-service/models:/app/models

  # Phase 3: Nginx (선택사항)
  # nginx:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #   volumes:
  #     - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
```

### 5.2 전체 시스템 실행

```bash
# 루트 디렉토리에서
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
docker-compose logs -f ml-service

# 중지
docker-compose down
```

---

## 다음 단계: MLOps 파이프라인 구축

Phase 1-5 완료 후 다음을 실습합니다:
1. **CI/CD**: GitHub Actions로 자동 빌드/테스트/배포
2. **모니터링**: Prometheus + Grafana
3. **모델 버저닝**: ML 모델 업그레이드 및 A/B 테스트
4. **Kubernetes**: K8s로 배포 (고급)

각 단계는 별도의 실습 가이드로 제공됩니다.

---

## 트러블슈팅

### PostgreSQL 연결 실패
```bash
# Docker 네트워크 확인
docker network ls
docker network inspect settleup_default

# 연결 테스트
docker exec -it settleup-postgres psql -U settleup -d settleup
```

### Backend 빌드 실패
```bash
# Gradle 캐시 삭제
cd backend
./gradlew clean build --refresh-dependencies
```

### Mobile 앱 실행 오류
```bash
# 캐시 삭제
cd mobile
npm start -- --clear
```

---

## 참고 자료

- [Spring Boot Docs](https://spring.io/projects/spring-boot)
- [React Native Docs](https://reactnative.dev/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
