# SettleUp Mobile

**React Native (Expo) 기반 모바일 애플리케이션**

## 개요

SettleUp의 크로스 플랫폼 모바일 애플리케이션입니다. 여행 정산과 게임 정산을 간편하게 관리할 수 있으며, 오프라인에서도 작동합니다.

## 기술 스택

- **React Native**: Expo 프레임워크
- **TypeScript**: 타입 안정성
- **React Navigation**: 화면 네비게이션
- **Axios**: HTTP 클라이언트
- **Expo SQLite**: 로컬 데이터베이스
- **Async Storage**: 간단한 키-값 저장소
- **Expo Sharing**: 텍스트 공유 기능

## 프로젝트 구조

```
mobile/
├── src/
│   ├── screens/                    # 화면 컴포넌트
│   │   ├── HomeScreen.tsx         # 홈 화면
│   │   ├── TravelSettlementScreen.tsx    # 여행 정산
│   │   ├── GameSettlementScreen.tsx      # 게임 정산
│   │   └── HistoryScreen.tsx      # 히스토리
│   │
│   ├── components/                 # 재사용 가능한 컴포넌트
│   │   ├── SettlementCard.tsx
│   │   ├── ParticipantList.tsx
│   │   └── ExpenseForm.tsx
│   │
│   ├── navigation/                 # 네비게이션 설정
│   │   └── AppNavigator.tsx
│   │
│   ├── services/                   # 서비스 계층
│   │   ├── api/                   # API 통신
│   │   │   ├── client.ts
│   │   │   ├── settlements.ts
│   │   │   └── participants.ts
│   │   └── storage/               # 로컬 저장소
│   │       ├── database.ts        # SQLite
│   │       └── syncManager.ts     # 동기화 관리
│   │
│   ├── models/                     # 타입 정의
│   │   ├── Settlement.ts
│   │   ├── Participant.ts
│   │   └── Expense.ts
│   │
│   ├── hooks/                      # 커스텀 훅
│   │   ├── useSettlements.ts
│   │   └── useOfflineSync.ts
│   │
│   └── utils/                      # 유틸리티 함수
│       ├── calculations.ts        # 정산 계산
│       └── formatters.ts          # 포맷팅
│
├── assets/                         # 이미지, 폰트 등
├── App.tsx                         # 앱 진입점
├── app.json                        # Expo 설정
├── package.json                    # 의존성 관리
└── tsconfig.json                   # TypeScript 설정
```

## 설치 및 실행

### 사전 요구사항

- **Node.js**: 18.x 이상
- **npm** 또는 **yarn**
- **Expo Go** 앱 (실제 디바이스 테스트용)

### 설치

```bash
cd mobile

# 의존성 설치
npm install

# 또는 yarn 사용
yarn install
```

### 개발 서버 실행

```bash
npm start
# 또는
expo start
```

### 플랫폼별 실행

#### iOS 시뮬레이터

```bash
npm run ios
# 또는 Expo 개발 서버에서 'i' 입력
```

**요구사항**: macOS + Xcode

#### Android 에뮬레이터

```bash
npm run android
# 또는 Expo 개발 서버에서 'a' 입력
```

**요구사항**: Android Studio + Android SDK

#### 실제 디바이스

1. **Expo Go** 앱 설치
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. QR 코드 스캔
   - iOS: 카메라 앱으로 QR 코드 스캔
   - Android: Expo Go 앱에서 QR 코드 스캔

## 주요 기능

### 여행 정산

#### 1. 정산 생성
```typescript
const createSettlement = async () => {
  const settlement = {
    title: "제주도 여행",
    type: "TRAVEL",
    startDate: "2025-01-15",
    endDate: "2025-01-17",
  };

  await settlementsAPI.create(settlement);
};
```

#### 2. 참가자 추가
```typescript
const addParticipant = async (settlementId: string, name: string) => {
  await participantsAPI.add(settlementId, { name });
};
```

#### 3. 지출 입력
```typescript
const addExpense = async (data: ExpenseData) => {
  await expensesAPI.create(data);
};
```

### 게임 정산

#### 1. 라운드 생성
```typescript
const createRound = async (roundData: GameRoundData) => {
  await gameRoundsAPI.create(roundData);
};
```

#### 2. 결과 입력
```typescript
const recordResult = async (result: GameResultData) => {
  await gameResultsAPI.create(result);
};
```

### 오프라인 지원

#### 로컬 데이터베이스 초기화

```typescript
import { initializeDatabase } from './services/storage/database';

await initializeDatabase();
```

#### 동기화

```typescript
import { syncWithServer } from './services/storage/syncManager';

// 인터넷 연결 시 자동 동기화
await syncWithServer();
```

## API 연결 설정

### 백엔드 URL 설정

`src/services/api/client.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api/v1'  // 개발 모드
  : 'https://api.settleup.com/v1';   // 프로덕션
```

### 실제 디바이스에서 로컬 백엔드 연결

iOS 시뮬레이터:
```typescript
const API_BASE_URL = 'http://localhost:8080/api/v1';
```

Android 에뮬레이터:
```typescript
const API_BASE_URL = 'http://10.0.2.2:8080/api/v1';
```

실제 디바이스 (같은 WiFi):
```typescript
const API_BASE_URL = 'http://192.168.x.x:8080/api/v1';
// 컴퓨터의 실제 IP 주소 사용
```

## 환경 변수

### app.json 설정

```json
{
  "expo": {
    "name": "SettleUp",
    "slug": "settleup",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "extra": {
      "apiUrl": "http://localhost:8080/api/v1"
    }
  }
}
```

### 환경 변수 사용

```typescript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;
```

## 빌드 및 배포

### 개발 빌드

```bash
# Android APK 생성
expo build:android

# iOS IPA 생성 (macOS 필요)
expo build:ios
```

### EAS Build (권장)

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 빌드 설정
eas build:configure

# Android 빌드
eas build --platform android

# iOS 빌드
eas build --platform ios
```

## 테스트

### 유닛 테스트

```bash
npm test
```

### E2E 테스트 (Detox)

```bash
# iOS
npm run e2e:ios

# Android
npm run e2e:android
```

## 디버깅

### React Native Debugger 사용

1. React Native Debugger 설치
   ```bash
   brew install --cask react-native-debugger
   ```

2. 앱에서 Developer Menu 열기
   - iOS 시뮬레이터: `Cmd + D`
   - Android 에뮬레이터: `Cmd + M` (macOS) / `Ctrl + M` (Windows/Linux)

3. "Debug with Chrome" 선택

### Expo DevTools

```bash
npm start
# 브라우저에서 http://localhost:19002 열림
```

## 성능 최적화

### React.memo 사용

```typescript
import React, { memo } from 'react';

const SettlementCard = memo(({ settlement }) => {
  return <View>...</View>;
});
```

### useCallback 사용

```typescript
const handlePress = useCallback(() => {
  // 핸들러 로직
}, [dependencies]);
```

### FlatList 최적화

```typescript
<FlatList
  data={settlements}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

## 트러블슈팅

### 캐시 문제

```bash
# Expo 캐시 삭제
expo start --clear

# npm 캐시 삭제
npm start -- --reset-cache
```

### iOS 빌드 실패

```bash
cd ios
pod install
cd ..
npm run ios
```

### Android 빌드 실패

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Metro Bundler 오류

```bash
# Metro 캐시 삭제
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
npm start -- --reset-cache
```

## 스타일링

### 테마 설정

```typescript
export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    error: '#FF3B30',
    background: '#FFFFFF',
    text: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    body: { fontSize: 16 },
    caption: { fontSize: 12 },
  },
};
```

## 참고 자료

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
