import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type SettlementResultScreenRouteProp = RouteProp<
  RootStackParamList,
  'SettlementResult'
>;

/**
 * 정산 결과 화면
 * 정산 계산 결과를 표시합니다
 * TODO: 실제 정산 결과 계산 및 표시 구현
 */
const SettlementResultScreen = () => {
  const route = useRoute<SettlementResultScreenRouteProp>();
  const { settlementId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>정산 결과</Text>
      <Text style={styles.subtitle}>정산 ID: {settlementId}</Text>
      <Text style={styles.message}>
        정산 결과 계산 기능은 곧 추가될 예정입니다
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default SettlementResultScreen;
