package com.settleup.service.social;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
public class KakaoTokenValidator implements SocialTokenValidator {

    private static final String KAKAO_ISSUER = "https://kauth.kakao.com";
    private static final String KAKAO_JWKS_URI = "https://kauth.kakao.com/.well-known/jwks.json";

    @Value("${oauth.kakao.rest-api-key}")
    private String restApiKey;

    private ConfigurableJWTProcessor<SecurityContext> jwtProcessor;

    @PostConstruct
    public void init() {
        try {
            jwtProcessor = new DefaultJWTProcessor<>();

            JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(new URL(KAKAO_JWKS_URI));
            JWSKeySelector<SecurityContext> keySelector =
                    new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
            jwtProcessor.setJWSKeySelector(keySelector);

            Set<String> requiredClaims = new HashSet<>(Arrays.asList("sub", "iss", "aud", "exp", "iat"));
            JWTClaimsSet exactMatchClaims = new JWTClaimsSet.Builder()
                    .issuer(KAKAO_ISSUER)
                    .audience(restApiKey)
                    .build();
            jwtProcessor.setJWTClaimsSetVerifier(
                    new DefaultJWTClaimsVerifier<>(exactMatchClaims, requiredClaims));

            log.info("Kakao OIDC JWT processor initialized (issuer={}, audience={})", KAKAO_ISSUER, restApiKey);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Kakao JWT processor", e);
        }
    }

    @Override
    public SocialUserInfo validateToken(String idToken) {
        try {
            JWTClaimsSet claims = jwtProcessor.process(idToken, null);

            String userId = claims.getSubject();
            String email = claims.getStringClaim("email");
            String nickname = claims.getStringClaim("nickname");

            return SocialUserInfo.builder()
                    .providerId(userId)
                    .email(email)
                    .name(nickname)
                    .provider("KAKAO")
                    .build();

        } catch (Exception e) {
            log.error("Failed to validate Kakao ID token: {}", e.getMessage());
            throw new RuntimeException("Failed to validate Kakao ID token", e);
        }
    }

    @Override
    public String getProvider() {
        return "KAKAO";
    }
}
