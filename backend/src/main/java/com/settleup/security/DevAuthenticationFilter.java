package com.settleup.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@Profile("dev")
public class DevAuthenticationFilter extends OncePerRequestFilter {

    private static final String DEV_USER_ID_HEADER = "X-Dev-User-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String devUserId = request.getHeader(DEV_USER_ID_HEADER);

        if (StringUtils.hasText(devUserId) && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UUID userId = UUID.fromString(devUserId);
                List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
                Authentication authentication = new UsernamePasswordAuthenticationToken(userId, "", authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Dev authentication bypass: User ID = {}", userId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID format in X-Dev-User-Id header: {}", devUserId);
            }
        }

        filterChain.doFilter(request, response);
    }
}