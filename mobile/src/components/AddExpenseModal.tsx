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
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';
import AnimatedButton from './AnimatedButton';

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
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    resetForm();
    onClose();
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

    if (amountNum > 100000000) {
      Alert.alert('입력 오류', '금액은 1억 원 이하여야 합니다.');
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

    try {
      setSubmitting(true);

      // ISO 8601 형식으로 날짜를 변환 (LocalDateTime 호환)
      const now = new Date();
      const expenseDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, -1); // 'Z' 제거

      const data: CreateExpenseRequest = {
        payerId,
        amount: amountNum,
        category: category || undefined,
        description: description.trim(),
        expenseDate,
        // splits는 나중에 정산 계산 시 지정
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
              <Text style={styles.hint}>분담 방식은 나중에 정산 계산 시 지정됩니다</Text>
            </View>
          </ScrollView>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <AnimatedButton
              title="취소"
              onPress={handleClose}
              disabled={submitting}
              variant="secondary"
              size="medium"
              feedbackType="scale"
              style={[styles.button, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
            <AnimatedButton
              title={submitting ? '추가 중...' : '추가'}
              onPress={handleSubmit}
              disabled={submitting}
              variant="primary"
              size="medium"
              feedbackType="pulse"
              style={[
                styles.button,
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              textStyle={styles.submitButtonText}
            />
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
