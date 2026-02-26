# SettleUp

**여행 정산 및 게임 정산을 위한 모바일 애플리케이션**

## 프로젝트 개요

SettleUp은 여행이나 게임 후 간편하게 정산할 수 있는 모바일 애플리케이션입니다. AI 기반 비용 카테고리 분류, 자동 정산 계산, 오프라인 지원 등의 기능을 제공합니다.

## 주요 기능

### 여행 정산
- 👥 참가자 관리
- 💰 지출 내역 입력 및 분할
- 🤖 AI 기반 카테고리 자동 분류
- 📊 정산 결과 자동 계산
- 📤 텍스트 공유 기능

### 게임 정산
- 🎮 라운드별 결과 입력
- 💵 승/패/무승부 기록
- 🧮 최종 금액 자동 계산
- 📈 통계 및 기록 관리

### 공통 기능
- 📱 오프라인 모드 지원
- 🔄 자동 동기화
- 📜 히스토리 관리
- 🔍 검색 및 필터링

## 기술 스택

### Backend
- **언어**: Java 17
- **프레임워크**: Spring Boot 3.2
- **데이터베이스**: PostgreSQL 15
- **캐시**: Redis 7
- **빌드 도구**: Gradle
- **API 문서**: Swagger/OpenAPI

### Mobile
- **프레임워크**: React Native (Expo)
- **언어**: TypeScript
- **상태 관리**: React Context
- **로컬 저장소**: SQLite
- **네비게이션**: React Navigation

### ML Service
- **언어**: Python 3.10
- **프레임워크**: FastAPI
- **ML 모델**: FastText
- **컨테이너**: Docker

### Infrastructure
- **컨테이너**: Docker, Docker Compose
- **CI/CD**: GitHub Actions (예정)
- **모니터링**: Prometheus, Grafana (예정)

## 프로젝트 구조

```
settleup/
├── backend/                 # Spring Boot 백엔드
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/settleup/
│   │       │       ├── controller/
│   │       │       ├── service/
│   │       │       ├── domain/
│   │       │       ├── repository/
│   │       │       └── config/
│   │       └── resources/
│   │           └── application.yml
│   ├── build.gradle
│   └── README.md
│
├── mobile/                  # React Native 모바일 앱
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── navigation/
│   │   └── models/
│   ├── package.json
│   └── README.md
│
├── ml-service/             # AI 카테고리 분류 서비스
│   ├── src/
│   │   ├── api/
│   │   ├── models/
│   │   └── training/
│   ├── requirements.txt
│   └── README.md
│
├── infrastructure/         # 인프라 설정
│   └── docker/
│       ├── docker-compose.yml
│       └── init-db.sql
│
└── specs/                  # 프로젝트 명세 및 문서
    └── 001-settleup-core-features/
        ├── plan.md
        ├── tasks.md
        ├── data-model.md
        ├── quickstart.md
        └── research.md
```

## 환경 구성

| 환경 | 백엔드 | DB | AI 분류 | 용도 |
|------|--------|------|---------|------|
| local | 로컬 실행 | 로컬 PostgreSQL | 비활성 | 개발 |
| dev | 홈랩 K8s | K8s PostgreSQL | K8s category-classifier | 테스트 |
| prod | AWS | RDS | 추후 결정 | 운영 |

## 빠른 시작 (local)

### 사전 요구사항

- Node.js 18.x 이상
- Java JDK 17 이상
- Docker 20.x 이상

### 1. 저장소 클론

```bash
git clone https://github.com/kimeasyn/settleup.git
cd settleup
```

### 2. DB 실행

```bash
docker compose up -d
```

### 3. 백엔드 설정 및 실행

`backend/src/main/resources/application-local.yml`을 생성한 후 실행:

```bash
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

- API: http://localhost:8080/api/v1
- Swagger: http://localhost:8080/api/v1/swagger-ui.html

### 4. 모바일 앱 실행

```bash
cd mobile
npm install
npx expo start
```

Expo 개발 서버가 실행되며, 시뮬레이터 또는 Expo Go에서 확인 가능합니다.

## 환경별 실행 방법

### Backend

```bash
# local — 로컬 PostgreSQL, AI 분류 비활성
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun

# dev — K8s Deployment env에 설정
SPRING_PROFILES_ACTIVE=dev

# prod — AWS Deployment env에 설정
SPRING_PROFILES_ACTIVE=prod
```

환경별 설정 파일(`application-local.yml`, `application-dev.yml`, `application-prod.yml`)은
gitignore 대상이므로 각 환경에서 직접 생성해야 합니다.

### Mobile

```bash
# local — Expo 개발 서버 (localhost API)
npx expo start

# dev — APK 빌드 (홈랩 API)
eas build -p android --profile dev

# prod — 프로덕션 빌드 (AWS API)
eas build -p android --profile production
```

### AI 분류 서비스 (선택)

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

## API 테스트

### 정산 생성

```bash
curl -X POST http://localhost:8080/api/v1/settlements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "제주도 여행",
    "type": "TRAVEL",
    "description": "2박 3일 여행",
    "startDate": "2025-01-15",
    "endDate": "2025-01-17",
    "currency": "KRW"
  }'
```

### 정산 조회

```bash
curl http://localhost:8080/api/v1/settlements/{settlement-id}
```

## 개발 가이드

- [퀵스타트 가이드](./specs/001-settleup-core-features/quickstart.md)
- [데이터 모델](./specs/001-settleup-core-features/data-model.md)
- [구현 계획](./specs/001-settleup-core-features/plan.md)
- [작업 목록](./specs/001-settleup-core-features/tasks.md)

## 테스트

### 백엔드 테스트

```bash
cd backend
./gradlew test
```

### 모바일 앱 테스트

```bash
cd mobile
npm test
```

## 배포

(추후 업데이트 예정)

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

MIT License

## 문의

- 이메일: support@settleup.com
- GitHub Issues: https://github.com/kimeasyn/settleup/issues

## 변경 이력

### v0.0.1 (2025-11-19)
- 프로젝트 초기 설정
- Phase 1-2 기본 인프라 및 백엔드 구현
- Swagger API 문서 추가
- 데이터베이스 스키마 설계
