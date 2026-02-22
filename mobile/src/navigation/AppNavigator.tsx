import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import TravelSettlementScreen from '../screens/TravelSettlementScreen';
import ParticipantManagementScreen from '../screens/ParticipantManagementScreen';
import ExpenseListScreen from '../screens/ExpenseListScreen';
import CreateSettlementScreen from '../screens/CreateSettlementScreen';
import SettlementResultScreen from '../screens/SettlementResultScreen';
import SettlementHistoryScreen from '../screens/SettlementHistoryScreen';
import GameSettlementScreen from '../screens/GameSettlementScreen';
import GameSettlementResultScreen from '../screens/GameSettlementResultScreen';
import JoinSettlementScreen from '../screens/JoinSettlementScreen';
import LoginScreen from '../screens/LoginScreen';
import { ScreenTransitions } from '../constants/Animations';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

/**
 * Navigation 구조
 * Auth Stack: 로그인 화면
 * Main Tabs: 홈, 히스토리
 * Stack: 각 탭 내부의 화면 스택
 */

export type RootStackParamList = {
  Home: undefined;
  TravelSettlement: { settlementId: string };
  ParticipantManagement: { settlementId: string; isCompleted: boolean };
  ExpenseList: { settlementId: string; isCompleted: boolean; currency: string };
  CreateSettlement: undefined;
  SettlementResult: { settlementId: string; remainderPayerId?: string; remainderAmount?: number };
  GameSettlement: { settlementId: string };
  GameSettlementResult: { settlementId: string; gameResult: any };
  JoinSettlement: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();
const AuthStackNav = createStackNavigator<AuthStackParamList>();

/**
 * Auth Stack Navigator
 */
const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
  </AuthStackNav.Navigator>
);

/**
 * Home Stack Navigator
 */
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: Colors.primary.main,
      },
      headerTintColor: Colors.primary.contrast,
      headerTitleStyle: {
        fontWeight: '600',
      },
      ...ScreenTransitions.slideFromRight,
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
      name="ParticipantManagement"
      component={ParticipantManagementScreen}
      options={{
        title: '참가자 관리',
      }}
    />
    <Stack.Screen
      name="ExpenseList"
      component={ExpenseListScreen}
      options={{
        title: '지출 내역',
      }}
    />
    <Stack.Screen
      name="CreateSettlement"
      component={CreateSettlementScreen}
      options={{
        title: '정산 생성',
        ...ScreenTransitions.slideFromBottom,
      }}
    />
    <Stack.Screen
      name="SettlementResult"
      component={SettlementResultScreen}
      options={{
        title: '정산 결과',
      }}
    />
    <Stack.Screen
      name="GameSettlement"
      component={GameSettlementScreen}
      options={{
        title: '게임 정산',
      }}
    />
    <Stack.Screen
      name="GameSettlementResult"
      component={GameSettlementResultScreen}
      options={{
        title: '게임 정산 결과',
      }}
    />
    <Stack.Screen
      name="JoinSettlement"
      component={JoinSettlementScreen}
      options={{
        title: '초대 코드 입력',
        ...ScreenTransitions.slideFromBottom,
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
        backgroundColor: Colors.primary.main,
      },
      headerTintColor: Colors.primary.contrast,
      headerTitleStyle: {
        fontWeight: '600',
      },
      ...ScreenTransitions.slideFromRight,
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
 * Main Tab Navigator
 */
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary.main,
      tabBarInactiveTintColor: Colors.text.hint,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={{
        tabBarLabel: '홈',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryStack}
      options={{
        tabBarLabel: '히스토리',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="time-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

/**
 * App Navigator - 인증 상태에 따른 분기
 */
export const AppNavigator = () => {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return isLoggedIn ? <MainTabs /> : <AuthStack />;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
});
