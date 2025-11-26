# SettleUp 개발 가이드

## 📋 작업 진행 원칙

### TODO 기반 작업 관리

모든 개발 작업은 `TODO.md` 파일을 기준으로 진행합니다.

#### 1. 작업 시작 전

- **TODO.md 확인**: 다음 작업 항목과 우선순위를 확인합니다
- **사용자 확인**: 작업을 시작하기 전에 반드시 사용자에게 확인받습니다
  ```
  예시: "TODO.md의 Phase 5(정산 결과 계산)을 진행하겠습니다. 이 순서로 진행할까요?"
  ```

#### 2. 작업 중

- **TODO.md 업데이트**: 우선순위가 변경되거나 새로운 작업이 추가되면 TODO.md를 함께 수정합니다
- **진행 상황 표시**: 현재 작업 중인 항목을 명확히 합니다
- **의사결정 확인**: 중요한 기술적 결정이나 방향 전환 시 사용자 확인을 받습니다

#### 3. 작업 완료 후

- **체크 표시**: TODO.md에서 완료된 항목에 `[x]` 체크를 추가합니다
- **커밋 메시지**: TODO.md 변경사항을 함께 커밋합니다
- **다음 작업 확인**: 다음 우선순위 작업을 사용자와 확인합니다

### 예시 워크플로우

```markdown
1. Claude: "TODO.md를 확인했습니다. 다음 우선순위는 'Phase 5: 정산 결과 계산'입니다.
   이 작업을 진행할까요?"

2. User: "네, 진행해주세요"

3. Claude: [작업 수행]

4. Claude: [TODO.md 업데이트 - 완료 항목 체크]

5. Claude: "Phase 5가 완료되었습니다. TODO.md에 체크했습니다.
   다음 우선순위는 'Phase 7: 지출 수정/삭제'입니다. 진행할까요?"
```

---

## 🔧 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.x 이상
- **Java**: 17 이상
- **PostgreSQL**: 16
- **Expo CLI**: 최신 버전

### 백엔드 설정

```bash
cd backend

# PostgreSQL 데이터베이스 생성
psql postgres -c "CREATE USER settleup WITH PASSWORD 'settleup123';"
psql postgres -c "CREATE DATABASE settleup OWNER settleup;"

# 백엔드 실행
./gradlew bootRun
```

### 모바일 설정

```bash
cd mobile

# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# iOS 실행
npx expo run:ios

# Android 실행
npx expo run:android
```

---

## 📝 커밋 규칙

### 커밋 메시지 형식

```
<type>: <subject>

<body>
```

### Type 종류

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `docs`: 문서 수정
- `style`: 코드 포맷팅 (기능 변경 없음)
- `test`: 테스트 추가/수정
- `chore`: 빌드 설정, 패키지 매니저 등

### 예시

```bash
feat: 정산 결과 계산 API 구현

- SettlementCalculationService 추가
- 최소 송금 횟수 알고리즘 구현
- POST /settlements/{id}/calculate 엔드포인트 추가

TODO.md Phase 5 완료
```

---

## 🧪 테스트 규칙

### 백엔드 테스트

```bash
cd backend
./gradlew test
```

### 모바일 테스트

```bash
cd mobile
npm test
```

---

## 🚀 배포 프로세스

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 배포 순서

1. 로컬에서 테스트
2. PR 생성 및 코드 리뷰
3. develop 브랜치 병합
4. 통합 테스트
5. main 브랜치 병합
6. 프로덕션 배포

---

## 📚 참고 문서

- [TODO.md](./TODO.md): 작업 목록 및 우선순위
- [README.md](./README.md): 프로젝트 개요
- [backend/README.md](./backend/README.md): 백엔드 상세 문서
- [mobile/README.md](./mobile/README.md): 모바일 상세 문서

---

## 💡 개발 팁

### 일반적인 문제 해결

#### 백엔드 포트 충돌
```bash
lsof -ti:8080 | xargs kill -9
```

#### 모바일 캐시 클리어
```bash
npx expo start --clear
```

#### PostgreSQL 재시작
```bash
brew services restart postgresql@16
```

### 코드 스타일

- **들여쓰기**: 스페이스 2칸
- **세미콜론**: 사용 (JavaScript/TypeScript)
- **따옴표**: 작은따옴표 사용
- **trailing comma**: 사용

---

**마지막 업데이트**: 2025-11-26
