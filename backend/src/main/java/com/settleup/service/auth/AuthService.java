package com.settleup.service.auth;

import com.settleup.domain.user.*;
import com.settleup.dto.auth.TokenResponse;
import com.settleup.repository.RefreshTokenRepository;
import com.settleup.repository.SocialAccountRepository;
import com.settleup.repository.UserRepository;
import com.settleup.security.JwtProperties;
import com.settleup.security.JwtTokenProvider;
import com.settleup.service.social.SocialTokenValidator;
import com.settleup.service.social.SocialUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final List<SocialTokenValidator> socialTokenValidators;

    public TokenResponse socialLogin(String provider, String token) {
        SocialTokenValidator validator = findValidatorByProvider(provider);
        SocialUserInfo socialUserInfo = validator.validateToken(token);

        User user = findOrCreateUser(socialUserInfo);
        findOrCreateSocialAccount(user, socialUserInfo);

        return generateTokenResponse(user);
    }

    public TokenResponse refreshToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenAndRevokedFalse(refreshTokenValue)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            throw new RuntimeException("Refresh token expired");
        }

        // Refresh token rotation
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        return generateTokenResponse(user);
    }

    public void logout(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        refreshTokenRepository.revokeAllByUser(user);
    }

    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredAndRevoked(LocalDateTime.now());
    }

    private SocialTokenValidator findValidatorByProvider(String provider) {
        return socialTokenValidators.stream()
                .filter(validator -> validator.getProvider().equals(provider))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Unsupported social provider: " + provider));
    }

    private User findOrCreateUser(SocialUserInfo socialUserInfo) {
        // 1. 기존 소셜 계정으로 사용자 찾기
        Optional<SocialAccount> existingSocialAccount = socialAccountRepository
                .findByProviderAndProviderUserId(
                        SocialProvider.valueOf(socialUserInfo.getProvider()),
                        socialUserInfo.getProviderId());

        if (existingSocialAccount.isPresent()) {
            return existingSocialAccount.get().getUser();
        }

        // 2. 이메일로 기존 사용자 찾기 (계정 연동)
        if (socialUserInfo.getEmail() != null) {
            Optional<User> existingUser = userRepository.findByEmail(socialUserInfo.getEmail());
            if (existingUser.isPresent()) {
                return existingUser.get();
            }
        }

        // 3. 새 사용자 생성
        User newUser = User.builder()
                .name(socialUserInfo.getName())
                .email(socialUserInfo.getEmail())
                .build();

        return userRepository.save(newUser);
    }

    private void findOrCreateSocialAccount(User user, SocialUserInfo socialUserInfo) {
        boolean exists = socialAccountRepository.existsByProviderAndProviderUserId(
                SocialProvider.valueOf(socialUserInfo.getProvider()),
                socialUserInfo.getProviderId());

        if (!exists) {
            SocialAccount socialAccount = SocialAccount.builder()
                    .user(user)
                    .provider(SocialProvider.valueOf(socialUserInfo.getProvider()))
                    .providerUserId(socialUserInfo.getProviderId())
                    .providerEmail(socialUserInfo.getEmail())
                    .providerName(socialUserInfo.getName())
                    .build();

            socialAccountRepository.save(socialAccount);
        }
    }

    private TokenResponse generateTokenResponse(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user);
        String refreshTokenValue = jwtTokenProvider.createRefreshToken(user);

        // Refresh token DB 저장
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpiry() / 1000))
                .build();

        refreshTokenRepository.save(refreshToken);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .accessTokenExpiresIn(jwtProperties.getAccessTokenExpiry())
                .userId(user.getId())
                .userName(user.getName())
                .userEmail(user.getEmail())
                .build();
    }
}