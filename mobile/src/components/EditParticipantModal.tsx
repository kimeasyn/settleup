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
} from 'react-native';
import { Participant, UpdateParticipantRequest } from '../models/Participant';

interface EditParticipantModalProps {
  visible: boolean;
  participant: Participant;
  onClose: () => void;
  onSubmit: (data: UpdateParticipantRequest) => Promise<void>;
}

/**
 * EditParticipantModal
 * 참가자 정보 수정 모달
 */
export default function EditParticipantModal({
  visible,
  participant,
  onClose,
  onSubmit,
}: EditParticipantModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /**
   * 모달이 열릴 때 기존 값으로 초기화
   */
  useEffect(() => {
    if (visible && participant) {
      setName(participant.name);
    }
  }, [visible, participant]);

  /**
   * 폼 리셋
   */
  const resetForm = () => {
    setName('');
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * 참가자 정보 수정
   */
  const handleSubmit = async () => {
    // 유효성 검증
    if (!name.trim()) {
      Alert.alert('입력 오류', '참가자 이름을 입력해주세요.');
      return;
    }

    if (name.trim().length > 50) {
      Alert.alert('입력 오류', '이름은 최대 50자까지 입력할 수 있습니다.');
      return;
    }

    // 변경사항 확인
    if (name.trim() === participant.name) {
      Alert.alert('알림', '변경된 내용이 없습니다.');
      return;
    }

    try {
      setSubmitting(true);

      const data: UpdateParticipantRequest = {
        name: name.trim(),
      };

      await onSubmit(data);

      Alert.alert('완료', '참가자 정보를 수정했습니다.');
      handleClose();
    } catch (error: any) {
      console.error('참가자 수정 실패:', error);

      // 에러 메시지 파싱
      let errorMessage = '참가자를 수정할 수 없습니다.';
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
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>참가자 수정</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* 폼 */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이름 *</Text>
              <TextInput
                style={styles.input}
                placeholder="참가자 이름을 입력하세요"
                value={name}
                onChangeText={setName}
                maxLength={50}
                autoFocus={true}
                editable={!submitting}
              />
              <Text style={styles.hint}>
                {name.length}/50
              </Text>
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
              style={[
                styles.button,
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? '저장 중...' : '저장'}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
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
  buttonContainer: {
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