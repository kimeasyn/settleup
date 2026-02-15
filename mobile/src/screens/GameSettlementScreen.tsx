import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  GameRoundWithEntries,
  GameRoundEntry,
  ParticipantGameStatus,
  GameSettlementResult,
} from '../models/GameSettlement';
import { Settlement, SettlementStatus, UpdateSettlementRequest } from '../models/Settlement';
import { Participant, AddParticipantRequest } from '../models/Participant';
import AnimatedButton from '../components/AnimatedButton';
import EditSettlementModal from '../components/EditSettlementModal';
import AddParticipantModal from '../components/AddParticipantModal';

import { localGameSettlementService } from '../services/api/gameSettlementService';
import { getSettlement, getParticipants, deleteSettlement, updateSettlement, getSettlementMembers, generateInviteCode, addParticipant, toggleParticipantStatus, deleteParticipant } from '../services/api/settlementService';
import { SettlementMember } from '../models/SettlementMember';
import {
  calculateParticipantGameStatus,
  calculateGameSettlementResult,
  validateRound,
  initializeRoundEntries,
  formatGameAmount,
  createGameSummary,
} from '../utils/gameSettlementUtils';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

/**
 * GameSettlementScreen
 * 게임 정산 메인 화면 - 라운드별 금액 입출 기록 및 최종 정산
 */
export default function GameSettlementScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { settlementId } = route.params as { settlementId: string };

  // 상태 관리
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [gameRounds, setGameRounds] = useState<GameRoundWithEntries[]>([]);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [participantStatus, setParticipantStatus] = useState<ParticipantGameStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameResult, setGameResult] = useState<GameSettlementResult | null>(null);
  const [editSettlementModalVisible, setEditSettlementModalVisible] = useState(false);
  const [addParticipantModalVisible, setAddParticipantModalVisible] = useState(false);
  const [members, setMembers] = useState<SettlementMember[]>([]);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    try {
      if (!settlement) setLoading(true);

      // 정산 정보 및 참가자 로드
      const [settlementData, participantsData] = await Promise.all([
        getSettlement(settlementId),
        getParticipants(settlementId),
      ]);

      setSettlement(settlementData);
      setParticipants(participantsData);

      // 멤버 로드 (실패해도 무시)
      try {
        const membersData = await getSettlementMembers(settlementId);
        setMembers(membersData);
      } catch {}

      // 게임 라운드 로드
      const gameRoundsData = await localGameSettlementService.getLocalGameRounds(settlementId);
      setGameRounds(gameRoundsData);

      // 참가자별 게임 현황 계산
      const status = calculateParticipantGameStatus(participantsData, gameRoundsData);
      setParticipantStatus(status);

      // 게임 결과 계산
      if (gameRoundsData.length > 0) {
        const result = calculateGameSettlementResult(
          settlementId,
          participantsData,
          gameRoundsData,
          settlementData.createdAt
        );
        setGameResult(result);
      }
    } catch (error) {
      console.error('게임 정산 데이터 로드 실패:', error);
      Alert.alert('오류', '데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새로고침
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [settlementId]);

  /**
   * 화면 포커스 시 데이터 새로고침
   */
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [settlementId])
  );

  /**
   * 새 라운드 추가
   */
  const handleAddRound = async () => {
    try {
      const newRound = await localGameSettlementService.createLocalRound(settlementId);
      await loadData();
      setExpandedRoundId(newRound.id);
    } catch (error) {
      console.error('라운드 생성 실패:', error);
      Alert.alert('오류', '라운드를 생성할 수 없습니다.');
    }
  };

  /**
   * 정산 정보 수정
   */
  const handleUpdateSettlement = async (data: UpdateSettlementRequest) => {
    try {
      await updateSettlement(settlementId, data);
      await loadData();
    } catch (error) {
      console.error('정산 수정 실패:', error);
      throw error;
    }
  };

  /**
   * 정산 삭제
   */
  const handleDeleteSettlement = () => {
    Alert.alert(
      '정산 삭제',
      `"${settlement?.title}"을(를) 삭제하시겠습니까?\n관련된 모든 데이터가 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSettlement(settlementId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('오류', '정산을 삭제할 수 없습니다.');
            }
          },
        },
      ],
    );
  };

  /**
   * 라운드 삭제
   */
  const handleDeleteRound = async (roundId: string) => {
    Alert.alert(
      '라운드 삭제',
      '정말로 이 라운드를 삭제하시겠습니까?\n입력된 모든 데이터가 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await localGameSettlementService.deleteLocalRound(settlementId, roundId);
              if (expandedRoundId === roundId) {
                setExpandedRoundId(null);
              }
              await loadData();
            } catch (error) {
              console.error('라운드 삭제 실패:', error);
              Alert.alert('오류', '라운드를 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * 참가자 추가
   */
  const handleAddParticipant = async (data: AddParticipantRequest) => {
    try {
      await addParticipant(settlementId, data);
      await loadData();
    } catch (error) {
      console.error('참가자 추가 실패:', error);
      throw error;
    }
  };

  /**
   * 참가자 활성/비활성 토글
   */
  const handleToggleParticipant = async (participantId: string, currentIsActive: boolean) => {
    try {
      await toggleParticipantStatus(settlementId, participantId, !currentIsActive);
      await loadData();
    } catch (error) {
      console.error('참가자 상태 변경 실패:', error);
      Alert.alert('오류', '참가자 상태를 변경할 수 없습니다.');
    }
  };

  /**
   * 참가자 삭제
   */
  const handleDeleteParticipant = (participantId: string, name: string) => {
    Alert.alert(
      '참가자 삭제',
      `"${name}"을(를) 삭제하시겠습니까?\n관련된 모든 기록이 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParticipant(settlementId, participantId);
              await loadData();
            } catch (error) {
              Alert.alert('오류', '참가자를 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  /**
   * 라운드 엔트리 업데이트
   */
  const handleUpdateRoundEntries = async (
    roundId: string,
    entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[],
    excludedParticipantIds?: string[]
  ) => {
    try {
      await localGameSettlementService.updateLocalRoundEntries(settlementId, roundId, entries, excludedParticipantIds);
      await loadData();
    } catch (error) {
      console.error('라운드 엔트리 업데이트 실패:', error);
      Alert.alert('오류', '라운드 데이터를 저장할 수 없습니다.');
    }
  };

  /**
   * Winner 텍스트 반환
   */
  const getWinnerText = (round: GameRoundWithEntries): string => {
    if (!round.entries || round.entries.length === 0) return '미입력';
    const positiveEntries = round.entries.filter(e => e.amount > 0);
    if (positiveEntries.length === 0) return '미입력';
    const winner = positiveEntries.reduce((max, e) => e.amount > max.amount ? e : max, positiveEntries[0]);
    const excludedCount = round.excludedParticipantIds?.length || 0;
    const excludedSuffix = excludedCount > 0 ? ` (${excludedCount}명 불참)` : '';
    return `Winner: ${winner.participantName} ${formatGameAmount(winner.amount)}원${excludedSuffix}`;
  };

  /**
   * 아코디언 토글
   */
  const toggleAccordion = (roundId: string) => {
    setExpandedRoundId(prev => prev === roundId ? null : roundId);
  };

  const isCompleted = settlement?.status === SettlementStatus.COMPLETED;

  const handleInvite = async () => {
    try {
      const invite = await generateInviteCode(settlementId);
      Alert.alert(
        '초대 코드',
        `초대 코드: ${invite.code}\n\n유효 기간: 24시간\n이 코드를 공유하여 멤버를 초대하세요.`,
        [{ text: '확인' }]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || '초대 코드 생성에 실패했습니다.';
      Alert.alert('오류', message);
    }
  };

  /**
   * 정산 완료/다시 열기 토글
   */
  const handleToggleComplete = () => {
    if (isCompleted) {
      Alert.alert(
        '정산 다시 열기',
        '정산을 다시 열면 수정이 가능합니다. 계속하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '다시 열기',
            onPress: async () => {
              try {
                await updateSettlement(settlementId, { status: SettlementStatus.ACTIVE });
                await loadData();
              } catch (error) {
                Alert.alert('오류', '정산 상태를 변경할 수 없습니다.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        '정산 완료',
        '정산을 완료하시겠습니까?\n완료 후에는 수정할 수 없습니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '완료',
            onPress: async () => {
              try {
                await updateSettlement(settlementId, { status: SettlementStatus.COMPLETED });
                await loadData();
              } catch (error) {
                Alert.alert('오류', '정산 상태를 변경할 수 없습니다.');
              }
            },
          },
        ]
      );
    }
  };

  /**
   * 최종 정산 실행
   */
  const handleFinalSettlement = () => {
    if (!gameResult) return;

    navigation.navigate('GameSettlementResult', {
      settlementId,
      gameResult,
    });
  };

  /**
   * 게임 요약 정보 렌더링
   */
  const renderGameSummary = () => {
    if (participantStatus.length === 0) return null;

    const summary = createGameSummary(participantStatus, gameRounds.length);

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>게임 현황</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>총 라운드</Text>
          <Text style={styles.summaryValue}>{summary.totalRounds}라운드</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>참가자</Text>
          <Text style={styles.summaryValue}>{summary.totalParticipants}명</Text>
        </View>
        {summary.biggestWinner && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>최고 수익</Text>
            <Text style={[styles.summaryValue, styles.positiveAmount]}>
              {summary.biggestWinner.participantName} {formatGameAmount(summary.biggestWinner.totalAmount)}원
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * 참가자 현황 렌더링
   */
  const renderParticipantStatus = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.sectionTitle}>참가자 현황</Text>
      {participantStatus.map(status => (
        <View key={status.participantId} style={styles.statusItem}>
          <Text style={styles.participantName}>{status.participantName}</Text>
          <Text
            style={[
              styles.participantAmount,
              status.totalAmount > 0
                ? styles.positiveAmount
                : status.totalAmount < 0
                  ? styles.negativeAmount
                  : styles.zeroAmount,
            ]}
          >
            {formatGameAmount(status.totalAmount)}원
          </Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 헤더 카드 */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>{settlement?.title}</Text>
          <Text style={styles.subtitle}>게임 정산</Text>
          {settlement?.description && (
            <Text style={styles.description}>{settlement.description}</Text>
          )}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.completeToggleBtn, isCompleted ? styles.reopenBtn : styles.completeBtn]}
              onPress={handleToggleComplete}
            >
              <Text style={styles.completeBtnText}>
                {isCompleted ? '다시 열기' : '정산 완료'}
              </Text>
            </TouchableOpacity>
          </View>
          {!isCompleted && (
            <View style={[styles.headerActions, { marginTop: 8 }]}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditSettlementModalVisible(true)}
              >
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSettlement}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedBadgeContainer}>
              <Text style={styles.completedBadgeText}>정산 완료됨</Text>
            </View>
          )}
        </View>

        {/* 참가자 관리 */}
        {!isCompleted && (
          <View style={styles.participantManagementSection}>
            <View style={styles.participantManagementHeader}>
              <Text style={styles.sectionTitle}>참가자</Text>
              <TouchableOpacity
                style={styles.addParticipantBtn}
                onPress={() => setAddParticipantModalVisible(true)}
              >
                <Text style={styles.addParticipantBtnText}>+ 추가</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.participantChipContainer}>
              {participants.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.participantChip, !p.isActive && styles.participantChipInactive]}
                  onPress={() => handleToggleParticipant(p.id, p.isActive)}
                  onLongPress={() => handleDeleteParticipant(p.id, p.name)}
                >
                  <View style={[styles.chipDot, p.isActive ? styles.chipDotActive : styles.chipDotInactive]} />
                  <Text style={[styles.chipText, !p.isActive && styles.chipTextInactive]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 게임 요약 */}
        {renderGameSummary()}

        {/* 참가자 현황 */}
        {participantStatus.length > 0 && renderParticipantStatus()}

        {/* 라운드 아코디언 */}
        {gameRounds.length > 0 ? (
          gameRounds.map(round => (
            <View key={round.round.id} style={styles.accordionItem}>
              {/* 아코디언 헤더 */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleAccordion(round.round.id)}
              >
                <View style={[
                  styles.accordionHeader,
                  expandedRoundId === round.round.id && styles.accordionHeaderExpanded,
                ]}>
                  <View style={styles.accordionTitleRow}>
                    <Text style={styles.accordionTitle}>{round.round.title}</Text>
                    <Text style={[
                      styles.accordionSubtitle,
                      round.entries.some(e => e.amount > 0) && styles.accordionWinnerText,
                    ]}>
                      {getWinnerText(round)}
                    </Text>
                  </View>
                  <View style={styles.accordionIcons}>
                    {round.isValid && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={Colors.status.success}
                      />
                    )}
                    <MaterialCommunityIcons
                      name={expandedRoundId === round.round.id ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={Colors.text.hint}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* 아코디언 바디 */}
              {expandedRoundId === round.round.id && (
                <View style={styles.accordionBody}>
                  <RoundEntryForm
                    round={round}
                    participants={participants}
                    onUpdateEntries={handleUpdateRoundEntries}
                    onDeleteRound={handleDeleteRound}
                    disabled={isCompleted}
                  />
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyRounds}>
            <MaterialCommunityIcons
              name="cards-playing-outline"
              size={48}
              color={Colors.text.disabled}
            />
            <Text style={styles.emptyRoundsText}>라운드를 추가해보세요</Text>
          </View>
        )}

        {/* 액션 버튼 */}
        <View style={styles.actionButtons}>
          {!isCompleted && (
            <AnimatedButton
              title="+ 라운드 추가"
              onPress={handleAddRound}
              variant="secondary"
              size="medium"
              feedbackType="scale"
              style={styles.addButton}
            />
          )}

          {gameRounds.length > 0 && gameResult && !isCompleted && (
            <AnimatedButton
              title="최종 정산"
              onPress={handleFinalSettlement}
              variant="primary"
              size="medium"
              feedbackType="pulse"
              style={styles.finalButton}
            />
          )}
        </View>
      </ScrollView>

      {/* 정산 수정 모달 */}
      {settlement && (
        <EditSettlementModal
          visible={editSettlementModalVisible}
          settlement={settlement}
          onClose={() => setEditSettlementModalVisible(false)}
          onSubmit={handleUpdateSettlement}
        />
      )}

      {/* 참가자 추가 모달 */}
      <AddParticipantModal
        visible={addParticipantModalVisible}
        onClose={() => setAddParticipantModalVisible(false)}
        onSubmit={handleAddParticipant}
      />
    </View>
  );
}

/**
 * 라운드 엔트리 입력 폼 컴포넌트
 */
interface RoundEntryFormProps {
  round: GameRoundWithEntries;
  participants: Participant[];
  onUpdateEntries: (roundId: string, entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[], excludedParticipantIds?: string[]) => void | Promise<void>;
  onDeleteRound: (roundId: string) => void;
  disabled?: boolean;
}

const RoundEntryForm: React.FC<RoundEntryFormProps> = ({
  round,
  participants,
  onUpdateEntries,
  onDeleteRound,
  disabled = false,
}) => {
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set(round.excludedParticipantIds || []));
  const [winnerIds, setWinnerIds] = useState<Set<string>>(new Set());
  const [winnerAmounts, setWinnerAmounts] = useState<{ [participantId: string]: string }>({});

  const activeParticipants = participants.filter(p => p.isActive);
  const includedParticipants = activeParticipants.filter(p => !excludedIds.has(p.id));
  const losers = includedParticipants.filter(p => !winnerIds.has(p.id));

  // 기존 엔트리에서 승리자/금액 복원
  useEffect(() => {
    setExcludedIds(new Set(round.excludedParticipantIds || []));

    const winners = new Set<string>();
    const amounts: { [id: string]: string } = {};

    round.entries.forEach(entry => {
      if (entry.amount > 0) {
        winners.add(entry.participantId);
        amounts[entry.participantId] = entry.amount.toString();
      }
    });

    setWinnerIds(winners);
    setWinnerAmounts(amounts);
  }, [round, participants]);

  // 참가자 제외 토글
  const handleToggleExclude = (participantId: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
        // 제외 시 승리자에서도 제거
        setWinnerIds(prevW => {
          const nextW = new Set(prevW);
          nextW.delete(participantId);
          return nextW;
        });
        setWinnerAmounts(prevA => {
          const nextA = { ...prevA };
          delete nextA[participantId];
          return nextA;
        });
      }
      return next;
    });
  };

  // 승리자 토글
  const handleToggleWinner = (participantId: string) => {
    setWinnerIds(prev => {
      const next = new Set(prev);
      if (next.has(participantId)) {
        next.delete(participantId);
        setWinnerAmounts(prevA => {
          const nextA = { ...prevA };
          delete nextA[participantId];
          return nextA;
        });
      } else {
        next.add(participantId);
      }
      return next;
    });
  };

  // 승리 금액 입력
  const handleWinnerAmountChange = (participantId: string, value: string) => {
    const cleaned = value.replace(/^0+(\d)/, '$1');
    setWinnerAmounts(prev => ({ ...prev, [participantId]: cleaned }));
  };

  // 총 승리 금액
  const totalWinnings = Array.from(winnerIds).reduce((sum, id) => {
    return sum + (Math.round(parseFloat(winnerAmounts[id] || '0')) || 0);
  }, 0);

  // 패자 1인당 금액
  const loserCount = losers.length;
  const perLoserLoss = loserCount > 0 ? Math.floor(totalWinnings / loserCount) : 0;
  const loserRemainder = loserCount > 0 ? totalWinnings - perLoserLoss * loserCount : 0;

  // 저장 처리
  const handleSave = () => {
    if (winnerIds.size === 0) {
      Alert.alert('입력 오류', '승리자를 선택해주세요.');
      return;
    }

    const hasInvalidWinner = Array.from(winnerIds).some(id => {
      const amount = Math.round(parseFloat(winnerAmounts[id] || '0')) || 0;
      return amount <= 0;
    });
    if (hasInvalidWinner) {
      Alert.alert('입력 오류', '승리자의 금액을 입력해주세요.');
      return;
    }

    if (loserCount === 0) {
      Alert.alert('입력 오류', '패배자가 최소 1명 이상이어야 합니다.');
      return;
    }

    // 엔트리 생성
    const entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[] = [];

    // 승리자 엔트리
    includedParticipants.forEach(p => {
      if (winnerIds.has(p.id)) {
        entries.push({
          roundId: round.round.id,
          participantId: p.id,
          participantName: p.name,
          amount: Math.round(parseFloat(winnerAmounts[p.id] || '0')) || 0,
        });
      }
    });

    // 패배자 엔트리 (균등 분배, 나머지는 앞에서부터 1원씩)
    losers.forEach((p, index) => {
      const loss = index < loserRemainder ? perLoserLoss + 1 : perLoserLoss;
      entries.push({
        roundId: round.round.id,
        participantId: p.id,
        participantName: p.name,
        amount: -loss,
      });
    });

    const excludedArray = Array.from(excludedIds);
    return onUpdateEntries(round.round.id, entries, excludedArray.length > 0 ? excludedArray : undefined);
  };

  return (
    <View style={styles.roundForm}>
      <View style={styles.roundFormHeader}>
        <Text style={styles.roundFormTitle}>{round.round.title}</Text>
        {!disabled && (
          <TouchableOpacity
            style={styles.deleteRoundButton}
            onPress={() => onDeleteRound(round.round.id)}
          >
            <Text style={styles.deleteRoundButtonText}>삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 참가자 선택 체크박스 */}
      {activeParticipants.length > 0 && (
        <View style={styles.roundParticipantSelection}>
          <Text style={styles.roundParticipantSelectionLabel}>참가자 선택</Text>
          <View style={styles.checkboxContainer}>
            {activeParticipants.map(participant => {
              const isIncluded = !excludedIds.has(participant.id);
              return (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.checkboxRow}
                  onPress={() => handleToggleExclude(participant.id)}
                  disabled={disabled}
                >
                  <MaterialCommunityIcons
                    name={isIncluded ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={isIncluded ? Colors.primary.main : Colors.text.disabled}
                  />
                  <Text style={[
                    styles.checkboxLabel,
                    !isIncluded && styles.checkboxLabelExcluded,
                  ]}>
                    {participant.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 승리자 선택 & 금액 입력 */}
      <Text style={styles.roundParticipantSelectionLabel}>승리자 & 금액</Text>
      {includedParticipants.map(participant => {
        const isWinner = winnerIds.has(participant.id);
        return (
          <View key={participant.id} style={styles.winnerRow}>
            <TouchableOpacity
              style={[styles.winnerToggle, isWinner && styles.winnerToggleActive]}
              onPress={() => handleToggleWinner(participant.id)}
              disabled={disabled}
            >
              <MaterialCommunityIcons
                name={isWinner ? 'trophy' : 'account-outline'}
                size={18}
                color={isWinner ? '#FFFFFF' : Colors.text.hint}
              />
              <Text style={[styles.winnerToggleText, isWinner && styles.winnerToggleTextActive]}>
                {participant.name}
              </Text>
            </TouchableOpacity>
            {isWinner && (
              <View style={styles.winnerAmountContainer}>
                <TextInput
                  style={styles.amountInput}
                  value={winnerAmounts[participant.id] ?? ''}
                  onChangeText={(value) => handleWinnerAmountChange(participant.id, value)}
                  keyboardType="numeric"
                  placeholder="0"
                  editable={!disabled}
                />
                <Text style={styles.amountUnit}>원</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* 정산 미리보기 */}
      {totalWinnings > 0 && loserCount > 0 && (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>정산 미리보기</Text>
          {includedParticipants.map((p, idx) => {
            let amount: number;
            if (winnerIds.has(p.id)) {
              amount = Math.round(parseFloat(winnerAmounts[p.id] || '0')) || 0;
            } else {
              const loserIdx = losers.findIndex(l => l.id === p.id);
              amount = -(loserIdx < loserRemainder ? perLoserLoss + 1 : perLoserLoss);
            }
            return (
              <View key={p.id} style={styles.previewRow}>
                <Text style={styles.previewName}>{p.name}</Text>
                <Text style={[
                  styles.previewAmount,
                  amount > 0 ? styles.positiveAmount : amount < 0 ? styles.negativeAmount : styles.zeroAmount,
                ]}>
                  {formatGameAmount(amount)}원
                </Text>
              </View>
            );
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>총합</Text>
            <Text style={[styles.totalAmount, styles.validTotal]}>0원</Text>
          </View>
        </View>
      )}

      {/* 저장 버튼 */}
      {!disabled && (
        <AnimatedButton
          title="저장"
          onPress={handleSave}
          variant={totalWinnings > 0 && loserCount > 0 ? "success" : "secondary"}
          size="medium"
          feedbackType="pulse"
          style={styles.saveButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
  },
  scrollContent: {
    padding: Spacing.spacing.lg,
    paddingBottom: Spacing.spacing['3xl'],
  },
  headerCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.xl,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  title: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.xs,
  },
  subtitle: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.sm,
  },
  description: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.sm,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.spacing.sm,
    marginTop: Spacing.spacing.md,
  },
  completeToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    alignItems: 'center',
  },
  completeBtn: {
    backgroundColor: Colors.status.success,
  },
  reopenBtn: {
    backgroundColor: Colors.status.warning,
  },
  completeBtnText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  completedBadgeContainer: {
    marginTop: Spacing.spacing.sm,
    backgroundColor: Colors.action.secondary,
    borderRadius: Spacing.radius.md,
    padding: Spacing.spacing.sm,
    alignItems: 'center',
  },
  completedBadgeText: {
    ...Typography.styles.caption,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.main,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.primary.main,
    alignItems: 'center',
  },
  editButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.spacing.lg,
    borderRadius: Spacing.radius.md,
    backgroundColor: Colors.status.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...Typography.styles.button,
    color: Colors.text.inverse,
  },
  summaryContainer: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.xl,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  summaryTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.spacing.sm,
  },
  summaryLabel: {
    ...Typography.styles.body2,
    color: Colors.text.hint,
  },
  summaryValue: {
    ...Typography.styles.body2,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  statusContainer: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.xl,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  sectionTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  participantName: {
    ...Typography.styles.body1,
    color: Colors.text.primary,
  },
  participantAmount: {
    ...Typography.styles.body1,
    fontWeight: Typography.fontWeight.semibold,
  },
  positiveAmount: {
    color: Colors.status.success,
  },
  negativeAmount: {
    color: Colors.status.error,
  },
  zeroAmount: {
    color: Colors.text.disabled,
  },
  accordionItem: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    marginBottom: Spacing.spacing.md,
    ...createShadowStyle('sm'),
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.spacing.lg,
  },
  accordionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  accordionTitleRow: {
    flex: 1,
    marginRight: Spacing.spacing.md,
  },
  accordionTitle: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
  },
  accordionSubtitle: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.xs,
  },
  accordionWinnerText: {
    color: Colors.status.success,
  },
  accordionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spacing.sm,
  },
  accordionBody: {
    padding: Spacing.spacing.lg,
  },
  emptyRounds: {
    alignItems: 'center',
    paddingVertical: Spacing.spacing['3xl'],
    marginBottom: Spacing.spacing.lg,
  },
  emptyRoundsText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.md,
  },
  roundForm: {
    // No card styling — handled by accordionItem wrapper
  },
  roundFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spacing.lg,
  },
  roundFormTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
  },
  deleteRoundButton: {
    paddingHorizontal: Spacing.spacing.md,
    paddingVertical: Spacing.spacing.sm,
    backgroundColor: Colors.status.error,
    borderRadius: Spacing.radius.md,
  },
  deleteRoundButtonText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.spacing.md,
  },
  participantLabel: {
    flex: 1,
    ...Typography.styles.body1,
    color: Colors.text.primary,
  },
  amountInput: {
    width: 100,
    padding: Spacing.spacing.sm,
    backgroundColor: Colors.background.elevated,
    borderRadius: Spacing.radius.md,
    textAlign: 'right',
    fontSize: Typography.fontSize.md,
  },
  amountUnit: {
    marginLeft: Spacing.spacing.sm,
    ...Typography.styles.body1,
    color: Colors.text.secondary,
    width: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.spacing.md,
    paddingTop: Spacing.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    ...Typography.styles.body1,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  totalAmount: {
    ...Typography.styles.h4,
    fontWeight: Typography.fontWeight.bold,
  },
  validTotal: {
    color: Colors.status.success,
  },
  invalidTotal: {
    color: Colors.status.error,
  },
  saveButton: {
    marginTop: Spacing.spacing.lg,
  },
  actionButtons: {
    padding: Spacing.spacing.lg,
    gap: Spacing.spacing.md,
  },
  addButton: {
    backgroundColor: Colors.background.elevated,
  },
  finalButton: {
    backgroundColor: Colors.primary.main,
  },
  // 참가자 관리 섹션
  participantManagementSection: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.xl,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
  },
  participantManagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spacing.md,
  },
  addParticipantBtn: {
    paddingHorizontal: Spacing.spacing.md,
    paddingVertical: Spacing.spacing.xs,
    backgroundColor: Colors.primary.main,
    borderRadius: Spacing.radius.md,
  },
  addParticipantBtnText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  participantChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.spacing.sm,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.spacing.md,
    paddingVertical: Spacing.spacing.sm,
    backgroundColor: Colors.background.elevated,
    borderRadius: Spacing.radius.full,
    gap: Spacing.spacing.xs,
  },
  participantChipInactive: {
    backgroundColor: Colors.background.default,
    opacity: 0.7,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipDotActive: {
    backgroundColor: Colors.status.success,
  },
  chipDotInactive: {
    backgroundColor: Colors.text.disabled,
  },
  chipText: {
    ...Typography.styles.body2,
    color: Colors.text.primary,
  },
  chipTextInactive: {
    color: Colors.text.disabled,
    textDecorationLine: 'line-through',
  },
  // 라운드 참가자 체크박스
  roundParticipantSelection: {
    marginBottom: Spacing.spacing.lg,
    paddingBottom: Spacing.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  roundParticipantSelectionLabel: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spacing.xs,
  },
  checkboxLabel: {
    ...Typography.styles.body2,
    color: Colors.text.primary,
  },
  // 승리자 선택 행
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.spacing.sm,
    gap: Spacing.spacing.sm,
  },
  winnerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.spacing.md,
    paddingVertical: Spacing.spacing.sm,
    backgroundColor: Colors.background.elevated,
    borderRadius: Spacing.radius.full,
    gap: Spacing.spacing.xs,
    flex: 1,
  },
  winnerToggleActive: {
    backgroundColor: Colors.status.success,
  },
  winnerToggleText: {
    ...Typography.styles.body2,
    color: Colors.text.primary,
  },
  winnerToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.semibold,
  },
  winnerAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 정산 미리보기
  previewSection: {
    marginTop: Spacing.spacing.lg,
    paddingTop: Spacing.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  previewTitle: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.spacing.xs,
  },
  previewName: {
    ...Typography.styles.body2,
    color: Colors.text.primary,
  },
  previewAmount: {
    ...Typography.styles.body2,
    fontWeight: Typography.fontWeight.semibold,
  },
  checkboxLabelExcluded: {
    color: Colors.text.disabled,
    textDecorationLine: 'line-through',
  },
});
