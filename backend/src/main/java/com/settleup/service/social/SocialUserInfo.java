package com.settleup.service.social;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialUserInfo {
    private String providerId;
    private String email;
    private String name;
    private String provider;
}