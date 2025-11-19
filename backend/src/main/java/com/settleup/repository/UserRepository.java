package com.settleup.repository;

import com.settleup.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * User Repository
 * 사용자 데이터 액세스
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * 이메일로 사용자 조회
     */
    Optional<User> findByEmail(String email);

    /**
     * 이메일 존재 여부 확인
     */
    boolean existsByEmail(String email);

    /**
     * 이름으로 사용자 조회 (부분 일치)
     */
    Optional<User> findByNameContainingIgnoreCase(String name);
}
