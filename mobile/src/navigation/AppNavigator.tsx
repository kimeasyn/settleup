import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import TravelSettlementScreen from '../screens/TravelSettlementScreen';

/**
 * Navigation 구조
 * Bottom Tabs: 홈, 히스토리
 * Stack: 각 탭 내부의 화면 스택
 */

export type RootStackParamList = {
  Home: undefined;
  TravelSettlement: { settlementId: string };
  CreateSettlement: undefined;
  SettlementResult: { settlementId: string };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

/**
 * 임시 히스토리 화면 (Phase 4에서 구현)
 */
const HistoryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>정산 히스토리</Text>
    <Text style={styles.subtext}>과거 정산 조회</Text>
  </View>
);

/**
 * Home Stack Navigator
 */
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        title: 'SettleUp',
        headerShown: false,
      }}
    />
    <Stack.Screen
      name="TravelSettlement"
      component={TravelSettlementScreen}
      options={{
        title: '정산 상세',
      }}
    />
    {/* TODO: CreateSettlement 화면 추가 */}
    {/* TODO: SettlementResult 화면 추가 */}
  </Stack.Navigator>
);

/**
 * History Stack Navigator
 */
const HistoryStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HistoryMain"
      component={HistoryScreen}
      options={{ title: '히스토리' }}
    />
  </Stack.Navigator>
);

/**
 * Main App Navigator with Bottom Tabs
 */
export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: '홈',
          // TODO: Add icon
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStack}
        options={{
          tabBarLabel: '히스토리',
          // TODO: Add icon
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
