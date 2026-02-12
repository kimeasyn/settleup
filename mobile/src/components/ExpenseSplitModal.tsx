import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ExpenseWithDetails, ExpenseSplitRequest, ParticipantSplitRequest } from '../models/Expense';
import { Participant } from '../models/Participant';

interface ExpenseSplitModalProps {
  visible: boolean;
  expense: ExpenseWithDetails;
  participants: Participant[];
  onClose: () => void;
  onSubmit: (data: ExpenseSplitRequest) => Promise<void>;
}

/**
 * ExpenseSplitModal
 * 지출 분담 설정 모달
 */
export default function ExpenseSplitModal({
  visible,
  expense,
  participants,
  onClose,
  onSubmit,
}: ExpenseSplitModalProps) {
  const [splitType, setSplitType] = useState<'EQUAL' | 'MANUAL'>('EQUAL');
  const [participantSplits, setParticipantSplits] = useState<ParticipantSplitRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 활성 참가자만 필터링
  const activeParticipants = participants.filter(p => p.isActive);

  /**
   * 모달이 열릴 때 초기값 설정
   */
  useEffect(() => {
    if (visible && expense && activeParticipants.length > 0) {
      initializeParticipantSplits();
    }
  }, [visible, expense, activeParticipants]);

  /**
   * 참가자별 분담 금액 초기화
   */
  const initializeParticipantSplits = () => {
    const splits: ParticipantSplitRequest[] = activeParticipants.map((participant) => ({
      participantId: participant.id,
      share: 0,
    }));
    setParticipantSplits(splits);

    // 기본적으로 균등분할로 설정
    calculateEqualSplits(splits);
  };

  /**
   * 균등분할 계산
   */
  const calculateEqualSplits = (splits: ParticipantSplitRequest[]) => {
    if (splits.length === 0) return;

    const totalAmount = expense.amount;
    const participantCount = splits.length;

    // 1인당 기본 금액 (소수점 버림)
    const perPersonAmount = Math.floor(totalAmount / participantCount);

    // 나머지 금액
    const remainder = totalAmount - (perPersonAmount * participantCount);

    const updatedSplits = splits.map((split, index) => ({
      ...split,
      share: index === 0 ? perPersonAmount + remainder : perPersonAmount,
    }));

    setParticipantSplits(updatedSplits);
  };

  /**
   * 분담 방식 변경 핸들러
   */
  const handleSplitTypeChange = (type: 'EQUAL' | 'MANUAL') => {
    setSplitType(type);

    if (type === 'EQUAL') {
      calculateEqualSplits(participantSplits);
    }
  };

  /**
   * 개별 참가자 분담 금액 변경 핸들러
   */
  const handleParticipantShareChange = (participantId: string, shareText: string) => {
    const share = parseFloat(shareText) || 0;

    setParticipantSplits(prevSplits =>
      prevSplits.map(split =>
        split.participantId === participantId
          ? { ...split, share }
          : split
      )
    );
  };

  /**
   * 총 분담 금액 계산
   */
  const getTotalSplitAmount = (): number => {
    return participantSplits.reduce((total, split) => total + split.share, 0);
  };

  /**
   * 분담 금액 유효성 검사
   */
  const validateSplits = (): boolean => {
    const totalSplit = getTotalSplitAmount();
    const expenseAmount = expense.amount;

    // 1원 이하 차이는 허용 (부동소수점 오차 고려)
    return Math.abs(totalSplit - expenseAmount) < 1;
  };

  /**
   * 참가자 이름 조회
   */
  const getParticipantName = (participantId: string): string => {
    const participant = participants.find(p => p.id === participantId);
    return participant?.name || '알 수 없음';
  };

  /**
   * 금액 포맷팅
   */
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  /**
   * 분담 설정 제출
   */
  const handleSubmit = async () => {
    // 유효성 검사
    if (!validateSplits()) {
      Alert.alert(
        '분담 금액 오류',
        `분담 금액 합계(${formatAmount(getTotalSplitAmount())}원)가 지출 금액(${formatAmount(expense.amount)}원)과 일치하지 않습니다.`
      );
      return;
    }

    const hasZeroSplit = participantSplits.some(split => split.share < 0);
    if (hasZeroSplit) {
      Alert.alert('분담 금액 오류', '분담 금액은 0 이상이어야 합니다.');
      return;
    }

    try {
      setSubmitting(true);

      const data: ExpenseSplitRequest = {
        splitType,
        splits: participantSplits,
      };

      await onSubmit(data);
      Alert.alert('완료', '지출 분담이 설정되었습니다.');
      onClose();
    } catch (error: any) {
      console.error('분담 설정 실패:', error);

      let errorMessage = '분담 설정에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('오류', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* 헤더 */}
              <View style={styles.header}>
                <Text style={styles.title}>분담 설정</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 지출 정보 */}
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>{expense.description}</Text>
                <Text style={styles.expenseAmount}>{formatAmount(expense.amount)}원</Text>
              </View>

              {/* 분담 방식 선택 */}
              <View style={styles.splitTypeSection}>
                <Text style={styles.sectionTitle}>분담 방식</Text>
                <View style={styles.splitTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.splitTypeButton,
                      splitType === 'EQUAL' && styles.splitTypeButtonActive,
                    ]}
                    onPress={() => handleSplitTypeChange('EQUAL')}
                  >
                    <Text
                      style={[
                        styles.splitTypeButtonText,
                        splitType === 'EQUAL' && styles.splitTypeButtonTextActive,
                      ]}
                    >
                      균등 분할
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.splitTypeButton,
                      splitType === 'MANUAL' && styles.splitTypeButtonActive,
                    ]}
                    onPress={() => handleSplitTypeChange('MANUAL')}
                  >
                    <Text
                      style={[
                        styles.splitTypeButtonText,
                        splitType === 'MANUAL' && styles.splitTypeButtonTextActive,
                      ]}
                    >
                      수동 입력
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 참가자별 분담 금액 */}
              <View style={styles.participantSection}>
                <Text style={styles.sectionTitle}>참가자별 분담 금액</Text>
                {participantSplits.map((split) => {
                  const exceedsTotal = split.share > expense.amount;
                  return (
                    <View key={split.participantId}>
                      <View style={styles.participantRow}>
                        <Text style={styles.participantName}>
                          {getParticipantName(split.participantId)}
                        </Text>
                        <View style={styles.amountInputContainer}>
                          <TextInput
                            style={[
                              styles.amountInput,
                              splitType === 'EQUAL' && styles.amountInputDisabled,
                              exceedsTotal && styles.amountInputExceeds,
                            ]}
                            value={split.share.toString()}
                            onChangeText={(text) =>
                              handleParticipantShareChange(split.participantId, text)
                            }
                            keyboardType="numeric"
                            editable={splitType === 'MANUAL'}
                            placeholderTextColor="#9E9E9E"
                          />
                          <Text style={styles.currency}>원</Text>
                        </View>
                      </View>
                      {exceedsTotal && (
                        <Text style={styles.splitWarning}>
                          개별 분담 금액이 지출 금액을 초과합니다
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* 합계 표시 */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>분담 합계:</Text>
                  <Text style={[
                    styles.totalAmount,
                    validateSplits() ? styles.totalAmountValid : styles.totalAmountInvalid,
                  ]}>
                    {formatAmount(getTotalSplitAmount())}원
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>지출 금액:</Text>
                  <Text style={styles.totalAmount}>{formatAmount(expense.amount)}원</Text>
                </View>
                {!validateSplits() && (
                  <Text style={styles.validationError}>
                    ⚠️ 분담 금액 합계가 지출 금액과 일치하지 않습니다
                  </Text>
                )}
                {validateSplits() && (
                  <Text style={styles.validationSuccess}>
                    ✅ 분담 금액이 올바르게 설정되었습니다
                  </Text>
                )}
              </View>

              {/* 버튼 */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (!validateSplits() || submitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!validateSplits() || submitting}
                >
                  <Text style={styles.submitButtonText}>
                    {submitting ? '저장 중...' : '저장'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#757575',
  },
  expenseInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  splitTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  splitTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  splitTypeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  splitTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  splitTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  participantSection: {
    marginBottom: 24,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    minWidth: 80,
    textAlign: 'right',
  },
  amountInputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#9E9E9E',
  },
  amountInputExceeds: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  splitWarning: {
    fontSize: 11,
    color: '#F44336',
    marginTop: -4,
    marginBottom: 4,
    marginLeft: 4,
  },
  currency: {
    fontSize: 14,
    color: '#757575',
  },
  totalSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#757575',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  totalAmountValid: {
    color: '#4CAF50',
  },
  totalAmountInvalid: {
    color: '#F44336',
  },
  validationError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 8,
    textAlign: 'center',
  },
  validationSuccess: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  submitButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});