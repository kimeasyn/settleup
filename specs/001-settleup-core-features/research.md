# 기술 조사: SettleUp 핵심 기능

**Date**: 2025-11-07
**Purpose**: Technical Context 검증 및 기술 스택 결정

## 1. AI 모델 선택: 비용 카테고리 분류

### 요구사항
- CPU 환경에서 실행 가능 (GPU 최소 사용)
- 경량 모델 (< 100MB)
- 추론 시간 < 100ms
- 다국어 지원 (한국어, 영어)
- 비용 설명 텍스트 → 카테고리 분류

### 검토한 옵션

#### Option 1: DistilBERT (Hugging Face)
**장점**:
- BERT의 97% 성능, 40% 크기 감소
- 한국어 사전학습 모델 available (distilbert-base-multilingual-cased)
- ONNX로 변환 가능 (CPU 최적화)
- 모델 크기: ~250MB (양자화 시 ~60MB)

**단점**:
- 여전히 상대적으로 큼
- 추론 시간: CPU에서 50-100ms

**추론 시간 (CPU)**: 50-100ms
**메모리**: 250MB → 60MB (INT8 양자화)

#### Option 2: MobileBERT (TensorFlow Lite)
**장점**:
- 모바일 최적화 설계
- TFLite 변환 지원
- 모델 크기: ~100MB (양자화 시 ~25MB)
- 추론 시간: CPU에서 20-40ms

**단점**:
- 한국어 사전학습 모델 제한적
- Fine-tuning 필요

**추론 시간 (CPU)**: 20-40ms
**메모리**: 100MB → 25MB (INT8 양자화)

#### Option 3: FastText + Logistic Regression (추천)
**장점**:
- 매우 가벼움 (< 10MB)
- 추론 시간: < 5ms
- CPU에서 매우 빠름
- 한국어 임베딩 지원
- Fine-tuning 쉬움

**단점**:
- Transformer 모델보다 정확도 낮음 (약 80-85%)
- 문맥 이해 제한적

**추론 시간 (CPU)**: < 5ms
**메모리**: < 10MB

#### Option 4: DistilKoBERT (한국어 특화)
**장점**:
- 한국어 최적화
- DistilBERT 기반 (경량)
- 좋은 한국어 성능
- ONNX 변환 가능

**단점**:
- 모델 크기: ~250MB
- 영어 성능 저하 가능

**추론 시간 (CPU)**: 60-120ms
**메모리**: ~250MB

### 결정: FastText + Logistic Regression (Phase 1), MobileBERT (Phase 2)

**근거**:
1. **Phase 1 (MVP)**: FastText + Logistic Regression
   - 실습 목적상 빠른 구축 우선
   - CPU 환경에서 매우 빠름
   - 충분한 정확도 (80-85%)
   - MLOps 파이프라인 구축 학습에 집중

2. **Phase 2 (개선)**: MobileBERT로 업그레이드
   - 모델 교체를 통한 MLOps 실습
   - 정확도 향상 (90-95%)
   - 모델 버저닝 및 A/B 테스트 실습

**구현 계획**:
```
ml-service/
├── models/
│   ├── fasttext/
│   │   ├── category_classifier.bin  # FastText 임베딩
│   │   └── logistic_model.pkl       # sklearn 모델
│   └── mobilebert/                  # Phase 2
│       └── category_classifier.tflite
├── src/
│   ├── api/
│   │   └── main.py                  # FastAPI 서버
│   ├── inference/
│   │   ├── fasttext_classifier.py   # Phase 1
│   │   └── bert_classifier.py       # Phase 2
│   └── preprocessing/
│       └── text_processor.py
```

**카테고리**: 교통, 식사, 숙박, 쇼핑, 엔터테인먼트, 기타

---

## 2. React Native 설정: Expo vs Bare

### 요구사항
- 오프라인 데이터 저장 (SQLite)
- 텍스트 공유 기능
- 크로스 플랫폼 (iOS, Android)

### 검토한 옵션

#### Option 1: Expo (Managed Workflow)
**장점**:
- 빠른 시작
- OTA 업데이트
- 개발 도구 우수

**단점**:
- 네이티브 모듈 제한
- SQLite는 expo-sqlite 사용 (제한적)

#### Option 2: React Native CLI (Bare)
**장점**:
- 완전한 네이티브 접근
- 모든 라이브러리 사용 가능
- 프로덕션 최적화 우수

**단점**:
- 초기 설정 복잡
- 네이티브 빌드 필요

### 결정: Expo (Managed Workflow)

**근거**:
- 실습 목적상 빠른 시작 중요
- expo-sqlite로 오프라인 기능 충분
- React Native Share로 공유 기능 지원
- OTA 업데이트로 MLOps 배포 실습 가능

**필요 라이브러리**:
```json
{
  "expo": "~50.0.0",
  "expo-sqlite": "~13.0.0",
  "expo-sharing": "~12.0.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "@react-navigation/stack": "^6.3.0",
  "axios": "^1.6.0",
  "react-native-async-storage": "^1.21.0"
}
```

---

## 3. Spring Boot 아키텍처 패턴

### 요구사항
- RESTful API
- PostgreSQL 연동
- Redis 캐싱
- JWT 인증 (선택사항)

### 검토한 옵션

#### Option 1: Layered Architecture (추천)
```
Controller → Service → Repository → Entity
```
**장점**:
- 간단하고 명확
- Spring Boot 표준 패턴
- 실습에 적합

**단점**:
- 대규모에서 복잡도 증가

#### Option 2: Hexagonal Architecture
**장점**:
- 높은 테스트 가능성
- 도메인 중심 설계

**단점**:
- 실습 프로젝트에 과도한 복잡도

### 결정: Layered Architecture

**근거**:
- 실습 목적상 표준 패턴이 학습에 적합
- Spring Boot 모범 사례
- 충분한 확장성

**패키지 구조**:
```
com.settleup.backend
├── domain/
│   ├── settlement/
│   │   ├── Settlement.java         # Entity
│   │   ├── SettlementRepository.java
│   │   ├── SettlementService.java
│   │   └── SettlementController.java
│   ├── game/
│   └── participant/
├── dto/
├── config/
│   ├── RedisConfig.java
│   ├── JpaConfig.java
│   └── SecurityConfig.java
└── exception/
```

---

## 4. 데이터 동기화 전략

### 요구사항
- 오프라인 우선
- 충돌 해결
- 데이터 일관성

### 검토한 옵션

#### Option 1: Last-Write-Wins (LWW)
**장점**:
- 구현 간단
- 충돌 자동 해결

**단점**:
- 데이터 손실 가능

#### Option 2: Operational Transformation (OT)
**장점**:
- 충돌 없는 병합

**단점**:
- 매우 복잡

#### Option 3: Conflict Detection + User Resolution (추천)
**장점**:
- 사용자 제어
- 데이터 손실 방지

**단점**:
- UI 복잡도 증가

### 결정: Hybrid (LWW + Conflict Detection)

**근거**:
- 대부분: Last-Write-Wins (타임스탬프 기반)
- 중요 필드: Conflict Detection (사용자 선택)

**구현**:
```typescript
// Mobile
interface SyncableEntity {
  id: string;
  updatedAt: number;
  version: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

// Sync 로직
async function syncEntity(localEntity, remoteEntity) {
  if (localEntity.version === remoteEntity.version) {
    // 동일 버전 - LWW
    return localEntity.updatedAt > remoteEntity.updatedAt
      ? localEntity
      : remoteEntity;
  } else {
    // 버전 충돌 - 사용자 선택
    return await showConflictDialog(localEntity, remoteEntity);
  }
}
```

---

## 5. Docker 구성: 단계별 실습

### 요구사항
- MLOps 실습 목적
- 단계별 학습
- 로컬 개발 편의

### Phase 1: Docker Compose (Basic)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: settleup
      POSTGRES_USER: settleup
      POSTGRES_PASSWORD: settleup123
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/settleup
      SPRING_REDIS_HOST: redis
```

### Phase 2: ML Service 추가
```yaml
  ml-service:
    build: ./ml-service
    ports:
      - "8000:8000"
    volumes:
      - ./ml-service/models:/app/models
```

### Phase 3: Nginx + Monitoring (고급)
```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - backend
      - ml-service

  prometheus:
    image: prom/prometheus
    # 모니터링 설정
```

---

## 6. 정산 알고리즘

### 요구사항
- 최소 거래 횟수로 정산
- 정확한 금액 계산
- 성능: O(n²) 이하

### 알고리즘: Greedy with Priority Queue

**원리**:
1. 각 참가자의 순 잔액 계산 (지불 - 부담)
2. 채무자(음수)와 채권자(양수) 그룹 분리
3. 최대 채무자와 최대 채권자를 매칭
4. 잔액 0이 될 때까지 반복

**시간 복잡도**: O(n log n)
**공간 복잡도**: O(n)

**Java 구현 (pseudo-code)**:
```java
public List<Transaction> calculateSettlement(List<Participant> participants) {
    // 1. 순 잔액 계산
    Map<String, BigDecimal> balances = calculateBalances(participants);

    // 2. 우선순위 큐 (채무자, 채권자)
    PriorityQueue<Balance> debtors = new PriorityQueue<>(comparingByAmount());
    PriorityQueue<Balance> creditors = new PriorityQueue<>(comparingByAmountReversed());

    balances.forEach((person, amount) -> {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            debtors.offer(new Balance(person, amount.abs()));
        } else if (amount.compareTo(BigDecimal.ZERO) > 0) {
            creditors.offer(new Balance(person, amount));
        }
    });

    // 3. 매칭
    List<Transaction> transactions = new ArrayList<>();
    while (!debtors.isEmpty() && !creditors.isEmpty()) {
        Balance debtor = debtors.poll();
        Balance creditor = creditors.poll();

        BigDecimal amount = debtor.amount.min(creditor.amount);
        transactions.add(new Transaction(debtor.person, creditor.person, amount));

        BigDecimal debtRemaining = debtor.amount.subtract(amount);
        BigDecimal creditRemaining = creditor.amount.subtract(amount);

        if (debtRemaining.compareTo(BigDecimal.ZERO) > 0) {
            debtors.offer(new Balance(debtor.person, debtRemaining));
        }
        if (creditRemaining.compareTo(BigDecimal.ZERO) > 0) {
            creditors.offer(new Balance(creditor.person, creditRemaining));
        }
    }

    return transactions;
}
```

---

## 7. 테스트 전략

### Backend Testing
- **Unit**: JUnit 5 + Mockito
- **Integration**: @SpringBootTest + Testcontainers (PostgreSQL, Redis)
- **API**: RestAssured

### Mobile Testing
- **Unit**: Jest
- **Component**: React Native Testing Library
- **E2E**: Detox (Phase 2)

### ML Testing
- **Model**: pytest + accuracy metrics
- **API**: FastAPI TestClient

---

## 결론 및 다음 단계

### 확정된 기술 스택
- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: Spring Boot 3.2 + Java 17
- **Database**: PostgreSQL 15 + Redis 7
- **ML**: FastText + Logistic Regression (Phase 1)
- **Infra**: Docker Compose → Kubernetes (Phase 3)

### 해결된 NEEDS CLARIFICATION
✅ AI 모델 선택: FastText + LR
✅ 모바일 플랫폼: Expo React Native
✅ 아키텍처 패턴: Layered Architecture
✅ 동기화 전략: Hybrid LWW + Conflict Detection
✅ Docker 구성: 3단계 실습

### 다음 단계: Phase 1 Design
- `data-model.md`: 엔티티 및 관계 설계
- `contracts/`: OpenAPI 스펙 작성
- `quickstart.md`: 개발 환경 설정 가이드
