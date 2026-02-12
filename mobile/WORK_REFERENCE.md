# SettleUp Mobile 작업 참고 문서

> **날짜:** 2025-11-19
> **브랜치:** `001-settleup-core-features`
> **마지막 커밋:** `ba958ed`

---

## 📋 현재 상황 요약

### 완료된 작업
- ✅ Expo SDK 50 프로젝트 기본 설정
- ✅ React Navigation (Stack + Bottom Tabs) 구조 구축
- ✅ SQLite 기반 로컬 스토리지 구현
- ✅ 동기화 큐 시스템 구현 (offline-first)
- ✅ expo-dev-client 설치 및 설정
- ✅ App.tsx 단순화 (디버깅용)
- ✅ app.json 수정 (누락된 asset 제거)

### 해결하지 못한 문제
❌ **Expo Go 실행 오류**
```
ERROR: SecurityException: Permission Denial: registerScreenCaptureObserver
ERROR: Invariant Violation: "main" has not been registered
```
- Expo Go 앱 자체의 권한 문제
- Android 버전 또는 Expo Go 버전 호환성 이슈 의심

❌ **로컬 Android 빌드 실패**
```
Plugin [id: 'expo-module-gradle-plugin'] was not found
```
- macOS에 Android SDK가 제대로 설치되지 않음
- `adb` 명령어 없음 (Android platform tools 미설치)

---

## 🏠 집에서 할 작업

### 1단계: 프로젝트 준비

```bash
# 레포지토리 업데이트
cd ~/path/to/settleup
git checkout 001-settleup-core-features
git pull origin 001-settleup-core-features

# 모바일 앱 디렉토리로 이동
cd mobile

# 의존성 설치
npm install --legacy-peer-deps

# node_modules 정상 설치 확인
ls -la node_modules | grep expo
```

### 2단계: Android 네이티브 프로젝트 생성

```bash
# Expo prebuild로 android 폴더 자동 생성
npx expo prebuild --platform android --clean

# 생성 확인
ls -la android/
```

### 3단계: 빌드 시도

#### 옵션 A: Android 기기 USB 연결 (권장)

```bash
# Android 기기를 USB로 연결하고 USB 디버깅 활성화

# 기기 연결 확인
adb devices

# 빌드 & 설치
npx expo run:android
```

#### 옵션 B: APK 파일만 빌드

```bash
cd android
./gradlew assembleDebug

# APK 위치 확인
ls -la app/build/outputs/apk/debug/

# APK를 Android 기기로 전송 후 수동 설치
```

#### 옵션 C: Expo Go 재시도

```bash
# Expo Go 앱 업데이트/재설치 후

npx expo start --clear

# QR 코드로 연결
```

---

## 🔧 예상 문제 및 해결법

### 문제 1: Android SDK 관련 오류

**증상:**
```
ANDROID_HOME is not set
SDK location not found
```

**해결:**
```bash
# Android Studio 설치 여부 확인
/Applications/Android\ Studio.app/Contents/MacOS/studio --version

# 환경변수 설정 (필요시)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

### 문제 2: Gradle 빌드 실패

**증상:**
```
expo-module-gradle-plugin not found
Could not get unknown property 'release'
```

**해결:**
```bash
# 1. android 폴더 삭제 후 재생성
rm -rf android
npx expo prebuild --platform android --clean

# 2. Gradle 캐시 클리어
cd android
./gradlew clean
./gradlew --stop

# 3. 재빌드
./gradlew assembleDebug
```

### 문제 3: Expo Go 권한 오류 (이전과 동일)

**해결 시도:**
1. Play 스토어에서 Expo Go 앱 업데이트/재설치
2. 안드로이드 설정 → 앱 → Expo Go → 저장공간 → 데이터 삭제
3. 다른 네트워크 연결 방식 시도 (`--tunnel`, `--lan` 옵션)

---

## 📱 빌드 성공 후 테스트

### 현재 앱 상태

**App.tsx (단순화된 버전):**
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>✅ SettleUp</Text>
      <Text style={styles.subtitle}>앱이 성공적으로 실행되었습니다!</Text>
    </View>
  );
}
```

### 앱 실행 확인

1. ✅ 앱이 크래시 없이 실행되는가?
2. ✅ 화면에 "✅ SettleUp" 텍스트가 표시되는가?
3. ✅ SecurityException 오류가 발생하지 않는가?

### 성공 시 다음 단계

앱이 정상 실행되면 다음 작업 진행:

```bash
# App.tsx를 원래 버전으로 복원
git show HEAD~1:App.tsx > App.tsx.backup

# 또는 수동으로 Navigation 구조 다시 추가
```

---

## 🔄 작업 재개 시 Claude Code에 전달할 컨텍스트

### 이전 세션 요약

```
[이전 작업 내역]
- Expo Go에서 SecurityException 오류 발생
- expo-dev-client로 전환 시도
- macOS에 Android SDK 미설치로 로컬 빌드 실패
- 작업 중단 및 커밋/푸시 완료

[현재 상태]
- 브랜치: 001-settleup-core-features
- 커밋: ba958ed
- App.tsx: 단순화된 테스트 버전
- expo-dev-client 설치됨
- android/ 폴더는 .gitignore에 추가됨

[집에서 해야 할 일]
- Android Studio가 설치된 환경에서 빌드 재시도
- 빌드 성공 시 앱 정상 작동 확인
- 성공 시 Navigation 구조 다시 활성화
```

### Claude Code 세션 재개 시 질문 예시

1. "앞서 작업했던 SettleUp 모바일 앱 개발을 이어서 하려고 합니다. 현재 expo-dev-client로 빌드를 시도했는데 [오류 메시지]가 발생했어요."

2. "WORK_REFERENCE.md 파일을 읽고 현재 상황을 파악한 후, Android 빌드를 도와주세요."

3. "빌드는 성공했는데 앱이 실행되지 않아요. 다음 디버깅 단계를 제안해주세요."

---

## 📦 주요 파일 구조

```
mobile/
├── App.tsx                          # 메인 진입점 (현재 단순화됨)
├── app.json                         # Expo 설정
├── package.json                     # 의존성 (expo-dev-client 포함)
├── babel.config.js                  # Babel 설정
├── tsconfig.json                    # TypeScript 설정
├── .gitignore                       # android/, ios/ 제외
│
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx         # React Navigation 구조
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx           # 홈 화면
│   │   └── TravelSettlementScreen.tsx  # 정산 상세
│   │
│   ├── services/
│   │   ├── storage/
│   │   │   └── database.ts          # SQLite 초기화
│   │   │
│   │   └── sync/
│   │       └── syncService.ts       # 동기화 큐
│   │
│   └── types/
│       └── settlement.ts            # TypeScript 타입 정의
│
└── android/                         # (gitignore, 자동 생성됨)
```

---

## 🎯 최종 목표

1. **개발 환경 빌드 성공**
   - Expo Development Client APK 생성
   - Android 기기에 설치 및 실행

2. **앱 정상 작동 확인**
   - SecurityException 없이 실행
   - Navigation 구조 정상 작동
   - SQLite 데이터베이스 초기화 확인

3. **다음 Phase 진행**
   - HomeScreen 구현
   - 정산 생성 화면 구현
   - 비용 입력 화면 구현

---

## 💡 팁

### Gradle 빌드 속도 개선

```bash
# gradle.properties에 추가
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=512m
```

### Metro Bundler 최적화

```bash
# Metro 캐시 클리어
npx expo start --clear

# Watchman 캐시 클리어
watchman watch-del-all
```

### Android 기기 연결 문제

```bash
# ADB 서버 재시작
adb kill-server
adb start-server

# 연결된 기기 확인
adb devices -l
```

---

**참고:** 이 문서는 로컬 참고용이며 Git에 커밋되지 않습니다.
