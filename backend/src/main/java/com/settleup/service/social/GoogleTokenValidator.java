package com.settleup.service.social;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Slf4j
@Service
public class GoogleTokenValidator implements SocialTokenValidator {

    @Value("${oauth.google.client-id-ios}")
    private String clientIdIos;

    @Value("${oauth.google.client-id-android}")
    private String clientIdAndroid;

    private GoogleIdTokenVerifier verifier;

    private GoogleIdTokenVerifier getVerifier() {
        if (verifier == null) {
            verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Arrays.asList(clientIdIos, clientIdAndroid))
                    .build();
        }
        return verifier;
    }

    @Override
    public SocialUserInfo validateToken(String idToken) {
        try {
            GoogleIdToken token = getVerifier().verify(idToken);
            if (token == null) {
                throw new RuntimeException("Invalid Google ID token");
            }

            GoogleIdToken.Payload payload = token.getPayload();
            String userId = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            return SocialUserInfo.builder()
                    .providerId(userId)
                    .email(email)
                    .name(name)
                    .provider("GOOGLE")
                    .build();

        } catch (Exception e) {
            log.error("Failed to validate Google ID token", e);
            throw new RuntimeException("Failed to validate Google ID token", e);
        }
    }

    @Override
    public String getProvider() {
        return "GOOGLE";
    }
}
