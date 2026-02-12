# SettleUp 소셜 로그인 구현 완료

## 🎉 구현 완료된 기능

### ✅ 소셜 로그인
- **Google 로그인**: Google ID Token 검증
- **Kakao 로그인**: Kakao OIDC ID Token 검증
- **자동 회원가입**: 소셜 로그인 시 사용자 자동 생성
- **계정 연동**: 같은 이메일로 다른 Provider 연동 지원

### ✅ JWT 인증 시스템
- **Access Token**: 30분 만료
- **Refresh Token**: 14일 만료, DB 저장
- **Token Rotation**: 갱신 시 기존 토큰 무효화
- **로그아웃**: 모든 Refresh Token 무효화

### ✅ 보안 설정
- **Spring Security**: JWT 기반 인증 필터
- **CORS**: 모바일 앱 지원
- **환경변수 분리**: 민감한 키값 환경변수 관리

### ✅ 개발 편의 기능 (dev 프로필 전용)
- **테스트 토큰 발급**: `/api/v1/dev/token?userId={uuid}`
- **헤더 인증 우회**: `X-Dev-User-Id` 헤더로 JWT 없이 테스트
- **테스트 유저 생성**: `/api/v1/dev/user`

### ✅ API 문서 및 테스트
- **Swagger UI**: JWT Bearer 토큰 지원
- **테스트 가이드**: 상세한 API 테스트 가이드 문서
- **HTTP Client 파일**: IntelliJ 통합 테스트 파일

## 🚀 빠른 시작

### 1. 환경 설정
```bash
cd backend/src/main/resources
cp application-local.yml.example application-local.yml
# application-local.yml에 실제 Google/Kakao 키값 입력
```

### 2. 서버 실행
```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 3. Swagger UI 접속
http://localhost:8080/api/v1/swagger-ui.html

### 4. 간단 테스트
```bash
# 1. 테스트 유저 생성
curl -X POST "http://localhost:8080/api/v1/dev/user?name=테스트&email=test@test.com"

# 2. 테스트 토큰 발급
curl -X POST "http://localhost:8080/api/v1/dev/token?userId={반환된 userId}"

# 3. 인증 필요한 API 테스트
curl -X POST "http://localhost:8080/api/v1/auth/logout" \
  -H "Authorization: Bearer {발급된 accessToken}"
```

## 📊 DB 스키마

### 새로 추가된 테이블
- `social_accounts`: 소셜 로그인 계정 정보
- `refresh_tokens`: JWT Refresh Token 관리

### 관계
```
User 1:N SocialAccount (여러 Provider 연동 가능)
User 1:N RefreshToken (여러 디바이스 로그인 가능)
```

## 🔐 보안 고려사항

### Production 환경에서 필수 설정
```yaml
# 환경변수로 설정 필요
oauth:
  google:
    client-id: ${GOOGLE_CLIENT_ID}
  kakao:
    rest-api-key: ${KAKAO_REST_API_KEY}
jwt:
  secret: ${JWT_SECRET} # 32자 이상 랜덤 문자열
```

### 프로덕션 배포 시 주의사항
- Dev API (`/api/v1/dev/**`) 비활성화
- `X-Dev-User-Id` 헤더 인증 우회 비활성화
- HTTPS 사용 필수
- JWT Secret 충분히 복잡하게 설정

## 📖 API 엔드포인트

### 인증 API
- `POST /api/v1/auth/login/google` - Google 로그인
- `POST /api/v1/auth/login/kakao` - Kakao 로그인
- `POST /api/v1/auth/refresh` - 토큰 갱신
- `POST /api/v1/auth/logout` - 로그아웃

### 개발용 API (dev 프로필 전용)
- `POST /api/v1/dev/user` - 테스트 유저 생성
- `POST /api/v1/dev/token` - 테스트 토큰 발급

## 📝 테스트 파일

- `AUTH_API_TEST_GUIDE.md`: 상세한 테스트 가이드
- `backend/auth-api-tests.http`: IntelliJ HTTP Client 테스트 파일

## 🔧 기술 스택

- **Spring Boot 3.2** + **Spring Security 6**
- **JWT**: io.jsonwebtoken (jjwt) 0.12.3
- **Google API Client**: 2.2.0
- **Nimbus JOSE + JWT**: 9.37.3 (Kakao OIDC ID Token 검증)
- **Flyway**: DB 마이그레이션

## 💡 다음 단계 (선택사항)

### 기존 API에 인증 적용
현재는 기존 Settlement/Expense API들이 `permitAll()`로 설정되어 있습니다.
점진적으로 인증을 적용하려면:

1. SecurityConfig에서 해당 API의 `permitAll()` 제거
2. Controller에서 `Authentication` 파라미터로 사용자 ID 획득
3. 사용자별 데이터 필터링 적용

### 예시: Settlement API에 인증 적용
```java
@GetMapping
public ResponseEntity<List<Settlement>> getSettlements(Authentication auth) {
    UUID userId = (UUID) auth.getPrincipal();
    List<Settlement> settlements = settlementService.getSettlementsByUser(userId);
    return ResponseEntity.ok(settlements);
}
```

---

**구현 완료! 🎊 SettleUp에서 이제 Google/Kakao 소셜 로그인을 사용할 수 있습니다.**