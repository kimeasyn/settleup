import React, { useState } from 'react';
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
import { AddParticipantRequest } from '../models/Participant';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: AddParticipantRequest) => Promise<void>;
}

/**
 * AddParticipantModal
 * 참가자 추가 모달
 */
export default function AddParticipantModal({
  visible,
  onClose,
  onSubmit,
}: AddParticipantModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
   * 참가자 추가
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

    try {
      setSubmitting(true);

      const data: AddParticipantRequest = {
        name: name.trim(),
      };

      await onSubmit(data);

      Alert.alert('완료', '참가자를 추가했습니다.');
      handleClose();
    } catch (error: any) {
      console.error('참가자 추가 실패:', error);

      // 에러 메시지 파싱
      let errorMessage = '참가자를 추가할 수 없습니다.';
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
            <Text style={styles.title}>참가자 추가</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay.medium,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.xl,
    padding: Spacing.component.modal,
    ...createShadowStyle('lg'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.spacing.xl,
  },
  title: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 32,
    color: Colors.text.hint,
    lineHeight: 32,
  },
  form: {
    marginBottom: Spacing.spacing['2xl'],
  },
  inputGroup: {
    marginBottom: Spacing.spacing.lg,
  },
  label: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.radius.sm,
    padding: Spacing.spacing.lg,
    ...Typography.styles.body1,
    color: Colors.text.primary,
    backgroundColor: Colors.background.elevated,
  },
  hint: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.xs,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.spacing.lg,
    borderRadius: Spacing.radius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.disabled,
  },
  cancelButtonText: {
    ...Typography.styles.button,
    color: Colors.text.secondary,
  },
  submitButton: {
    backgroundColor: Colors.primary.main,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  submitButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.contrast,
  },
});
