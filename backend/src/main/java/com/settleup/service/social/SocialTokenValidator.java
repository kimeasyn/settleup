package com.settleup.service.social;

public interface SocialTokenValidator {
    SocialUserInfo validateToken(String token);
    String getProvider();
}