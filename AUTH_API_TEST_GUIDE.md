# SettleUp 소셜 로그인 API 테스트 가이드

## 📋 목차

1. [환경 설정](#환경-설정)
2. [개발 서버 실행](#개발-서버-실행)
3. [API 테스트 방법](#api-테스트-방법)
4. [Dev 모드 편의 기능](#dev-모드-편의-기능)
5. [에러 케이스 테스트](#에러-케이스-테스트)
6. [Swagger UI 사용법](#swagger-ui-사용법)

---

## 🛠 환경 설정

### 1. 설정 파일 생성

```bash
cd backend/src/main/resources
cp application-local.yml.example application-local.yml
```

### 2. 실제 키값 설정

`application-local.yml` 파일에 실제 키값들을 입력하세요:

```yaml
# OAuth 실제 키값들 - 각자의 키값으로 변경하세요
oauth:
  google:
    client-id: "YOUR_GOOGLE_CLIENT_ID_HERE"
  kakao:
    rest-api-key: "YOUR_KAKAO_REST_API_KEY_HERE"

# JWT 비밀키 - 32자 이상의 랜덤 문자열로 변경하세요
jwt:
  secret: "your-super-secret-jwt-key-at-least-32-characters-long"
```

### 3. Google 클라이언트 ID 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" > "Credentials" 메뉴
4. "Create Credentials" > "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. JavaScript origins에 `http://localhost:8080` 추가
7. 생성된 Client ID를 복사

### 4. Kakao REST API 키 발급

1. [Kakao Developers](https://developers.kakao.com/)에 접속
2. 새 애플리케이션 생성
3. 앱 설정 > 플랫폼 > Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:8080`
4. 제품 설정 > 카카오 로그인 > 활성화 설정 ON
5. 앱 키 > REST API 키 복사

---

## 🚀 개발 서버 실행

### 1. 데이터베이스 시작 (Docker 사용 시)

```bash
docker-compose up -d postgres redis
```

### 2. Spring Boot 애플리케이션 실행

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

또는 IDE에서 실행 시 환경변수 설정:
```
-Dspring.profiles.active=dev
```

### 3. 서버 확인

- API 서버: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/api/v1/swagger-ui.html
- Health check: http://localhost:8080/api/v1/actuator/health

---

## 🧪 API 테스트 방법

### 1. Google 소셜 로그인

#### 1-1. Google ID Token 획득 (브라우저에서)

```html
<!-- test.html 파일 생성 -->
<!DOCTYPE html>
<html>
<head>
    <title>Google Login Test</title>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <div id="g_id_onload"
         data-client_id="YOUR_GOOGLE_CLIENT_ID"
         data-callback="handleCredentialResponse">
    </div>
    <div class="g_id_signin" data-type="standard"></div>

    <script>
        function handleCredentialResponse(response) {
            console.log("Encoded JWT ID token: " + response.credential);
            // 이 토큰을 복사해서 API 테스트에 사용
        }
    </script>
</body>
</html>
```

#### 1-2. API 호출

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login/google" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "GOOGLE_ID_TOKEN_HERE"
  }'
```

**응답 예시:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "accessTokenExpiresIn": 1800000,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userName": "홍길동",
  "userEmail": "hong@gmail.com"
}
```

### 2. Kakao 소셜 로그인

#### 2-1. Kakao Access Token 획득

1. **브라우저에서 Authorization Code 획득:**
```
https://kauth.kakao.com/oauth/authorize?client_id=YOUR_KAKAO_REST_API_KEY&redirect_uri=http://localhost:8080&response_type=code
```

2. **Authorization Code로 Access Token 획득:**
```bash
curl -X POST "https://kauth.kakao.com/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_KAKAO_REST_API_KEY" \
  -d "redirect_uri=http://localhost:8080" \
  -d "code=AUTHORIZATION_CODE"
```

#### 2-2. API 호출

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login/kakao" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "KAKAO_ACCESS_TOKEN_HERE"
  }'
```

### 3. JWT 토큰 갱신

```bash
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'
```

### 4. 로그아웃

```bash
curl -X POST "http://localhost:8080/api/v1/auth/logout" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

---

## 🔧 Dev 모드 편의 기능

### 1. 테스트용 사용자 생성

```bash
curl -X POST "http://localhost:8080/api/v1/dev/user?name=테스트유저&email=test@example.com"
```

**응답:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "테스트유저",
  "email": "test@example.com",
  "createdAt": "2025-01-01T12:00:00",
  "updatedAt": "2025-01-01T12:00:00"
}
```

### 2. 테스트용 JWT 토큰 발급

```bash
curl -X POST "http://localhost:8080/api/v1/dev/token?userId=123e4567-e89b-12d3-a456-426614174000"
```

**응답:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
  "accessTokenExpiresIn": 1800000,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userName": "테스트유저",
  "userEmail": "test@example.com"
}
```

### 3. 헤더 인증 우회

JWT 토큰 없이 사용자 인증이 필요한 API 테스트:

```bash
curl -X POST "http://localhost:8080/api/v1/auth/logout" \
  -H "X-Dev-User-Id: 123e4567-e89b-12d3-a456-426614174000"
```

### 4. 인증이 필요한 API 테스트

기존 Settlement API도 인증 적용 예정이므로 미리 테스트:

```bash
# JWT 토큰 사용
curl -X GET "http://localhost:8080/api/v1/settlements" \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"

# 또는 Dev 헤더 사용
curl -X GET "http://localhost:8080/api/v1/settlements" \
  -H "X-Dev-User-Id: 123e4567-e89b-12d3-a456-426614174000"
```

---

## ❌ 에러 케이스 테스트

### 1. 잘못된 Google ID Token

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login/google" \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid_token"}'
```

**응답:**
```json
{
  "timestamp": "2025-01-01T12:00:00.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Failed to validate Google ID token",
  "path": "/api/v1/auth/login/google"
}
```

### 2. 만료된 JWT 토큰

```bash
curl -X POST "http://localhost:8080/api/v1/auth/logout" \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**응답:**
```json
{
  "timestamp": "2025-01-01T12:00:00.123Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token is expired",
  "path": "/api/v1/auth/logout"
}
```

### 3. 잘못된 Refresh Token

```bash
curl -X POST "http://localhost:8080/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "invalid_refresh_token"}'
```

**응답:**
```json
{
  "timestamp": "2025-01-01T12:00:00.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid refresh token",
  "path": "/api/v1/auth/refresh"
}
```

### 4. 존재하지 않는 사용자 (Dev)

```bash
curl -X POST "http://localhost:8080/api/v1/dev/token?userId=00000000-0000-0000-0000-000000000000"
```

**응답:**
```json
{
  "timestamp": "2025-01-01T12:00:00.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "User not found: 00000000-0000-0000-0000-000000000000",
  "path": "/api/v1/dev/token"
}
```

---

## 📖 Swagger UI 사용법

### 1. Swagger UI 접속

브라우저에서 http://localhost:8080/api/v1/swagger-ui.html 접속

### 2. JWT 토큰 설정

1. 페이지 상단의 **"Authorize"** 버튼 클릭
2. "JWT" 섹션에 토큰 입력: `Bearer YOUR_ACCESS_TOKEN`
3. "Authorize" 클릭

### 3. API 테스트

1. 원하는 API 엔드포인트 선택
2. "Try it out" 버튼 클릭
3. 파라미터 입력
4. "Execute" 버튼으로 실행

### 4. Dev 헤더 테스트

Swagger에서 커스텀 헤더 추가:
1. API 테스트 페이지에서 "Try it out"
2. "Parameters" 섹션에 `X-Dev-User-Id` 헤더 수동 추가 필요 (Swagger는 커스텀 헤더를 자동으로 지원하지 않음)

---

## 🔍 추가 유용한 테스트

### 1. 동일 이메일 다른 Provider 연동 테스트

같은 이메일로 Google과 Kakao 모두 로그인하여 계정 연동 확인:

1. Google으로 로그인: `test@gmail.com`
2. 동일 이메일로 Kakao 로그인
3. 동일한 User ID가 반환되는지 확인

### 2. JWT 토큰 만료 테스트

1. Dev API로 토큰 발급
2. 30분 대기 또는 `application-local.yml`에서 `access-token-expiry: 5000` (5초)로 설정
3. 만료된 토큰으로 API 호출
4. 401 Unauthorized 응답 확인

### 3. Refresh Token Rotation 테스트

1. 로그인으로 토큰 발급
2. Refresh API로 토큰 갱신
3. 이전 Refresh Token으로 재시도 시 에러 확인

---

## 💡 팁

1. **IntelliJ HTTP Client**: `.http` 파일 사용 시 더 편리한 테스트 가능
2. **환경변수**: 민감한 토큰들은 환경변수로 관리
3. **로그 확인**: `application-local.yml`에서 로그 레벨을 DEBUG로 설정하여 상세 로그 확인
4. **DB 확인**: PostgreSQL에서 직접 사용자/토큰 정보 확인 가능

---

## 🔒 보안 주의사항

⚠️ **Production 환경에서는 절대로:**
- Dev API (`/api/v1/dev/**`) 활성화 금지
- `X-Dev-User-Id` 헤더 인증 우회 비활성화
- JWT secret을 랜덤하고 충분히 긴 값으로 설정
- HTTPS 사용 필수

---

이 가이드를 따라 하시면 SettleUp의 소셜 로그인 API를 완전히 테스트할 수 있습니다. 문제가 있거나 궁금한 점이 있으면 언제든 문의하세요! 🚀