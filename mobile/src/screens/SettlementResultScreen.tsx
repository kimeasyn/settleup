import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SettlementResult, ParticipantSummary, Transfer } from '../models/SettlementResult';
import { calculateSettlement, getLatestResult } from '../services/api/settlementService';

type SettlementResultScreenRouteProp = RouteProp<
  RootStackParamList,
  'SettlementResult'
>;

/**
 * 정산 결과 화면
 * 정산 계산 결과를 표시합니다
 */
const SettlementResultScreen = () => {
  const route = useRoute<SettlementResultScreenRouteProp>();
  const navigation = useNavigation();
  const { settlementId, remainderPayerId, remainderAmount } = route.params;

  const [result, setResult] = useState<SettlementResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 정산 결과 로드
   */
  const loadSettlementResult = async () => {
    try {
      setLoading(true);
      setError(null);

      // 먼저 저장된 결과가 있는지 확인
      try {
        const savedResult = await getLatestResult(settlementId);
        if (savedResult) {
          setResult(savedResult);
          return;
        }
      } catch {
        // 저장된 결과가 없으면 새로 계산
      }

      // 정산 계산 실행 (나머지 지불자와 추가 부담 금액 전달) + 저장
      const data = await calculateSettlement(settlementId, remainderPayerId, remainderAmount, true);
      setResult(data);
    } catch (err) {
      console.error('정산 결과 로드 실패:', err);
      setError('정산 결과를 불러올 수 없습니다.');
      Alert.alert('오류', '정산 결과를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlementResult();
  }, [settlementId]);

  /**
   * 금액 포맷팅
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(Math.abs(amount));
  };

  /**
   * 정산 결과 공유
   */
  const handleShare = async () => {
    if (!result) return;

    try {
      const shareText = generateShareText();
      await Share.share({
        message: shareText,
      });
    } catch (error) {
      console.error('공유 실패:', error);
      Alert.alert('오류', '공유할 수 없습니다.');
    }
  };

  /**
   * 공유 텍스트 생성
   */
  const generateShareText = (): string => {
    if (!result) return '';

    let text = `📊 정산 결과\n\n`;
    text += `💰 총 지출: ${formatAmount(result.totalAmount)}원\n\n`;

    text += `👥 참가자별 요약:\n`;
    result.participants.forEach((p) => {
      text += `- ${p.participantName}\n`;
      text += `  지출: ${formatAmount(p.totalPaid)}원\n`;
      text += `  분담: ${formatAmount(p.shouldPay)}원\n`;
      if (p.balance > 0) {
        text += `  받을 돈: ${formatAmount(p.balance)}원\n`;
      } else if (p.balance < 0) {
        text += `  줄 돈: ${formatAmount(p.balance)}원\n`;
      } else {
        text += `  정산 완료\n`;
      }
      text += `\n`;
    });

    if (result.transfers.length > 0) {
      text += `💸 송금 경로:\n`;
      result.transfers.forEach((t, index) => {
        text += `${index + 1}. ${t.fromParticipantName} → ${t.toParticipantName}: ${formatAmount(t.amount)}원\n`;
      });
    } else {
      text += `✅ 모든 참가자가 정산 완료!\n`;
    }

    return text;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>정산 결과 계산 중...</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || '정산 결과를 불러올 수 없습니다'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettlementResult}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 총 금액 카드 */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>총 지출 금액</Text>
          <Text style={styles.totalAmount}>{formatAmount(result.totalAmount)} 원</Text>
          <Text style={styles.calculatedAt}>
            계산 일시: {new Date(result.calculatedAt).toLocaleString('ko-KR')}
          </Text>
        </View>

        {/* 참가자별 요약 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 참가자별 요약</Text>
          {result.participants.map((participant) => (
            <ParticipantCard key={participant.participantId} participant={participant} />
          ))}
        </View>

        {/* 송금 경로 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💸 송금 경로</Text>
          {result.transfers.length > 0 ? (
            result.transfers.map((transfer, index) => (
              <TransferCard key={index} transfer={transfer} index={index} />
            ))
          ) : (
            <View style={styles.noTransfersCard}>
              <Text style={styles.noTransfersIcon}>✅</Text>
              <Text style={styles.noTransfersText}>
                모든 참가자가 정산 완료했습니다!
              </Text>
            </View>
          )}
        </View>

        {/* 공유 버튼 */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 정산 결과 공유하기</Text>
        </TouchableOpacity>

        {/* 완료 버튼 */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>확인</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

/**
 * 참가자 카드 컴포넌트
 */
const ParticipantCard = ({ participant }: { participant: ParticipantSummary }) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(Math.abs(amount));
  };

  const getBalanceStyle = (balance: number) => {
    if (balance > 0) return styles.balancePositive;
    if (balance < 0) return styles.balanceNegative;
    return styles.balanceZero;
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return `+${formatAmount(balance)}원 받을 돈`;
    if (balance < 0) return `-${formatAmount(balance)}원 줄 돈`;
    return '정산 완료';
  };

  return (
    <View style={styles.participantCard}>
      <View style={styles.participantHeader}>
        <Text style={styles.participantName}>{participant.participantName}</Text>
        <View style={[styles.balanceBadge, getBalanceStyle(participant.balance)]}>
          <Text style={styles.balanceText}>{getBalanceText(participant.balance)}</Text>
        </View>
      </View>
      <View style={styles.participantDetails}>
        <View style={styles.participantRow}>
          <Text style={styles.participantLabel}>지출 금액</Text>
          <Text style={styles.participantValue}>{formatAmount(participant.totalPaid)}원</Text>
        </View>
        <View style={styles.participantRow}>
          <Text style={styles.participantLabel}>분담 금액</Text>
          <Text style={styles.participantValue}>{formatAmount(participant.shouldPay)}원</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * 송금 카드 컴포넌트
 */
const TransferCard = ({ transfer, index }: { transfer: Transfer; index: number }) => {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <View style={styles.transferCard}>
      <View style={styles.transferIndex}>
        <Text style={styles.transferIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.transferContent}>
        <View style={styles.transferRow}>
          <Text style={styles.transferFrom}>{transfer.fromParticipantName}</Text>
          <Text style={styles.transferArrow}>→</Text>
          <Text style={styles.transferTo}>{transfer.toParticipantName}</Text>
        </View>
        <Text style={styles.transferAmount}>{formatAmount(transfer.amount)}원</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#616161',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  totalCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  calculatedAt: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  participantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  balancePositive: {
    backgroundColor: '#E8F5E9',
  },
  balanceNegative: {
    backgroundColor: '#FFEBEE',
  },
  balanceZero: {
    backgroundColor: '#E0E0E0',
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  participantDetails: {
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  participantLabel: {
    fontSize: 14,
    color: '#757575',
  },
  participantValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  transferCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transferIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transferIndexText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  transferContent: {
    flex: 1,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transferFrom: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
  },
  transferArrow: {
    fontSize: 15,
    color: '#2196F3',
    marginHorizontal: 8,
    fontWeight: '600',
  },
  transferTo: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
  },
  transferAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  noTransfersCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noTransfersIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noTransfersText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems:'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SettlementResultScreen;
