package com.settleup.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SocialLoginRequest {
    @NotBlank(message = "토큰은 필수입니다")
    private String token;
}