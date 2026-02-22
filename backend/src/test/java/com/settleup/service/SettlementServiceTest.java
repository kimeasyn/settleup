package com.settleup.service;

import com.settleup.domain.settlement.Settlement;
import com.settleup.domain.settlement.SettlementStatus;
import com.settleup.domain.settlement.SettlementType;
import com.settleup.dto.SettlementCreateRequest;
import com.settleup.dto.SettlementResponse;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.ExpenseRepository;
import com.settleup.repository.ExpenseSplitRepository;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import com.settleup.repository.SettlementResultRepository;
import com.settleup.repository.SettlementMemberRepository;
import com.settleup.repository.SettlementInviteCodeRepository;
import com.settleup.repository.GameRoundRepository;
import com.settleup.repository.GameRoundEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * SettlementService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SettlementService 테스트")
class SettlementServiceTest {

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseSplitRepository expenseSplitRepository;

    @Mock
    private ParticipantRepository participantRepository;

    @Mock
    private SettlementResultRepository settlementResultRepository;

    @Mock
    private SettlementMemberRepository settlementMemberRepository;

    @Mock
    private SettlementInviteCodeRepository settlementInviteCodeRepository;

    @Mock
    private GameRoundRepository gameRoundRepository;

    @Mock
    private GameRoundEntryRepository gameRoundEntryRepository;

    @InjectMocks
    private SettlementService settlementService;

    private UUID settlementId;
    private UUID creatorId;
    private Settlement settlement;

    @BeforeEach
    void setUp() {
        settlementId = UUID.randomUUID();
        creatorId = UUID.randomUUID();
        settlement = Settlement.builder()
                .id(settlementId)
                .title("제주도 여행")
                .description("2박 3일 여행")
                .type(SettlementType.TRAVEL)
                .status(SettlementStatus.ACTIVE)
                .creatorId(creatorId)
                .currency("KRW")
                .startDate(LocalDate.of(2025, 1, 15))
                .endDate(LocalDate.of(2025, 1, 17))
                .build();
    }

    @Test
    @DisplayName("정산 생성 - 성공")
    void createSettlement_Success() {
        // given
        SettlementCreateRequest request = SettlementCreateRequest.builder()
                .title("제주도 여행")
                .description("2박 3일 여행")
                .type(SettlementType.TRAVEL)
                .currency("KRW")
                .startDate(LocalDate.of(2025, 1, 15))
                .endDate(LocalDate.of(2025, 1, 17))
                .build();

        when(settlementRepository.save(any(Settlement.class))).thenReturn(settlement);

        // when
        SettlementResponse response = settlementService.createSettlement(request, creatorId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(settlementId);
        assertThat(response.getTitle()).isEqualTo("제주도 여행");
        assertThat(response.getType()).isEqualTo(SettlementType.TRAVEL);
        assertThat(response.getStatus()).isEqualTo(SettlementStatus.ACTIVE);
        assertThat(response.getCreatorId()).isEqualTo(creatorId);
        assertThat(response.getCurrency()).isEqualTo("KRW");

        verify(settlementRepository, times(1)).save(any(Settlement.class));
    }

    @Test
    @DisplayName("정산 생성 - 통화 기본값 설정")
    void createSettlement_DefaultCurrency() {
        // given
        SettlementCreateRequest request = SettlementCreateRequest.builder()
                .title("게임 정산")
                .type(SettlementType.GAME)
                .currency(null) // null로 설정
                .build();

        Settlement savedSettlement = Settlement.builder()
                .id(UUID.randomUUID())
                .title("게임 정산")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(creatorId)
                .currency("KRW")
                .build();

        when(settlementRepository.save(any(Settlement.class))).thenReturn(savedSettlement);

        // when
        SettlementResponse response = settlementService.createSettlement(request, creatorId);

        // then
        assertThat(response.getCurrency()).isEqualTo("KRW");
    }

    @Test
    @DisplayName("정산 조회 - 성공")
    void getSettlement_Success() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.of(settlement));

        // when
        SettlementResponse response = settlementService.getSettlement(settlementId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(settlementId);
        assertThat(response.getTitle()).isEqualTo("제주도 여행");
        assertThat(response.getType()).isEqualTo(SettlementType.TRAVEL);

        verify(settlementRepository, times(1)).findById(settlementId);
    }

    @Test
    @DisplayName("정산 조회 - 정산을 찾을 수 없음")
    void getSettlement_NotFound() {
        // given
        when(settlementRepository.findById(settlementId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> settlementService.getSettlement(settlementId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");

        verify(settlementRepository, times(1)).findById(settlementId);
    }

    @Test
    @DisplayName("모든 정산 목록 조회 - 성공")
    void getAllSettlements_Success() {
        // given
        Settlement settlement2 = Settlement.builder()
                .id(UUID.randomUUID())
                .title("서울 모임")
                .type(SettlementType.GAME)
                .status(SettlementStatus.ACTIVE)
                .creatorId(creatorId)
                .currency("KRW")
                .build();

        List<Settlement> settlements = Arrays.asList(settlement, settlement2);
        when(settlementRepository.findByUserAccess(creatorId)).thenReturn(settlements);

        // when
        List<SettlementResponse> responses = settlementService.getAllSettlements(creatorId);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getTitle()).isEqualTo("제주도 여행");
        assertThat(responses.get(1).getTitle()).isEqualTo("서울 모임");

        verify(settlementRepository, times(1)).findByUserAccess(creatorId);
    }

    @Test
    @DisplayName("모든 정산 목록 조회 - 빈 목록")
    void getAllSettlements_EmptyList() {
        // given
        when(settlementRepository.findByUserAccess(creatorId)).thenReturn(Arrays.asList());

        // when
        List<SettlementResponse> responses = settlementService.getAllSettlements(creatorId);

        // then
        assertThat(responses).isEmpty();

        verify(settlementRepository, times(1)).findByUserAccess(creatorId);
    }

    @Test
    @DisplayName("정산 목록 조회 - 요약 데이터(총 지출, 참가자 수, 라운드 수) 포함")
    void getAllSettlements_WithSummaryData() {
        // given
        List<Settlement> settlements = Arrays.asList(settlement);
        when(settlementRepository.findByUserAccess(creatorId)).thenReturn(settlements);

        Object[] expenseRow = {settlementId, new BigDecimal("50000")};
        when(expenseRepository.sumAmountBySettlementIds(List.of(settlementId)))
                .thenReturn(List.<Object[]>of(expenseRow));

        Object[] participantRow = {settlementId, 3L};
        when(participantRepository.countActiveBySettlementIds(List.of(settlementId)))
                .thenReturn(List.<Object[]>of(participantRow));

        Object[] roundRow = {settlementId, 5L};
        when(gameRoundRepository.countBySettlementIds(List.of(settlementId)))
                .thenReturn(List.<Object[]>of(roundRow));

        // when
        List<SettlementResponse> responses = settlementService.getAllSettlements(creatorId);

        // then
        assertThat(responses).hasSize(1);
        SettlementResponse response = responses.get(0);
        assertThat(response.getTotalExpense()).isEqualByComparingTo(new BigDecimal("50000"));
        assertThat(response.getParticipantCount()).isEqualTo(3);
        assertThat(response.getRoundCount()).isEqualTo(5);

        verify(expenseRepository, times(1)).sumAmountBySettlementIds(Arrays.asList(settlementId));
        verify(participantRepository, times(1)).countActiveBySettlementIds(Arrays.asList(settlementId));
        verify(gameRoundRepository, times(1)).countBySettlementIds(Arrays.asList(settlementId));
    }

    @Test
    @DisplayName("정산 삭제 - 성공")
    void deleteSettlement_Success() {
        // given
        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(gameRoundRepository.findBySettlementIdOrderByRoundNumberAsc(settlementId))
                .thenReturn(Arrays.asList());
        when(expenseRepository.findBySettlementIdOrderByExpenseDateDesc(settlementId))
                .thenReturn(Arrays.asList());
        doNothing().when(settlementInviteCodeRepository).deleteBySettlementId(settlementId);
        doNothing().when(settlementMemberRepository).deleteBySettlementId(settlementId);
        doNothing().when(settlementResultRepository).deleteBySettlementId(settlementId);
        doNothing().when(expenseRepository).deleteBySettlementId(settlementId);
        doNothing().when(participantRepository).deleteBySettlementId(settlementId);
        doNothing().when(settlementRepository).deleteById(settlementId);

        // when
        settlementService.deleteSettlement(settlementId);

        // then
        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(settlementInviteCodeRepository, times(1)).deleteBySettlementId(settlementId);
        verify(settlementMemberRepository, times(1)).deleteBySettlementId(settlementId);
        verify(settlementResultRepository, times(1)).deleteBySettlementId(settlementId);
        verify(expenseRepository, times(1)).findBySettlementIdOrderByExpenseDateDesc(settlementId);
        verify(expenseRepository, times(1)).deleteBySettlementId(settlementId);
        verify(participantRepository, times(1)).deleteBySettlementId(settlementId);
        verify(settlementRepository, times(1)).deleteById(settlementId);
    }

    @Test
    @DisplayName("정산 삭제 - 정산을 찾을 수 없음")
    void deleteSettlement_NotFound() {
        // given
        when(settlementRepository.existsById(settlementId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> settlementService.deleteSettlement(settlementId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");

        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(settlementRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("정산 검색 - 검색어로 조회 성공")
    void searchSettlements_ByQuery_Success() {
        // given
        String query = "제주도";
        Pageable pageable = PageRequest.of(0, 20);

        Settlement settlement2 = Settlement.builder()
                .id(UUID.randomUUID())
                .title("제주도 가족여행")
                .type(SettlementType.TRAVEL)
                .status(SettlementStatus.COMPLETED)
                .creatorId(creatorId)
                .currency("KRW")
                .build();

        List<Settlement> settlements = Arrays.asList(settlement, settlement2);
        Page<Settlement> settlementPage = new PageImpl<>(settlements, pageable, 2);

        when(settlementRepository.findByUserAccessAndQuery(eq(creatorId), eq(query), any(Pageable.class)))
                .thenReturn(settlementPage);

        // when
        Page<SettlementResponse> result = settlementService.searchSettlements(creatorId, query, null, null, 0, 20);

        // then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent().get(0).getTitle()).contains("제주도");
        assertThat(result.getContent().get(1).getTitle()).contains("제주도");

        verify(settlementRepository, times(1))
                .findByUserAccessAndQuery(eq(creatorId), eq(query), any(Pageable.class));
    }

    @Test
    @DisplayName("정산 검색 - 상태 필터링 성공")
    void searchSettlements_ByStatus_Success() {
        // given
        SettlementStatus status = SettlementStatus.ACTIVE;
        Pageable pageable = PageRequest.of(0, 20);

        List<Settlement> settlements = Arrays.asList(settlement);
        Page<Settlement> settlementPage = new PageImpl<>(settlements, pageable, 1);

        when(settlementRepository.findByUserAccessAndStatus(eq(creatorId), eq(status), any(Pageable.class)))
                .thenReturn(settlementPage);

        // when
        Page<SettlementResponse> result = settlementService.searchSettlements(creatorId, null, status, null, 0, 20);

        // then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(SettlementStatus.ACTIVE);

        verify(settlementRepository, times(1))
                .findByUserAccessAndStatus(eq(creatorId), eq(status), any(Pageable.class));
    }

    @Test
    @DisplayName("정산 검색 - 전체 조회 성공")
    void searchSettlements_NoFilter_Success() {
        // given
        Pageable pageable = PageRequest.of(0, 20);

        Settlement settlement2 = Settlement.builder()
                .id(UUID.randomUUID())
                .title("서울 모임")
                .type(SettlementType.GAME)
                .status(SettlementStatus.COMPLETED)
                .creatorId(creatorId)
                .currency("KRW")
                .build();

        List<Settlement> settlements = Arrays.asList(settlement, settlement2);
        Page<Settlement> settlementPage = new PageImpl<>(settlements, pageable, 2);

        when(settlementRepository.findByUserAccessPaged(eq(creatorId), any(Pageable.class)))
                .thenReturn(settlementPage);

        // when
        Page<SettlementResponse> result = settlementService.searchSettlements(creatorId, null, null, null, 0, 20);

        // then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);

        verify(settlementRepository, times(1))
                .findByUserAccessPaged(eq(creatorId), any(Pageable.class));
    }
}
