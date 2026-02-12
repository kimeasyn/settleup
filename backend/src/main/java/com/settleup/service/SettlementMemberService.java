package com.settleup.service;

import com.settleup.domain.settlement.SettlementInviteCode;
import com.settleup.domain.settlement.SettlementMember;
import com.settleup.domain.settlement.SettlementMember.MemberRole;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ForbiddenException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.SettlementInviteCodeRepository;
import com.settleup.repository.SettlementMemberRepository;
import com.settleup.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementMemberService {

    private final SettlementMemberRepository memberRepository;
    private final SettlementInviteCodeRepository inviteCodeRepository;
    private final SettlementRepository settlementRepository;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final int INVITE_EXPIRY_HOURS = 24;

    /**
     * 정산 생성 시 OWNER 멤버 자동 생성
     */
    @Transactional
    public SettlementMember createOwnerMember(UUID settlementId, UUID userId) {
        log.info("Creating owner member: settlementId={}, userId={}", settlementId, userId);

        SettlementMember member = SettlementMember.builder()
                .settlementId(settlementId)
                .userId(userId)
                .role(MemberRole.OWNER)
                .build();

        return memberRepository.save(member);
    }

    /**
     * 정산 멤버 목록 조회
     */
    public List<SettlementMember> getMembers(UUID settlementId) {
        return memberRepository.findBySettlementId(settlementId);
    }

    /**
     * 사용자가 멤버인 정산 목록 (userId로)
     */
    public List<SettlementMember> getMembershipsByUser(UUID userId) {
        return memberRepository.findByUserId(userId);
    }

    /**
     * 멤버십 확인 (없으면 ForbiddenException)
     */
    public void validateMembership(UUID settlementId, UUID userId) {
        if (!memberRepository.existsBySettlementIdAndUserId(settlementId, userId)) {
            throw new ForbiddenException("해당 정산에 접근 권한이 없습니다.");
        }
    }

    /**
     * OWNER 권한 확인
     */
    public void validateOwnership(UUID settlementId, UUID userId) {
        SettlementMember member = memberRepository.findBySettlementIdAndUserId(settlementId, userId)
                .orElseThrow(() -> new ForbiddenException("해당 정산에 접근 권한이 없습니다."));
        if (member.getRole() != MemberRole.OWNER) {
            throw new ForbiddenException("소유자만 이 작업을 수행할 수 있습니다.");
        }
    }

    /**
     * 초대 코드 생성
     */
    @Transactional
    public SettlementInviteCode generateInviteCode(UUID settlementId, UUID creatorUserId) {
        log.info("Generating invite code: settlementId={}, creatorUserId={}", settlementId, creatorUserId);

        if (!settlementRepository.existsById(settlementId)) {
            throw new ResourceNotFoundException("Settlement", "id", settlementId);
        }

        validateMembership(settlementId, creatorUserId);

        String code = generateUniqueCode();

        SettlementInviteCode inviteCode = SettlementInviteCode.builder()
                .settlementId(settlementId)
                .code(code)
                .createdBy(creatorUserId)
                .expiresAt(LocalDateTime.now().plusHours(INVITE_EXPIRY_HOURS))
                .build();

        return inviteCodeRepository.save(inviteCode);
    }

    /**
     * 초대 코드로 참가
     */
    @Transactional
    public SettlementMember joinByInviteCode(String code, UUID userId) {
        log.info("Joining by invite code: code={}, userId={}", code, userId);

        SettlementInviteCode inviteCode = inviteCodeRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException("유효하지 않은 초대 코드입니다."));

        if (inviteCode.isExpired()) {
            throw new BusinessException("만료된 초대 코드입니다.");
        }

        if (inviteCode.isUsed()) {
            throw new BusinessException("이미 사용된 초대 코드입니다.");
        }

        UUID settlementId = inviteCode.getSettlementId();

        // 이미 멤버인지 확인
        if (memberRepository.existsBySettlementIdAndUserId(settlementId, userId)) {
            throw new BusinessException("이미 해당 정산의 멤버입니다.");
        }

        // 멤버 추가
        SettlementMember member = SettlementMember.builder()
                .settlementId(settlementId)
                .userId(userId)
                .role(MemberRole.MEMBER)
                .build();

        SettlementMember saved = memberRepository.save(member);

        // 초대 코드 사용 처리
        inviteCode.setUsedBy(userId);
        inviteCode.setUsedAt(LocalDateTime.now());
        inviteCodeRepository.save(inviteCode);

        return saved;
    }

    /**
     * 고유한 8자리 코드 생성
     */
    private String generateUniqueCode() {
        SecureRandom random = new SecureRandom();
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (inviteCodeRepository.findByCode(code).isEmpty()) {
                return code;
            }
        }
        throw new RuntimeException("초대 코드 생성에 실패했습니다.");
    }
}
