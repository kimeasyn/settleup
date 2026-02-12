import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Participant } from '../models/Participant';

interface RemainderHandlingModalProps {
  visible: boolean;
  remainder: number;
  totalExpense: number;
  participants: Participant[];
  currency: string;
  onClose: () => void;
  onConfirm: (payerId: string, amount: number) => void;
}

/**
 * RemainderHandlingModal
 * 나머지 금액 처리 모달
 */
export default function RemainderHandlingModal({
  visible,
  remainder,
  totalExpense,
  participants,
  currency,
  onClose,
  onConfirm,
}: RemainderHandlingModalProps) {
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');
  const [additionalAmount, setAdditionalAmount] = useState<string>('');

  // 활성 참가자만 필터링 (useMemo로 최적화)
  const activeParticipants = useMemo(() =>
    participants.filter(p => p.isActive),
    [participants]
  );

  useEffect(() => {
    // 모달이 열릴 때 초기화
    if (visible && activeParticipants.length > 0) {
      setSelectedPayerId(activeParticipants[0].id);
      setAdditionalAmount(remainder.toString());
    }
  }, [visible, remainder, activeParticipants]);

  // 검증 로직
  const getValidationError = (): string | null => {
    const amount = parseInt(additionalAmount, 10);

    if (!additionalAmount || isNaN(amount)) {
      return '금액을 입력해주세요';
    }

    if (amount <= 0) {
      return '0보다 큰 금액을 입력해주세요';
    }

    if (amount > totalExpense) {
      return '총 지출 금액을 초과할 수 없습니다';
    }

    if ((totalExpense - amount) % activeParticipants.length !== 0) {
      return '입력한 금액으로는 정산이 정확히 나누어떨어지지 않습니다';
    }

    return null;
  };

  const isValid = (): boolean => {
    return getValidationError() === null;
  };

  const handleConfirm = () => {
    if (!selectedPayerId) {
      Alert.alert('오류', '추가 지불자를 선택해주세요.');
      return;
    }

    const error = getValidationError();
    if (error) {
      Alert.alert('오류', error);
      return;
    }

    const amount = parseInt(additionalAmount, 10);
    onConfirm(selectedPayerId, amount);
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.title}>⚠️ 나머지 금액 발생</Text>
            </View>

            {/* 설명 */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                총 지출 금액을 참가자 수로 나누면{'\n'}
                <Text style={styles.highlightText}>{formatAmount(remainder)} {currency}</Text>의 나머지가 발생합니다.
              </Text>
              <Text style={styles.infoSubText}>
                이 금액을 추가로 지불할 참가자를 선택해주세요.
              </Text>
            </View>

            {/* 참가자 선택 */}
            <View style={styles.pickerSection}>
              <Text style={styles.label}>추가 지불자</Text>
              <View style={styles.participantButtons}>
                {activeParticipants.map((participant) => (
                  <TouchableOpacity
                    key={participant.id}
                    style={[
                      styles.participantButton,
                      selectedPayerId === participant.id && styles.participantButtonSelected
                    ]}
                    onPress={() => setSelectedPayerId(participant.id)}
                  >
                    <Text style={[
                      styles.participantButtonText,
                      selectedPayerId === participant.id && styles.participantButtonTextSelected
                    ]}>
                      {participant.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 금액 입력 */}
            <View style={styles.amountSection}>
              <Text style={styles.label}>추가 지불 금액</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={additionalAmount}
                  onChangeText={setAdditionalAmount}
                  keyboardType="number-pad"
                  placeholder="금액 입력"
                  placeholderTextColor="#BDBDBD"
                />
                <Text style={styles.currencyText}>{currency}</Text>
              </View>
              <Text style={styles.hintText}>
                권장: {formatAmount(remainder)} {currency}
              </Text>
            </View>

            {/* 검증 결과 */}
            <View style={[
              styles.validationSection,
              isValid() ? styles.validationSuccess : styles.validationError
            ]}>
              <Text style={styles.validationIcon}>{isValid() ? '✅' : '⚠️'}</Text>
              <Text style={styles.validationText}>
                {isValid()
                  ? '정산이 정확히 나누어떨어집니다!'
                  : '입력한 금액으로는 정산이 정확히 나누어떨어지지 않습니다.'}
              </Text>
            </View>

            {/* 버튼 */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  !isValid() && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={!isValid()}
              >
                <Text style={[
                  styles.confirmButtonText,
                  !isValid() && styles.confirmButtonTextDisabled
                ]}>확인</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  infoText: {
    fontSize: 15,
    color: '#424242',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F57C00',
  },
  infoSubText: {
    fontSize: 13,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 18,
  },
  pickerSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  participantButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  participantButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  participantButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#616161',
  },
  participantButtonTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  amountSection: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
    marginLeft: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    marginLeft: 4,
  },
  validationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
  },
  validationSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  validationError: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FF9800',
  },
  validationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  validationText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#616161',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  confirmButtonTextDisabled: {
    color: '#9E9E9E',
  },
});
