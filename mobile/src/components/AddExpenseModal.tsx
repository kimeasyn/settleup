import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Participant } from '../models/Participant';
import { CreateExpenseRequest, CreateExpenseSplitRequest } from '../models/Expense';

interface AddExpenseModalProps {
  visible: boolean;
  participants: Participant[];
  onClose: () => void;
  onSubmit: (data: CreateExpenseRequest) => Promise<void>;
}

const CATEGORIES = ['식비', '교통', '숙박', '관광', '쇼핑', '기타'];

/**
 * AddExpenseModal
 * 지출 추가 모달
 */
export default function AddExpenseModal({
  visible,
  participants,
  onClose,
  onSubmit,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [payerId, setPayerId] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'equal' | 'manual'>('equal');
  const [manualSplits, setManualSplits] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const activeParticipants = participants.filter(p => p.isActive);

  /**
   * 초기화
   */
  useEffect(() => {
    if (visible && activeParticipants.length > 0 && !payerId) {
      setPayerId(activeParticipants[0].id);
    }
  }, [visible, activeParticipants]);

  /**
   * 폼 리셋
   */
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setPayerId(activeParticipants[0]?.id || '');
    setSplitMode('equal');
    setManualSplits({});
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * 균등 분할 계산
   */
  const calculateEqualSplits = (): CreateExpenseSplitRequest[] => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return [];

    const splitAmount = amountNum / activeParticipants.length;

    return activeParticipants.map(p => ({
      participantId: p.id,
      share: Math.round(splitAmount * 100) / 100, // 소수점 2자리
    }));
  };

  /**
   * 수동 분할 계산
   */
  const calculateManualSplits = (): CreateExpenseSplitRequest[] => {
    return activeParticipants
      .map(p => ({
        participantId: p.id,
        share: parseFloat(manualSplits[p.id] || '0'),
      }))
      .filter(split => split.share > 0);
  };

  /**
   * 분담 금액 합계 검증
   */
  const validateSplits = (splits: CreateExpenseSplitRequest[]): boolean => {
    const totalSplit = splits.reduce((sum, split) => sum + split.share, 0);
    const amountNum = parseFloat(amount);

    // 0.01 오차 허용
    return Math.abs(totalSplit - amountNum) < 0.01;
  };

  /**
   * 지출 추가
   */
  const handleSubmit = async () => {
    // 유효성 검증
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('입력 오류', '지출 금액을 올바르게 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('입력 오류', '지출 설명을 입력해주세요.');
      return;
    }

    if (description.trim().length > 200) {
      Alert.alert('입력 오류', '지출 설명은 최대 200자까지 입력할 수 있습니다.');
      return;
    }

    if (!payerId) {
      Alert.alert('입력 오류', '지출자를 선택해주세요.');
      return;
    }

    // 분담 내역 계산
    const splits = splitMode === 'equal'
      ? calculateEqualSplits()
      : calculateManualSplits();

    if (splits.length === 0) {
      Alert.alert('입력 오류', '분담 내역을 입력해주세요.');
      return;
    }

    if (!validateSplits(splits)) {
      Alert.alert(
        '입력 오류',
        `분담 금액의 합계가 지출 금액과 일치하지 않습니다.\n지출: ${amountNum}\n분담 합계: ${splits.reduce((sum, s) => sum + s.share, 0).toFixed(2)}`
      );
      return;
    }

    try {
      setSubmitting(true);

      const data: CreateExpenseRequest = {
        payerId,
        amount: amountNum,
        category: category || undefined,
        description: description.trim(),
        expenseDate: new Date().toISOString(),
        splits,
      };

      await onSubmit(data);

      Alert.alert('완료', '지출을 추가했습니다.');
      handleClose();
    } catch (error: any) {
      console.error('지출 추가 실패:', error);

      let errorMessage = '지출을 추가할 수 없습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('오류', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 수동 분할 금액 변경
   */
  const handleManualSplitChange = (participantId: string, value: string) => {
    setManualSplits(prev => ({
      ...prev,
      [participantId]: value,
    }));
  };

  /**
   * 수동 분할 금액 합계
   */
  const getManualSplitsTotal = (): number => {
    return Object.values(manualSplits).reduce((sum, val) => {
      const num = parseFloat(val || '0');
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>지출 추가</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* 폼 */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.form}>
            {/* 금액 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>금액 *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!submitting}
              />
            </View>

            {/* 설명 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>설명 *</Text>
              <TextInput
                style={styles.input}
                placeholder="지출 설명을 입력하세요"
                value={description}
                onChangeText={setDescription}
                maxLength={200}
                editable={!submitting}
              />
              <Text style={styles.hint}>{description.length}/200</Text>
            </View>

            {/* 카테고리 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>카테고리</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(category === cat ? '' : cat)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 지출자 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>지출자 *</Text>
              <View style={styles.participantContainer}>
                {activeParticipants.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.participantChip,
                      payerId === p.id && styles.participantChipActive,
                    ]}
                    onPress={() => setPayerId(p.id)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.participantChipText,
                        payerId === p.id && styles.participantChipTextActive,
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 분담 방식 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>분담 방식</Text>
              <View style={styles.splitModeContainer}>
                <TouchableOpacity
                  style={[
                    styles.splitModeButton,
                    splitMode === 'equal' && styles.splitModeButtonActive,
                  ]}
                  onPress={() => setSplitMode('equal')}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.splitModeText,
                      splitMode === 'equal' && styles.splitModeTextActive,
                    ]}
                  >
                    균등 분할
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.splitModeButton,
                    splitMode === 'manual' && styles.splitModeButtonActive,
                  ]}
                  onPress={() => setSplitMode('manual')}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.splitModeText,
                      splitMode === 'manual' && styles.splitModeTextActive,
                    ]}
                  >
                    수동 입력
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 수동 분할 입력 */}
            {splitMode === 'manual' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>분담 금액</Text>
                {activeParticipants.map(p => (
                  <View key={p.id} style={styles.splitInputRow}>
                    <Text style={styles.splitInputLabel}>{p.name}</Text>
                    <TextInput
                      style={styles.splitInput}
                      placeholder="0"
                      value={manualSplits[p.id] || ''}
                      onChangeText={(value) => handleManualSplitChange(p.id, value)}
                      keyboardType="decimal-pad"
                      editable={!submitting}
                    />
                  </View>
                ))}
                <View style={styles.splitSummary}>
                  <Text style={styles.splitSummaryLabel}>합계:</Text>
                  <Text
                    style={[
                      styles.splitSummaryValue,
                      Math.abs(getManualSplitsTotal() - parseFloat(amount || '0')) < 0.01
                        ? styles.splitSummaryValueValid
                        : styles.splitSummaryValueInvalid,
                    ]}
                  >
                    {getManualSplitsTotal().toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

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
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? '추가 중...' : '추가'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 32,
    color: '#9E9E9E',
    lineHeight: 32,
  },
  scrollView: {
    maxHeight: 500,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  hint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    textAlign: 'right',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#757575',
  },
  categoryChipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  participantContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  participantChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  participantChipText: {
    fontSize: 14,
    color: '#757575',
  },
  participantChipTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  splitModeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  splitModeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  splitModeButtonActive: {
    backgroundColor: '#2196F3',
  },
  splitModeText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  splitModeTextActive: {
    color: '#FFFFFF',
  },
  splitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitInputLabel: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
  },
  splitInput: {
    width: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FAFAFA',
    textAlign: 'right',
  },
  splitSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  splitSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  splitSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  splitSummaryValueValid: {
    color: '#4CAF50',
  },
  splitSummaryValueInvalid: {
    color: '#F44336',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
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
