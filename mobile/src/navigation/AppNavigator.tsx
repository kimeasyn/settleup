import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import TravelSettlementScreen from '../screens/TravelSettlementScreen';
import CreateSettlementScreen from '../screens/CreateSettlementScreen';
import SettlementResultScreen from '../screens/SettlementResultScreen';
import SettlementHistoryScreen from '../screens/SettlementHistoryScreen';

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
    <Stack.Screen
      name="CreateSettlement"
      component={CreateSettlementScreen}
      options={{
        title: '정산 생성',
      }}
    />
    <Stack.Screen
      name="SettlementResult"
      component={SettlementResultScreen}
      options={{
        title: '정산 결과',
      }}
    />
  </Stack.Navigator>
);

/**
 * History Stack Navigator
 */
const HistoryStack = () => (
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
      name="HistoryMain"
      component={SettlementHistoryScreen}
      options={{ title: '정산 히스토리' }}
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
