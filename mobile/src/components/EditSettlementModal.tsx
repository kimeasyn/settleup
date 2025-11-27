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
import { Settlement, UpdateSettlementRequest, SettlementStatus } from '../models/Settlement';

interface EditSettlementModalProps {
  visible: boolean;
  settlement: Settlement;
  onClose: () => void;
  onSubmit: (data: UpdateSettlementRequest) => Promise<void>;
}

/**
 * EditSettlementModal
 * 정산 정보 수정 모달
 */
export default function EditSettlementModal({
  visible,
  settlement,
  onClose,
  onSubmit,
}: EditSettlementModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('');
  const [status, setStatus] = useState<SettlementStatus>(SettlementStatus.ACTIVE);
  const [submitting, setSubmitting] = useState(false);

  /**
   * 모달이 열릴 때 기존 값으로 초기화
   */
  useEffect(() => {
    if (visible && settlement) {
      setTitle(settlement.title);
      setDescription(settlement.description || '');
      setStartDate(settlement.startDate || '');
      setEndDate(settlement.endDate || '');
      setCurrency(settlement.currency);
      setStatus(settlement.status);
    }
  }, [visible, settlement]);

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
    if (!dateString) return true; // 빈 문자열은 허용
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  };

  /**
   * 정산 정보 업데이트
   */
  const handleSubmit = async () => {
    // 유효성 검증
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return;
    }

    if (title.trim().length > 100) {
      Alert.alert('입력 오류', '제목은 최대 100자까지 입력할 수 있습니다.');
      return;
    }

    if (description.length > 500) {
      Alert.alert('입력 오류', '설명은 최대 500자까지 입력할 수 있습니다.');
      return;
    }

    if (startDate && !isValidDateFormat(startDate)) {
      Alert.alert('입력 오류', '시작일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
      return;
    }

    if (endDate && !isValidDateFormat(endDate)) {
      Alert.alert('입력 오류', '종료일 형식이 올바르지 않습니다. (YYYY-MM-DD)');
      return;
    }

    if (currency && currency.length !== 3) {
      Alert.alert('입력 오류', '통화 코드는 3글자여야 합니다. (예: KRW, USD, EUR)');
      return;
    }

    try {
      setSubmitting(true);

      const data: UpdateSettlementRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: currency || undefined,
        status: status,
      };

      await onSubmit(data);

      Alert.alert('완료', '정산 정보를 수정했습니다.');
      handleClose();
    } catch (error: any) {
      console.error('정산 수정 실패:', error);

      let errorMessage = '정산을 수정할 수 없습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('오류', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 상태 텍스트 변환
   */
  const getStatusText = (status: SettlementStatus): string => {
    switch (status) {
      case SettlementStatus.ACTIVE:
        return '진행중';
      case SettlementStatus.COMPLETED:
        return '완료';
      case SettlementStatus.ARCHIVED:
        return '보관됨';
      default:
        return '알 수 없음';
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
                <Text style={styles.title}>정산 수정</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 제목 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>제목 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="정산 제목"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 설명 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>설명</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="정산 설명 (선택사항)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 시작일 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>시작일 (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-01"
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 종료일 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>종료일 (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-31"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 통화 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>통화 코드</Text>
                <TextInput
                  style={styles.input}
                  placeholder="KRW"
                  value={currency}
                  onChangeText={(text) => setCurrency(text.toUpperCase())}
                  maxLength={3}
                  autoCapitalize="characters"
                  placeholderTextColor="#9E9E9E"
                />
              </View>

              {/* 상태 선택 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>상태</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      status === SettlementStatus.ACTIVE && styles.statusButtonActive,
                    ]}
                    onPress={() => setStatus(SettlementStatus.ACTIVE)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        status === SettlementStatus.ACTIVE && styles.statusButtonTextActive,
                      ]}
                    >
                      {getStatusText(SettlementStatus.ACTIVE)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      status === SettlementStatus.COMPLETED && styles.statusButtonActive,
                    ]}
                    onPress={() => setStatus(SettlementStatus.COMPLETED)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        status === SettlementStatus.COMPLETED && styles.statusButtonTextActive,
                      ]}
                    >
                      {getStatusText(SettlementStatus.COMPLETED)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      status === SettlementStatus.ARCHIVED && styles.statusButtonActive,
                    ]}
                    onPress={() => setStatus(SettlementStatus.ARCHIVED)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        status === SettlementStatus.ARCHIVED && styles.statusButtonTextActive,
                      ]}
                    >
                      {getStatusText(SettlementStatus.ARCHIVED)}
                    </Text>
                  </TouchableOpacity>
                </View>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  statusButtonTextActive: {
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
