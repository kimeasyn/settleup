import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { ExpenseWithDetails, UpdateExpenseRequest } from '../models/Expense';
import { Participant } from '../models/Participant';

interface EditExpenseModalProps {
  visible: boolean;
  expense: ExpenseWithDetails;
  participants: Participant[];
  onClose: () => void;
  onSubmit: (data: UpdateExpenseRequest) => Promise<void>;
}

/**
 * EditExpenseModal
 * 지출 정보 수정 모달
 */
export default function EditExpenseModal({
  visible,
  expense,
  participants,
  onClose,
  onSubmit,
}: EditExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [category, setCategory] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * 모달이 열릴 때 기존 값으로 초기화
   */
  useEffect(() => {
    if (visible && expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setExpenseDate(expense.expenseDate);
      setCategory(expense.category || '');
      setSelectedPayerId(expense.payerId);
    }
  }, [visible, expense]);

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    onClose();
  };

  /**
   * 날짜 포맷 검증 (YYYY-MM-DD)
   */
  const isValidDateFormat = (dateString: string): boolean => {
    if (!dateString) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  };

  /**
   * 카테고리 목록
   */
  const categories = ['식비', '교통', '숙박', '쇼핑', '문화', '기타'];

  /**
   * 지출 정보 업데이트
   */
  const handleSubmit = async () => {
    // 유효성 검증
    if (!description.trim()) {
      Alert.alert('입력 오류', '지출 설명을 입력해주세요.');
      return;
    }

    if (description.trim().length > 200) {
      Alert.alert('입력 오류', '설명은 최대 200자까지 입력할 수 있습니다.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('입력 오류', '올바른 금액을 입력해주세요.');
      return;
    }

    if (amountNum > 100000000) {
      Alert.alert('입력 오류', '금액은 1억 원 이하여야 합니다.');
      return;
    }

    if (!isValidDateFormat(expenseDate)) {
      Alert.alert('입력 오류', '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)');
      return;
    }

    if (!selectedPayerId) {
      Alert.alert('입력 오류', '지불자를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const data: UpdateExpenseRequest = {
        description: description.trim(),
        amount: amountNum,
        expenseDate: expenseDate,
        payerId: selectedPayerId,
        category: category.trim() || undefined,
      };

      await onSubmit(data);

      Alert.alert('완료', '지출 정보를 수정했습니다.');
      handleClose();
    } catch (error: any) {
      console.error('지출 수정 실패:', error);

      let errorMessage = '지출을 수정할 수 없습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('오류', errorMessage);
    } finally {
      setSubmitting(false);
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
                <Text style={styles.title}>지출 수정</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 설명 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>설명 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="지출 설명"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 금액 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>금액 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 날짜 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>날짜 * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-01"
                  value={expenseDate}
                  onChangeText={setExpenseDate}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 지불자 선택 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>지불자 *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.participantScroll}
                >
                  {participants
                    .filter(p => p.isActive)
                    .map((participant) => (
                      <TouchableOpacity
                        key={participant.id}
                        style={[
                          styles.participantChip,
                          selectedPayerId === participant.id && styles.participantChipSelected,
                        ]}
                        onPress={() => setSelectedPayerId(participant.id)}
                      >
                        <Text
                          style={[
                            styles.participantChipText,
                            selectedPayerId === participant.id && styles.participantChipTextSelected,
                          ]}
                        >
                          {participant.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>

              {/* 카테고리 선택 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>카테고리</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipSelected,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="직접 입력"
                  value={category}
                  onChangeText={setCategory}
                  maxLength={50}
                  placeholderTextColor="#9E9E9E"
                />
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
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={submitting}
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
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  },
  participantScroll: {
    marginTop: 8,
  },
  participantChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  participantChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  participantChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  participantChipTextSelected: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#757575',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
