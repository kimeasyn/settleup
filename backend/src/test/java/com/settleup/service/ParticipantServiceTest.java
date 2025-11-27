package com.settleup.service;

import com.settleup.domain.participant.Participant;
import com.settleup.dto.ParticipantDto.ParticipantRequest;
import com.settleup.dto.ParticipantDto.ParticipantResponse;
import com.settleup.exception.BusinessException;
import com.settleup.exception.ResourceNotFoundException;
import com.settleup.repository.ParticipantRepository;
import com.settleup.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ParticipantService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ParticipantService 테스트")
class ParticipantServiceTest {

    @Mock
    private ParticipantRepository participantRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @InjectMocks
    private ParticipantService participantService;

    private UUID settlementId;
    private UUID participantId;
    private Participant participant;

    @BeforeEach
    void setUp() {
        settlementId = UUID.randomUUID();
        participantId = UUID.randomUUID();
        participant = Participant.builder()
                .id(participantId)
                .settlementId(settlementId)
                .name("김철수")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("참가자 추가 - 성공")
    void addParticipant_Success() {
        // given
        ParticipantRequest request = ParticipantRequest.builder()
                .name("김철수")
                .userId(null)
                .build();

        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(participantRepository.existsBySettlementIdAndName(settlementId, "김철수")).thenReturn(false);
        when(participantRepository.save(any(Participant.class))).thenReturn(participant);

        // when
        ParticipantResponse response = participantService.addParticipant(settlementId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(participantId);
        assertThat(response.getName()).isEqualTo("김철수");
        assertThat(response.getSettlementId()).isEqualTo(settlementId);
        assertThat(response.getIsActive()).isTrue();

        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(participantRepository, times(1)).existsBySettlementIdAndName(settlementId, "김철수");
        verify(participantRepository, times(1)).save(any(Participant.class));
    }

    @Test
    @DisplayName("참가자 추가 - 정산을 찾을 수 없음")
    void addParticipant_SettlementNotFound() {
        // given
        ParticipantRequest request = ParticipantRequest.builder()
                .name("김철수")
                .build();

        when(settlementRepository.existsById(settlementId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> participantService.addParticipant(settlementId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");

        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(participantRepository, never()).save(any());
    }

    @Test
    @DisplayName("참가자 추가 - 중복된 이름")
    void addParticipant_DuplicateName() {
        // given
        ParticipantRequest request = ParticipantRequest.builder()
                .name("김철수")
                .build();

        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(participantRepository.existsBySettlementIdAndName(settlementId, "김철수")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> participantService.addParticipant(settlementId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("이미")
                .hasMessageContaining("김철수");

        verify(participantRepository, never()).save(any());
    }

    @Test
    @DisplayName("정산의 모든 참가자 조회 - 성공")
    void getParticipantsBySettlement_Success() {
        // given
        Participant participant2 = Participant.builder()
                .id(UUID.randomUUID())
                .settlementId(settlementId)
                .name("이영희")
                .isActive(true)
                .build();

        List<Participant> participants = Arrays.asList(participant, participant2);

        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(participantRepository.findBySettlementId(settlementId)).thenReturn(participants);

        // when
        List<ParticipantResponse> responses = participantService.getParticipantsBySettlement(settlementId);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getName()).isEqualTo("김철수");
        assertThat(responses.get(1).getName()).isEqualTo("이영희");

        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(participantRepository, times(1)).findBySettlementId(settlementId);
    }

    @Test
    @DisplayName("정산의 모든 참가자 조회 - 정산을 찾을 수 없음")
    void getParticipantsBySettlement_SettlementNotFound() {
        // given
        when(settlementRepository.existsById(settlementId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> participantService.getParticipantsBySettlement(settlementId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Settlement");

        verify(settlementRepository, times(1)).existsById(settlementId);
        verify(participantRepository, never()).findBySettlementId(any());
    }

    @Test
    @DisplayName("정산의 모든 참가자 조회 - 빈 목록")
    void getParticipantsBySettlement_EmptyList() {
        // given
        when(settlementRepository.existsById(settlementId)).thenReturn(true);
        when(participantRepository.findBySettlementId(settlementId)).thenReturn(Arrays.asList());

        // when
        List<ParticipantResponse> responses = participantService.getParticipantsBySettlement(settlementId);

        // then
        assertThat(responses).isEmpty();
    }

    @Test
    @DisplayName("참가자 삭제 - 성공")
    void deleteParticipant_Success() {
        // given
        when(participantRepository.existsById(participantId)).thenReturn(true);
        doNothing().when(participantRepository).deleteById(participantId);

        // when
        participantService.deleteParticipant(participantId);

        // then
        verify(participantRepository, times(1)).existsById(participantId);
        verify(participantRepository, times(1)).deleteById(participantId);
    }

    @Test
    @DisplayName("참가자 삭제 - 참가자를 찾을 수 없음")
    void deleteParticipant_NotFound() {
        // given
        when(participantRepository.existsById(participantId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> participantService.deleteParticipant(participantId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Participant");

        verify(participantRepository, times(1)).existsById(participantId);
        verify(participantRepository, never()).deleteById(any());
    }
}
