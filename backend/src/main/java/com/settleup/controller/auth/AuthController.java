package com.settleup.controller.auth;

import com.settleup.dto.auth.RefreshTokenRequest;
import com.settleup.dto.auth.SocialLoginRequest;
import com.settleup.dto.auth.TokenResponse;
import com.settleup.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "인증 관련 API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login/google")
    @Operation(summary = "Google 소셜 로그인", description = "Google ID Token으로 로그인")
    public ResponseEntity<TokenResponse> googleLogin(@Valid @RequestBody SocialLoginRequest request) {
        TokenResponse response = authService.socialLogin("GOOGLE", request.getToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login/kakao")
    @Operation(summary = "Kakao 소셜 로그인", description = "Kakao OIDC ID Token으로 로그인")
    public ResponseEntity<TokenResponse> kakaoLogin(@Valid @RequestBody SocialLoginRequest request) {
        TokenResponse response = authService.socialLogin("KAKAO", request.getToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "토큰 갱신", description = "Refresh Token으로 새 Access Token 발급")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "사용자의 모든 Refresh Token 무효화")
    public ResponseEntity<Void> logout(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        authService.logout(userId);
        return ResponseEntity.ok().build();
    }
}