package com.settleup.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Swagger/OpenAPI 설정
 * API 문서 자동 생성
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI settleUpOpenAPI() {
        // 서버 정보
        Server localServer = new Server();
        localServer.setUrl("http://localhost:8080/api/v1");
        localServer.setDescription("로컬 개발 서버");

        Server prodServer = new Server();
        prodServer.setUrl("https://api.settleup.com/v1");
        prodServer.setDescription("프로덕션 서버");

        // 연락처 정보
        Contact contact = new Contact();
        contact.setName("SettleUp Team");
        contact.setEmail("support@settleup.com");

        // 라이선스 정보
        License license = new License();
        license.setName("MIT License");
        license.setUrl("https://opensource.org/licenses/MIT");

        // API 정보
        Info info = new Info()
                .title("SettleUp API")
                .version("1.0.0")
                .description("""
                        ## SettleUp REST API 문서

                        여행 및 게임 정산을 위한 모바일 애플리케이션 백엔드 API입니다.

                        ### 주요 기능
                        - 🧳 **여행 정산**: 참가자 추가, 지출 입력, 자동 정산 계산
                        - 🎮 **게임 정산**: 라운드별 결과 입력, 최종 금액 정산
                        - 🤖 **AI 카테고리 분류**: 지출 설명 기반 자동 카테고리 추천
                        - 📤 **텍스트 공유**: 정산 내용 텍스트 내보내기
                        - 📜 **히스토리**: 과거 정산 조회 및 검색

                        ### 기술 스택
                        - Spring Boot 3.2
                        - PostgreSQL 15
                        - Redis 7
                        - Docker

                        ### 인증
                        현재는 개발 단계로 인증이 비활성화되어 있습니다.
                        향후 JWT 기반 인증이 추가될 예정입니다.
                        """)
                .contact(contact)
                .license(license);

        return new OpenAPI()
                .info(info)
                .servers(List.of(localServer, prodServer));
    }
}
