/**
 * GameSettlementScreen 통합 테스트
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import GameSettlementScreen from '../GameSettlementScreen';
import { localGameSettlementService } from '../../services/api/gameSettlementService';
import * as settlementService from '../../services/api/settlementService';

// Mock dependencies
jest.mock('../../services/api/gameSettlementService');
jest.mock('../../services/api/settlementService');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

const mockedLocalGameSettlementService = localGameSettlementService as jest.Mocked<typeof localGameSettlementService>;
const mockedSettlementService = settlementService as jest.Mocked<typeof settlementService>;

// 테스트 데이터
const mockSettlement = {
  id: 'settlement-1',
  title: '테스트 게임 정산',
  type: 'GAME',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockParticipants = [
  {
    id: 'participant-1',
    name: 'Alice',
    isActive: true,
    settlementId: 'settlement-1',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'participant-2',
    name: 'Bob',
    isActive: true,
    settlementId: 'settlement-1',
    joinedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'participant-3',
    name: 'Charlie',
    isActive: true,
    settlementId: 'settlement-1',
    joinedAt: '2024-01-01T00:00:00Z',
  },
];

const mockGameRounds = [
  {
    round: {
      id: 'round-1',
      settlementId: 'settlement-1',
      roundNumber: 1,
      title: '1라운드',
      createdAt: '2024-01-01T10:00:00Z',
      isCompleted: true,
    },
    entries: [
      {
        id: 'entry-1',
        roundId: 'round-1',
        participantId: 'participant-1',
        participantName: 'Alice',
        amount: 5000,
        createdAt: '2024-01-01T10:05:00Z',
      },
      {
        id: 'entry-2',
        roundId: 'round-1',
        participantId: 'participant-2',
        participantName: 'Bob',
        amount: -3000,
        createdAt: '2024-01-01T10:05:00Z',
      },
      {
        id: 'entry-3',
        roundId: 'round-1',
        participantId: 'participant-3',
        participantName: 'Charlie',
        amount: -2000,
        createdAt: '2024-01-01T10:05:00Z',
      },
    ],
    totalAmount: 0,
    isValid: true,
  },
];

// 네비게이션 설정
const Stack = createStackNavigator();

const TestNavigator = ({ route }: any) => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="GameSettlement">
      <Stack.Screen
        name="GameSettlement"
        component={GameSettlementScreen}
        initialParams={route?.params}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const renderGameSettlementScreen = (params = { settlementId: 'settlement-1' }) => {
  return render(<TestNavigator route={{ params }} />);
};

describe('GameSettlementScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 기본 모킹 설정
    mockedSettlementService.getSettlement.mockResolvedValue(mockSettlement);
    mockedSettlementService.getParticipants.mockResolvedValue(mockParticipants);
    mockedLocalGameSettlementService.getLocalGameRounds.mockResolvedValue(mockGameRounds);
  });

  describe('초기 렌더링', () => {
    it('게임 정산 화면이 올바르게 렌더링되어야 함', async () => {
      const { getByText } = renderGameSettlementScreen();

      // 로딩 텍스트 확인
      expect(getByText('로딩 중...')).toBeTruthy();

      // 데이터 로드 후 화면 요소 확인
      await waitFor(() => {
        expect(getByText(/테스트 게임 정산 - 게임 정산/)).toBeTruthy();
      });
    });

    it('참가자 현황이 올바르게 표시되어야 함', async () => {
      const { getByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByText('참가자 현황')).toBeTruthy();
        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getByText('Charlie')).toBeTruthy();
        expect(getByText('+5,000원')).toBeTruthy();
        expect(getByText('-3,000원')).toBeTruthy();
        expect(getByText('-2,000원')).toBeTruthy();
      });
    });

    it('라운드 탭이 올바르게 표시되어야 함', async () => {
      const { getByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByText('1라운드')).toBeTruthy();
      });
    });
  });

  describe('라운드 관리', () => {
    it('새 라운드 추가가 동작해야 함', async () => {
      const newRound = {
        id: 'round-2',
        settlementId: 'settlement-1',
        roundNumber: 2,
        title: '2라운드',
        createdAt: '2024-01-01T11:00:00Z',
        isCompleted: false,
      };

      mockedLocalGameSettlementService.createLocalRound.mockResolvedValue(newRound);

      const { getByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByText('+ 라운드 추가')).toBeTruthy();
      });

      // 라운드 추가 버튼 클릭
      fireEvent.press(getByText('+ 라운드 추가'));

      await waitFor(() => {
        expect(mockedLocalGameSettlementService.createLocalRound).toHaveBeenCalledWith('settlement-1');
      });
    });

    it('라운드 삭제 확인 다이얼로그가 표시되어야 함', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByText('삭제')).toBeTruthy();
      });

      // 라운드 삭제 버튼 클릭
      fireEvent.press(getByText('삭제'));

      expect(alertSpy).toHaveBeenCalledWith(
        '라운드 삭제',
        expect.stringContaining('정말로 이 라운드를 삭제하시겠습니까?'),
        expect.any(Array)
      );
    });
  });

  describe('라운드 엔트리 입력', () => {
    it('참가자별 금액 입력 필드가 표시되어야 함', async () => {
      const { getByDisplayValue } = renderGameSettlementScreen();

      await waitFor(() => {
        // 기존 엔트리 값들이 입력 필드에 표시되어야 함
        expect(getByDisplayValue('5000')).toBeTruthy();
        expect(getByDisplayValue('-3000')).toBeTruthy();
        expect(getByDisplayValue('-2000')).toBeTruthy();
      });
    });

    it('총합이 0이 아닐 때 저장이 제한되어야 함', async () => {
      const { getByText, getByDisplayValue } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByDisplayValue('5000')).toBeTruthy();
      });

      // Alice의 금액을 6000으로 변경 (총합이 1000이 됨)
      const aliceInput = getByDisplayValue('5000');
      fireEvent.changeText(aliceInput, '6000');

      // 총합이 빨간색으로 표시되어야 함
      await waitFor(() => {
        expect(getByText('+1,000원')).toBeTruthy();
      });

      // 저장 버튼이 비활성화되어야 함
      const saveButton = getByText('저장');
      expect(saveButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('유효한 입력일 때 저장이 동작해야 함', async () => {
      mockedLocalGameSettlementService.updateLocalRoundEntries.mockResolvedValue({
        ...mockGameRounds[0],
        entries: [
          { ...mockGameRounds[0].entries[0], amount: 4000 },
          { ...mockGameRounds[0].entries[1], amount: -2000 },
          { ...mockGameRounds[0].entries[2], amount: -2000 },
        ],
        totalAmount: 0,
        isValid: true,
      });

      const { getByText, getByDisplayValue } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByDisplayValue('5000')).toBeTruthy();
      });

      // Alice의 금액을 4000으로 변경
      const aliceInput = getByDisplayValue('5000');
      fireEvent.changeText(aliceInput, '4000');

      // Bob의 금액을 -2000으로 변경
      const bobInput = getByDisplayValue('-3000');
      fireEvent.changeText(bobInput, '-2000');

      // 저장 버튼 클릭
      const saveButton = getByText('저장');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockedLocalGameSettlementService.updateLocalRoundEntries).toHaveBeenCalledWith(
          'settlement-1',
          'round-1',
          expect.arrayContaining([
            expect.objectContaining({
              participantId: 'participant-1',
              amount: 4000,
            }),
            expect.objectContaining({
              participantId: 'participant-2',
              amount: -2000,
            }),
            expect.objectContaining({
              participantId: 'participant-3',
              amount: -2000,
            }),
          ])
        );
      });
    });
  });

  describe('최종 정산', () => {
    it('최종 정산 버튼이 라운드가 있을 때만 표시되어야 함', async () => {
      const { getByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByText('최종 정산')).toBeTruthy();
      });
    });

    it('라운드가 없을 때는 최종 정산 버튼이 표시되지 않아야 함', async () => {
      mockedLocalGameSettlementService.getLocalGameRounds.mockResolvedValue([]);

      const { queryByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(queryByText('최종 정산')).toBeNull();
      });
    });
  });

  describe('에러 처리', () => {
    it('데이터 로드 실패 시 에러 알림이 표시되어야 함', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockedSettlementService.getSettlement.mockRejectedValue(new Error('네트워크 오류'));

      renderGameSettlementScreen();

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('오류', '데이터를 불러올 수 없습니다.');
      });
    });

    it('라운드 생성 실패 시 에러 알림이 표시되어야 함', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockedLocalGameSettlementService.createLocalRound.mockRejectedValue(new Error('저장 실패'));

      const { getByText } = renderGameSettlementScreen();

      await waitFor(() => {
        expect(getByText('+ 라운드 추가')).toBeTruthy();
      });

      fireEvent.press(getByText('+ 라운드 추가'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('오류', '라운드를 생성할 수 없습니다.');
      });
    });
  });
});