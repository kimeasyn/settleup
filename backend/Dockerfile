FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /app

# [최적화] Gradle Wrapper + 설정 파일만 먼저 복사
# → 의존성 다운로드 레이어를 캐싱하여 코드 변경 시 재빌드 속도 향상
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew

# [최적화] 의존성만 먼저 다운로드 (Docker 레이어 캐시 활용)
# 소스코드가 변경되어도 build.gradle이 안 바뀌면 이 레이어는 캐시됨
RUN ./gradlew dependencies --no-daemon || true

# 소스코드 복사 (자주 바뀌는 부분이므로 마지막에)
COPY src/ src/

# JAR 빌드 (테스트 스킵 - CI에서 별도로 실행)
RUN ./gradlew bootJar --no-daemon -x test

# -----------------------------------------------
# Stage 2: Runtime Stage
# -----------------------------------------------
# JRE만 포함된 경량 이미지 (JDK 대비 ~200MB 절약)
FROM eclipse-temurin:17-jre-jammy AS runtime

WORKDIR /app


RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Build Stage에서 JAR만 복사 (소스코드, Gradle 등은 제외)
COPY --from=build /app/build/libs/*.jar app.jar


USER appuser


EXPOSE 8080

# JVM 옵션 설명:
# -XX:+UseContainerSupport : 컨테이너 메모리 제한을 JVM이 인식
# -XX:MaxRAMPercentage=75  : 컨테이너 메모리의 75%를 JVM 힙으로 할당
#   → ECS Fargate에서 메모리 제한 설정 시 OOM 방지에 중요
# -Djava.security.egd      : 컨테이너에서 SecureRandom 성능 향상
#   → JWT 토큰 생성 등에서 블로킹 방지
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
