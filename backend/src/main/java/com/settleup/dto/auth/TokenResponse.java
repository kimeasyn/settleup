package com.settleup.dto.auth;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private long accessTokenExpiresIn;
    private UUID userId;
    private String userName;
    private String userEmail;
}