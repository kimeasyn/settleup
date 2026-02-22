import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SettlementType, CreateSettlementRequest } from '../models/Settlement';
import { createSettlement } from '../services/api/settlementService';
import { saveSettlement } from '../services/storage/settlementStorage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

type CreateSettlementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateSettlement'
>;

/**
 * 정산 생성 화면
 * 새로운 여행 정산 또는 게임 정산을 생성합니다
 */
const CreateSettlementScreen = () => {
  const navigation = useNavigation<CreateSettlementScreenNavigationProp>();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SettlementType>(SettlementType.TRAVEL);
  const [currency] = useState('KRW'); // 기본값 KRW, 추후 선택 가능하도록 확장

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 유효성 검증
   */
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '정산 제목을 입력해주세요.');
      return false;
    }

    if (title.length > 100) {
      Alert.alert('입력 오류', '제목은 100자 이내로 입력해주세요.');
      return false;
    }

    if (description.length > 500) {
      Alert.alert('입력 오류', '설명은 500자 이내로 입력해주세요.');
      return false;
    }

    return true;
  };

  /**
   * 정산 생성 처리
   */
  const handleCreateSettlement = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // API 요청 데이터 생성
      const request: CreateSettlementRequest = {
        title: title.trim(),
        type,
        description: description.trim() || undefined,
        currency,
      };

      // 1. 백엔드 API 호출
      const newSettlement = await createSettlement(request);
      console.log('✅ Settlement created via API:', newSettlement.id);

      // 2. 로컬 저장소에 저장
      await saveSettlement(newSettlement);
      console.log('✅ Settlement saved to local storage');

      // 3. 성공 메시지 및 화면 이동
      Alert.alert('성공', '정산이 생성되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            if (newSettlement.type === SettlementType.GAME) {
              navigation.replace('GameSettlement', {
                settlementId: newSettlement.id,
              });
            } else {
              navigation.replace('TravelSettlement', {
                settlementId: newSettlement.id,
              });
            }
          },
        },
      ]);
    } catch (error) {
      console.error('정산 생성 실패:', error);
      Alert.alert(
        '오류',
        '정산 생성에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 정산 타입 선택 */}
        <View style={styles.section}>
          <Text style={styles.label}>정산 유형 *</Text>
          <View style={styles.typeButtonContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === SettlementType.TRAVEL && styles.typeButtonActive,
              ]}
              onPress={() => setType(SettlementType.TRAVEL)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === SettlementType.TRAVEL && styles.typeButtonTextActive,
                ]}
              >
                🌍 여행 정산
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === SettlementType.GAME && styles.typeButtonActive,
              ]}
              onPress={() => setType(SettlementType.GAME)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === SettlementType.GAME && styles.typeButtonTextActive,
                ]}
              >
                🎮 게임 정산
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 제주도 여행, 포커 게임"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!isLoading}
            autoCapitalize="sentences"
          />
          <Text style={styles.helperText}>{title.length}/100</Text>
        </View>

        {/* 설명 입력 */}
        <View style={styles.section}>
          <Text style={styles.label}>설명 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="정산에 대한 간단한 설명을 입력하세요"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isLoading}
            autoCapitalize="sentences"
          />
          <Text style={styles.helperText}>{description.length}/500</Text>
        </View>

        {/* 통화 정보 */}
        <View style={styles.section}>
          <Text style={styles.label}>통화</Text>
          <View style={styles.currencyDisplay}>
            <Text style={styles.currencyText}>KRW (\u20A9)</Text>
          </View>
          <Text style={styles.helperText}>현재는 원화(KRW)만 지원됩니다</Text>
        </View>

        {/* 생성 버튼 */}
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateSettlement}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.primary.contrast} />
          ) : (
            <Text style={styles.createButtonText}>정산 생성</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.spacing.xl,
  },
  section: {
    marginBottom: Spacing.spacing['2xl'],
  },
  label: {
    ...Typography.styles.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.sm,
  },
  typeButtonContainer: {
    flexDirection: 'row',
    gap: Spacing.spacing.md,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.spacing.lg,
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    borderWidth: 2,
    borderColor: Colors.border.light,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.action.secondary,
  },
  typeButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.hint,
  },
  typeButtonTextActive: {
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
  },
  input: {
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    ...Typography.styles.body1,
    color: Colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.spacing.lg,
  },
  helperText: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.xs,
  },
  currencyDisplay: {
    backgroundColor: Colors.background.default,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
  },
  currencyText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
  },
  createButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.spacing.sm,
    ...createShadowStyle('sm'),
  },
  createButtonDisabled: {
    backgroundColor: Colors.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default CreateSettlementScreen;
