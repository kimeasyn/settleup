import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { joinByCode } from '../services/api/settlementService';
import { Toast } from '../components/ToastMessage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

type JoinSettlementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'JoinSettlement'
>;

const JoinSettlementScreen = () => {
  const navigation = useNavigation<JoinSettlementScreenNavigationProp>();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  };

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Toast.warning('초대 코드를 입력해주세요.');
      return;
    }
    if (trimmed.length !== 8) {
      Toast.warning('초대 코드는 8자리입니다.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await joinByCode(trimmed);

      Toast.success(`"${result.settlementTitle}" 정산에 참가했습니다!`);

      if (result.settlementType === 'GAME') {
        navigation.replace('GameSettlement', {
          settlementId: result.settlementId,
        });
      } else {
        navigation.replace('TravelSettlement', {
          settlementId: result.settlementId,
        });
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        '참가에 실패했습니다. 코드를 확인해주세요.';
      Toast.error(message);
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
        <View style={styles.section}>
          <Text style={styles.label}>초대 코드</Text>
          <TextInput
            style={styles.input}
            placeholder="8자리 코드 입력"
            value={code}
            onChangeText={handleCodeChange}
            maxLength={8}
            editable={!isLoading}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            정산 생성자에게 받은 8자리 초대 코드를 입력하세요
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.primary.contrast} />
          ) : (
            <Text style={styles.joinButtonText}>참가하기</Text>
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
  input: {
    backgroundColor: Colors.background.paper,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    ...Typography.styles.body1,
    color: Colors.text.primary,
    fontSize: Typography.fontSize.xl,
    letterSpacing: 4,
    textAlign: 'center',
  },
  helperText: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.xs,
  },
  joinButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.spacing.sm,
    ...createShadowStyle('sm'),
  },
  joinButtonDisabled: {
    backgroundColor: Colors.text.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  joinButtonText: {
    color: Colors.primary.contrast,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default JoinSettlementScreen;
