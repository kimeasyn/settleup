import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Participant } from '../models/Participant';

interface RemainderHandlingModalProps {
  visible: boolean;
  remainder: number;
  participants: Participant[];
  currency: string;
  onClose: () => void;
  onConfirm: (payerId: string) => void;
}

/**
 * RemainderHandlingModal
 * 나머지 금액 처리 모달
 */
export default function RemainderHandlingModal({
  visible,
  remainder,
  participants,
  currency,
  onClose,
  onConfirm,
}: RemainderHandlingModalProps) {
  const [selectedPayerId, setSelectedPayerId] = useState<string>('');

  // 활성 참가자만 필터링
  const activeParticipants = participants.filter(p => p.isActive);

  useEffect(() => {
    // 모달이 열릴 때 첫 번째 참가자를 기본 선택
    if (visible && activeParticipants.length > 0) {
      setSelectedPayerId(activeParticipants[0].id);
    }
  }, [visible, activeParticipants]);

  const handleConfirm = () => {
    if (!selectedPayerId) {
      Alert.alert('오류', '추가 지불자를 선택해주세요.');
      return;
    }
    onConfirm(selectedPayerId);
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedPayerId}
                  onValueChange={(value) => setSelectedPayerId(value)}
                  style={styles.picker}
                >
                  {activeParticipants.map((participant) => (
                    <Picker.Item
                      key={participant.id}
                      label={participant.name}
                      value={participant.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* 금액 확인 */}
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>추가 지불 금액</Text>
              <Text style={styles.amountValue}>
                {formatAmount(remainder)} {currency}
              </Text>
            </View>

            {/* 검증 결과 */}
            <View style={styles.validationSection}>
              <Text style={styles.validationIcon}>✅</Text>
              <Text style={styles.validationText}>
                선택한 참가자가 추가 금액을 지불하면{'\n'}
                정산이 정확히 완료됩니다.
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
                style={[styles.button, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
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
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  amountSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: '#1976D2',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D47A1',
  },
  validationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
});
