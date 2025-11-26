import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 정산 생성 화면
 * TODO: Phase 2에서 구현
 */
const CreateSettlementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>정산 생성</Text>
      <Text style={styles.subtitle}>정산 생성 기능은 곧 추가될 예정입니다</Text>
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
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default CreateSettlementScreen;
