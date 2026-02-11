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
import { Participant } from '../models/Participant';
import AnimatedButton from '../components/AnimatedButton';
import EditSettlementModal from '../components/EditSettlementModal';

import { localGameSettlementService } from '../services/api/gameSettlementService';
import { getSettlement, getParticipants, deleteSettlement, updateSettlement, getSettlementMembers, generateInviteCode } from '../services/api/settlementService';
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
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [participantStatus, setParticipantStatus] = useState<ParticipantGameStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gameResult, setGameResult] = useState<GameSettlementResult | null>(null);
  const [editSettlementModalVisible, setEditSettlementModalVisible] = useState(false);
  const [members, setMembers] = useState<SettlementMember[]>([]);

  // 현재 라운드
  const currentRound = gameRounds[currentRoundIndex];

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    try {
      setLoading(true);

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
      setCurrentRoundIndex(gameRounds.length); // 새 라운드로 이동
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
              await loadData();

              // 현재 인덱스 조정
              if (currentRoundIndex >= gameRounds.length - 1) {
                setCurrentRoundIndex(Math.max(0, gameRounds.length - 2));
              }
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
   * 라운드 엔트리 업데이트
   */
  const handleUpdateRoundEntries = async (
    roundId: string,
    entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[]
  ) => {
    try {
      await localGameSettlementService.updateLocalRoundEntries(settlementId, roundId, entries);
      await loadData();
    } catch (error) {
      console.error('라운드 엔트리 업데이트 실패:', error);
      Alert.alert('오류', '라운드 데이터를 저장할 수 없습니다.');
    }
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

        {/* 게임 요약 */}
        {renderGameSummary()}

        {/* 참가자 현황 */}
        {participantStatus.length > 0 && renderParticipantStatus()}

        {/* 라운드 탭 */}
        {gameRounds.length > 0 ? (
          <View style={styles.roundTabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {gameRounds.map((round, index) => (
                <TouchableOpacity
                  key={round.round.id}
                  style={[
                    styles.roundTab,
                    index === currentRoundIndex && styles.roundTabActive,
                    round.isValid && styles.roundTabValid,
                  ]}
                  onPress={() => setCurrentRoundIndex(index)}
                >
                  <Text
                    style={[
                      styles.roundTabText,
                      index === currentRoundIndex && styles.roundTabTextActive,
                    ]}
                  >
                    {round.round.title}
                  </Text>
                  {round.isValid && <Text style={styles.validIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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

        {/* 현재 라운드 입력 */}
        {currentRound && (
          <RoundEntryForm
            round={currentRound}
            participants={participants}
            onUpdateEntries={handleUpdateRoundEntries}
            onDeleteRound={handleDeleteRound}
          />
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

          {gameRounds.length > 0 && gameResult && (
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
    </View>
  );
}

/**
 * 라운드 엔트리 입력 폼 컴포넌트
 */
interface RoundEntryFormProps {
  round: GameRoundWithEntries;
  participants: Participant[];
  onUpdateEntries: (roundId: string, entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[]) => void;
  onDeleteRound: (roundId: string) => void;
}

const RoundEntryForm: React.FC<RoundEntryFormProps> = ({
  round,
  participants,
  onUpdateEntries,
  onDeleteRound,
}) => {
  const [entryInputs, setEntryInputs] = useState<{ [participantId: string]: string }>({});

  // 초기 값 설정
  useEffect(() => {
    const initialInputs: { [participantId: string]: string } = {};
    participants
      .filter(p => p.isActive)
      .forEach(participant => {
        const existingEntry = round.entries.find(e => e.participantId === participant.id);
        initialInputs[participant.id] = existingEntry?.amount.toString() || '0';
      });
    setEntryInputs(initialInputs);
  }, [round, participants]);

  /**
   * 입력값 변경 처리
   */
  const handleInputChange = (participantId: string, value: string) => {
    setEntryInputs(prev => ({
      ...prev,
      [participantId]: value,
    }));
  };

  /**
   * 저장 처리
   */
  const handleSave = () => {
    const entries: Omit<GameRoundEntry, 'id' | 'createdAt'>[] = participants
      .filter(p => p.isActive)
      .map(participant => {
        const amountStr = entryInputs[participant.id] || '0';
        const amount = parseFloat(amountStr) || 0;

        return {
          roundId: round.round.id,
          participantId: participant.id,
          participantName: participant.name,
          amount,
        };
      });

    // 유효성 검사
    const validation = validateRound(
      entries as GameRoundEntry[],
      participants.filter(p => p.isActive)
    );

    if (!validation.isValid) {
      Alert.alert('입력 오류', validation.errorMessage || '올바르지 않은 입력입니다.');
      return;
    }

    onUpdateEntries(round.round.id, entries);
  };

  // 총합 계산
  const totalAmount = Object.values(entryInputs).reduce((sum, value) => {
    return sum + (parseFloat(value) || 0);
  }, 0);

  return (
    <View style={styles.roundForm}>
      <View style={styles.roundFormHeader}>
        <Text style={styles.roundFormTitle}>{round.round.title}</Text>
        <TouchableOpacity
          style={styles.deleteRoundButton}
          onPress={() => onDeleteRound(round.round.id)}
        >
          <Text style={styles.deleteRoundButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 참가자별 입력 */}
      {participants
        .filter(p => p.isActive)
        .map(participant => (
          <View key={participant.id} style={styles.entryRow}>
            <Text style={styles.participantLabel}>{participant.name}</Text>
            <TextInput
              style={styles.amountInput}
              value={entryInputs[participant.id] || '0'}
              onChangeText={(value) => handleInputChange(participant.id, value)}
              keyboardType="numeric"
              placeholder="0"
            />
            <Text style={styles.amountUnit}>원</Text>
          </View>
        ))}

      {/* 총합 표시 */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>총합</Text>
        <Text
          style={[
            styles.totalAmount,
            totalAmount === 0 ? styles.validTotal : styles.invalidTotal,
          ]}
        >
          {formatGameAmount(totalAmount)}원
        </Text>
      </View>

      {/* 저장 버튼 */}
      <AnimatedButton
        title="저장"
        onPress={handleSave}
        variant={totalAmount === 0 ? "success" : "secondary"}
        size="medium"
        feedbackType="pulse"
        style={styles.saveButton}
        disabled={totalAmount !== 0}
      />
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
  roundTabs: {
    marginBottom: Spacing.spacing.lg,
  },
  roundTab: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.md,
    marginRight: Spacing.spacing.sm,
    backgroundColor: Colors.background.elevated,
    borderRadius: Spacing.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundTabActive: {
    backgroundColor: Colors.primary.main,
  },
  roundTabValid: {
    borderWidth: 2,
    borderColor: Colors.status.success,
  },
  roundTabText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  roundTabTextActive: {
    color: Colors.primary.contrast,
    fontWeight: Typography.fontWeight.medium,
  },
  validIcon: {
    marginLeft: Spacing.spacing.xs,
    fontSize: 10,
    color: Colors.status.success,
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
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    marginBottom: Spacing.spacing.lg,
    ...createShadowStyle('sm'),
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
});
