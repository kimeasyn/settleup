# SettleUp Backend

**Spring Boot 기반 REST API 서버**

## 개요

SettleUp 모바일 애플리케이션의 백엔드 서버입니다. 여행 정산 및 게임 정산 기능을 제공하는 RESTful API를 구현합니다.

## 기술 스택

- **Java**: 17
- **Spring Boot**: 3.2.0
- **Spring Data JPA**: 데이터 접근 계층
- **Spring Data Redis**: 캐싱
- **PostgreSQL**: 15 (주 데이터베이스)
- **Redis**: 7 (캐시)
- **Gradle**: 빌드 도구
- **Swagger/OpenAPI**: API 문서 자동 생성
- **Lombok**: 보일러플레이트 코드 감소

## 프로젝트 구조

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/settleup/
│   │   │   ├── SettleUpApplication.java       # 애플리케이션 진입점
│   │   │   ├── controller/                    # REST 컨트롤러
│   │   │   │   └── SettlementController.java
│   │   │   ├── service/                       # 비즈니스 로직
│   │   │   │   └── SettlementService.java
│   │   │   ├── domain/                        # JPA 엔티티
│   │   │   │   ├── settlement/
│   │   │   │   │   ├── Settlement.java
│   │   │   │   │   ├── SettlementType.java
│   │   │   │   │   └── SettlementStatus.java
│   │   │   │   ├── user/
│   │   │   │   │   └── User.java
│   │   │   │   └── participant/
│   │   │   │       └── Participant.java
│   │   │   ├── repository/                    # 데이터 접근 계층
│   │   │   │   ├── SettlementRepository.java
│   │   │   │   ├── UserRepository.java
│   │   │   │   └── ParticipantRepository.java
│   │   │   ├── dto/                          # 데이터 전송 객체
│   │   │   │   ├── SettlementCreateRequest.java
│   │   │   │   └── SettlementResponse.java
│   │   │   ├── config/                       # 설정 클래스
│   │   │   │   ├── RedisConfig.java
│   │   │   │   └── SwaggerConfig.java
│   │   │   └── exception/                    # 예외 처리
│   │   │       ├── GlobalExceptionHandler.java
│   │   │       ├── ResourceNotFoundException.java
│   │   │       ├── BusinessException.java
│   │   │       └── ErrorResponse.java
│   │   └── resources/
│   │       └── application.yml               # 애플리케이션 설정
│   └── test/
│       └── java/com/settleup/
│           └── (테스트 클래스)
├── build.gradle                              # Gradle 빌드 설정
└── README.md
```

## 실행 방법

### 사전 요구사항

1. **Java 17 설치**
   ```bash
   java -version  # 17.x 이상 확인
   ```

2. **PostgreSQL 및 Redis 실행** (Docker 사용)
   ```bash
   cd ../infrastructure/docker
   docker-compose up -d
   ```

### 개발 모드로 실행

```bash
# Gradle wrapper 사용
./gradlew bootRun

# 또는 IDE에서 SettleUpApplication.java 실행
```

서버가 http://localhost:8080 에서 실행됩니다.

### 빌드

```bash
# JAR 파일 생성
./gradlew build

# 테스트 제외하고 빌드
./gradlew build -x test

# 빌드 결과물 위치
ls build/libs/
```

### 실행 가능한 JAR로 실행

```bash
java -jar build/libs/settleup-backend-0.0.1-SNAPSHOT.jar
```

## API 문서

### Swagger UI

서버 실행 후 브라우저에서 접속:
- **Swagger UI**: http://localhost:8080/api/v1/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/api/v1/api-docs

### 주요 엔드포인트

#### 정산 (Settlements)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/settlements` | 정산 생성 |
| GET | `/api/v1/settlements/{id}` | 정산 조회 |
| DELETE | `/api/v1/settlements/{id}` | 정산 삭제 |
| GET | `/api/v1/settlements/health` | 헬스 체크 |

#### 정산 생성 예시

```bash
curl -X POST http://localhost:8080/api/v1/settlements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "제주도 여행",
    "type": "TRAVEL",
    "description": "2박 3일 제주도 여행",
    "startDate": "2025-01-15",
    "endDate": "2025-01-17",
    "currency": "KRW"
  }'
```

**응답:**
```json
{
  "id": "e44bc384-b74a-4d66-943e-a00a0fd13192",
  "title": "제주도 여행",
  "type": "TRAVEL",
  "status": "ACTIVE",
  "creatorId": "00000000-0000-0000-0000-000000000001",
  "description": "2박 3일 제주도 여행",
  "startDate": "2025-01-15",
  "endDate": "2025-01-17",
  "currency": "KRW",
  "createdAt": "2025-11-19T16:06:41.062348",
  "updatedAt": "2025-11-19T16:06:41.062358",
  "version": 0
}
```

## 데이터베이스

### 연결 설정

`application.yml` 파일에서 데이터베이스 연결 설정:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/settleup
    username: settleup
    password: settleup123
```

### 직접 연결

```bash
# PostgreSQL 클라이언트로 연결
psql -h localhost -U settleup -d settleup
# 비밀번호: settleup123

# Docker 컨테이너 내부에서 연결
docker exec -it settleup-postgres psql -U settleup -d settleup
```

### 테이블 확인

```sql
-- 모든 테이블 조회
\dt

-- 테스트 사용자 확인
SELECT * FROM users;

-- 정산 내역 확인
SELECT * FROM settlements;
```

## 테스트

### 전체 테스트 실행

```bash
./gradlew test
```

### 특정 테스트 실행

```bash
./gradlew test --tests SettlementServiceTest
```

### 테스트 커버리지

```bash
./gradlew test jacocoTestReport
# 결과: build/reports/jacoco/test/html/index.html
```

## 환경별 설정

### 개발 환경 (application.yml)

기본 설정 파일로, 로컬 개발에 사용됩니다.

### 프로덕션 환경 (application-prod.yml)

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
  jpa:
    show-sql: false
    hibernate:
      ddl-auto: validate
logging:
  level:
    com.settleup: INFO
```

실행:
```bash
java -jar app.jar --spring.profiles.active=prod
```

## 로깅

### 로그 레벨 설정

`application.yml`:
```yaml
logging:
  level:
    root: INFO
    com.settleup: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### 로그 파일 설정

```yaml
logging:
  file:
    name: logs/settleup-backend.log
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

## 캐싱 (Redis)

### Redis 설정

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      timeout: 2000ms
```

### 캐시 사용 예시

```java
@Cacheable(value = "settlements", key = "#id")
public Settlement getSettlement(UUID id) {
    // ...
}

@CacheEvict(value = "settlements", key = "#id")
public void deleteSettlement(UUID id) {
    // ...
}
```

## 트러블슈팅

### 데이터베이스 연결 실패

```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# PostgreSQL 로그 확인
docker logs settleup-postgres

# 포트 충돌 확인
lsof -i :5432
```

### Gradle 빌드 실패

```bash
# Gradle 캐시 삭제
./gradlew clean

# 의존성 새로고침
./gradlew build --refresh-dependencies
```

### JPA 매핑 오류

```bash
# SQL 로그 활성화하여 확인
# application.yml에서:
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

## 참고 자료

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Spring Data Redis](https://spring.io/projects/spring-data-redis)
- [Swagger/OpenAPI](https://springdoc.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
