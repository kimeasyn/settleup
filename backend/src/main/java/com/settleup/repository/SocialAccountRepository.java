package com.settleup.repository;

import com.settleup.domain.user.SocialAccount;
import com.settleup.domain.user.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SocialAccountRepository extends JpaRepository<SocialAccount, UUID> {

    Optional<SocialAccount> findByProviderAndProviderUserId(SocialProvider provider, String providerUserId);

    Optional<SocialAccount> findByProviderAndProviderEmail(SocialProvider provider, String providerEmail);

    boolean existsByProviderAndProviderUserId(SocialProvider provider, String providerUserId);
}