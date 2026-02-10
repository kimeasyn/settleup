package com.settleup.service.social;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Service
public class KakaoTokenValidator implements SocialTokenValidator {

    @Value("${oauth.kakao.rest-api-key}")
    private String restApiKey;

    private final WebClient webClient;

    public KakaoTokenValidator() {
        this.webClient = WebClient.builder()
                .baseUrl("https://kapi.kakao.com")
                .build();
    }

    @Override
    public SocialUserInfo validateToken(String accessToken) {
        try {
            JsonNode response = webClient.get()
                    .uri("/v2/user/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("Failed to get user info from Kakao");
            }

            String userId = response.get("id").asText();

            JsonNode kakaoAccount = response.get("kakao_account");
            String email = null;
            if (kakaoAccount.has("email")) {
                email = kakaoAccount.get("email").asText();
            }

            String name = null;
            if (kakaoAccount.has("profile")) {
                JsonNode profile = kakaoAccount.get("profile");
                if (profile.has("nickname")) {
                    name = profile.get("nickname").asText();
                }
            }

            return SocialUserInfo.builder()
                    .providerId(userId)
                    .email(email)
                    .name(name)
                    .provider("KAKAO")
                    .build();

        } catch (WebClientResponseException e) {
            log.error("Failed to validate Kakao access token: {}", e.getMessage());
            throw new RuntimeException("Failed to validate Kakao access token", e);
        } catch (Exception e) {
            log.error("Failed to validate Kakao access token", e);
            throw new RuntimeException("Failed to validate Kakao access token", e);
        }
    }

    @Override
    public String getProvider() {
        return "KAKAO";
    }
}