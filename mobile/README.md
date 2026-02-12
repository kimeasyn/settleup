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

- **Node.js**: 18.x 이상 (권장: 18.17.0+)
- **npm** 또는 **yarn**
- **Expo Go** 앱 (실제 디바이스 테스트용)
- **iOS 개발**: macOS + Xcode 15+ (iOS 시뮬레이터용)
- **Android 개발**: Android Studio + Android SDK (에뮬레이터/실제 기기용)

### 설치

```bash
cd mobile

# 의존성 설치 (M1 Mac에서는 --legacy-peer-deps 필요)
npm install --legacy-peer-deps

# 또는 yarn 사용
yarn install

# 설치 확인
npm list expo
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
# Development Build 생성 및 실행 (권장)
npx expo run:ios

# 또는 기존 빌드가 있는 경우
npm start
# Expo 개발 서버에서 'i' 입력
```

**요구사항**: macOS + Xcode 15+
**참고**: 첫 실행 시 CocoaPods 설치 및 iOS 개발 빌드 생성에 시간이 소요됩니다.

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

#### 웹 브라우저 (개발용)

```bash
# 웹 개발 서버 실행
npx expo start --web

# 또는 package.json의 web 스크립트 사용
npm run web
```

**요구사항**: 모던 웹 브라우저
**참고**: 웹용 react-native-web 의존성이 설치되어야 합니다.

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

### 의존성 설치 문제

#### M1 Mac에서 peer dependencies 오류
```bash
# 해결: --legacy-peer-deps 옵션 사용
npm install --legacy-peer-deps

# 또는 .npmrc 파일에 추가
echo "legacy-peer-deps=true" > .npmrc
```

#### React Native Web 관련 오류
```bash
# 웹 관련 의존성 추가 설치
npm install react-native-web @expo/metro-runtime react-dom --legacy-peer-deps
```

### iOS 개발 환경 문제

#### CocoaPods 설치 실패 (tclsh8.6 dependency)
```bash
# ARM64 Mac에서 Homebrew 설치
arch -arm64 brew install tcl-tk

# 또는 pyenv anaconda 사용 (권장)
pyenv global anaconda3-5.0.1
```

#### Xcode Command Line Tools 오류
```bash
# Xcode path 재설정
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Command Line Tools 재설치
xcode-select --install
```

#### CocoaPods 설치 오류
```bash
cd ios
# CocoaPods 재설치
pod deintegrate
pod install

# 캐시 문제가 있는 경우
pod install --repo-update
```

### Metro Bundler 문제

#### "no bundle url present" 오류
```bash
# 올바른 디렉토리에서 Metro 실행 확인
cd /Users/[username]/workspace/settleup/mobile
npx expo start --clear

# iOS 시뮬레이터에서 앱 리로드
# 시뮬레이터에서 ⌘+R 입력
```

#### 캐시 문제
```bash
# Expo 캐시 삭제
npx expo start --clear

# npm 캐시 삭제
npm start -- --reset-cache

# Metro 캐시 완전 삭제
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
npx expo start --clear
```

### 데이터베이스 문제

#### "no such table: settlements" 오류
```bash
# SQLite 데이터베이스 초기화 확인
# App.tsx에서 initializeDatabase() 호출 여부 확인
# iOS 시뮬레이터에서 앱 리로드: ⌘+R
```

#### 앱 초기화 실패
```bash
# 시뮬레이터 데이터 리셋
# iOS Simulator → Device → Erase All Content and Settings
# 앱 재설치 및 실행
```

### 환경 설정 문제

#### Java 버전 충돌 (iOS Development)
```bash
# Java 21 설치 (M1 Mac)
arch -arm64 brew install openjdk@21

# 환경변수 설정
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
```

#### ARM64 호환성 문제
```bash
# M1 Mac에서 Intel 바이너리 실행 시
arch -arm64 brew install [패키지명]

# Rosetta 2 설치 (필요한 경우)
softwareupdate --install-rosetta
```

### 네트워크 연결 문제

#### 백엔드 API 연결 실패
```bash
# 백엔드 서버 실행 상태 확인
curl http://localhost:8080/api/v1/settlements/health

# iOS 시뮬레이터에서 로컬 서버 접근
# API_BASE_URL을 'http://localhost:8080/api/v1'로 설정

# 실제 기기에서 접근 시 컴퓨터의 IP 주소 사용
# API_BASE_URL을 'http://192.168.x.x:8080/api/v1'로 설정
```

### 성능 문제

#### 빌드 속도 개선
```bash
# Watchman 설치 (파일 변경 감지 최적화)
brew install watchman

# Watchman 캐시 클리어
watchman watch-del-all
```

### 일반적인 문제 해결 순서

1. **캐시 클리어**
   ```bash
   npx expo start --clear
   ```

2. **의존성 재설치**
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **iOS 시뮬레이터 리셋**
   ```bash
   # 시뮬레이터에서 Device → Erase All Content and Settings
   ```

4. **Metro Bundler 재시작**
   ```bash
   pkill -f "expo start"
   npx expo start --clear
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
