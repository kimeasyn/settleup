package com.settleup.controller.dev;

import com.settleup.domain.user.RefreshToken;
import com.settleup.domain.user.User;
import com.settleup.dto.auth.TokenResponse;
import com.settleup.repository.RefreshTokenRepository;
import com.settleup.repository.UserRepository;
import com.settleup.security.JwtTokenProvider;
import com.settleup.security.JwtProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
@Profile("dev")
@Tag(name = "Development", description = "개발용 편의 API (dev 프로필에서만 사용 가능)")
public class DevController {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    @PostMapping("/token")
    @Operation(summary = "테스트용 JWT 토큰 발급",
              description = "소셜 로그인 없이 userId만으로 JWT 토큰을 발급합니다. dev 프로필에서만 사용 가능합니다.")
    public ResponseEntity<TokenResponse> issueTestToken(@RequestParam UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        String accessToken = jwtTokenProvider.createAccessToken(user);
        String refreshTokenValue = jwtTokenProvider.createRefreshToken(user);

        // Refresh token을 DB에 저장 (토큰 갱신 테스트 가능하도록)
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpiry() / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);

        TokenResponse response = TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .accessTokenExpiresIn(jwtProperties.getAccessTokenExpiry())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/user")
    @Operation(summary = "테스트용 사용자 생성",
              description = "테스트용 사용자를 생성합니다. dev 프로필에서만 사용 가능합니다.")
    public ResponseEntity<User> createTestUser(@RequestParam String name,
                                             @RequestParam(required = false) String email) {

        User user = User.builder()
                .name(name)
                .email(email)
                .build();

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }
}