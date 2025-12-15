import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settlement, SettlementStatus, SettlementType } from '../models/Settlement';
import { getAllSettlements } from '../services/storage/settlementStorage';
import { getSettlements } from '../services/api/settlementService';

/**
 * HomeScreen
 * 정산 목록을 표시하는 메인 화면
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [selectedType, setSelectedType] = useState<SettlementType | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /**
   * 정산 목록 로드 (로컬 저장소 우선)
   */
  const loadSettlements = async () => {
    try {
      setLoading(true);

      // 로컬 저장소에서 로드
      const localSettlements = await getAllSettlements();
      setSettlements(localSettlements);
      filterSettlements(localSettlements, selectedType);

      // 백그라운드에서 API 동기화 시도
      try {
        const apiSettlements = await getSettlements();
        // API 데이터가 있으면 로컬 저장소 업데이트 (동기화 로직은 나중에 구현)
        setSettlements(apiSettlements);
        filterSettlements(apiSettlements, selectedType);
      } catch (apiError) {
        console.log('API 동기화 실패 (오프라인 모드):', apiError);
      }
    } catch (error) {
      console.error('정산 목록 로드 실패:', error);
      Alert.alert('오류', '정산 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettlements();
    setRefreshing(false);
  };

  /**
   * 화면 포커스 시 데이터 새로고침
   */
  useFocusEffect(
    useCallback(() => {
      loadSettlements();
    }, [])
  );

  /**
   * 타입별 필터링
   */
  const filterSettlements = (data: Settlement[], type: SettlementType | 'ALL') => {
    if (type === 'ALL') {
      setFilteredSettlements(data);
    } else {
      setFilteredSettlements(data.filter(s => s.type === type));
    }
  };

  /**
   * 타입 필터 변경
   */
  const handleTypeFilter = (type: SettlementType | 'ALL') => {
    setSelectedType(type);
    filterSettlements(settlements, type);
  };

  /**
   * 정산 항목 클릭
   */
  const handleSettlementPress = (settlement: Settlement) => {
    navigation.navigate('TravelSettlement', { settlementId: settlement.id });
  };

  /**
   * 새 정산 추가
   */
  const handleAddSettlement = () => {
    navigation.navigate('CreateSettlement');
  };

  /**
   * 정산 상태 배지 색상
   */
  const getStatusColor = (status: SettlementStatus): string => {
    switch (status) {
      case SettlementStatus.ACTIVE:
        return '#4CAF50';
      case SettlementStatus.COMPLETED:
        return '#2196F3';
      case SettlementStatus.ARCHIVED:
        return '#9E9E9E';
      default:
        return '#757575';
    }
  };

  /**
   * 정산 상태 한글 텍스트
   */
  const getStatusText = (status: SettlementStatus): string => {
    switch (status) {
      case SettlementStatus.ACTIVE:
        return '진행중';
      case SettlementStatus.COMPLETED:
        return '완료';
      case SettlementStatus.ARCHIVED:
        return '보관됨';
      default:
        return '알 수 없음';
    }
  };

  /**
   * 정산 타입 한글 텍스트
   */
  const getTypeText = (type: SettlementType): string => {
    switch (type) {
      case SettlementType.TRAVEL:
        return '여행';
      case SettlementType.GAME:
        return '게임';
      default:
        return '기타';
    }
  };

  /**
   * 정산 항목 렌더링
   */
  const renderSettlementItem = ({ item }: { item: Settlement }) => (
    <TouchableOpacity
      style={styles.settlementCard}
      onPress={() => handleSettlementPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.settlementTitle}>{item.title}</Text>
          <Text style={styles.settlementType}>{getTypeText(item.type)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.settlementDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {item.startDate && new Date(item.startDate).toLocaleDateString('ko-KR')}
          {item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('ko-KR')}`}
        </Text>
        <Text style={styles.currencyText}>{item.currency}</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * 빈 목록 표시
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>정산 내역이 없습니다</Text>
      <Text style={styles.emptySubText}>새 정산을 추가해보세요</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 타입 필터 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === 'ALL' && styles.filterButtonActive]}
          onPress={() => handleTypeFilter('ALL')}
        >
          <Text style={[styles.filterText, selectedType === 'ALL' && styles.filterTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === SettlementType.TRAVEL && styles.filterButtonActive]}
          onPress={() => handleTypeFilter(SettlementType.TRAVEL)}
        >
          <Text style={[styles.filterText, selectedType === SettlementType.TRAVEL && styles.filterTextActive]}>
            여행
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedType === SettlementType.GAME && styles.filterButtonActive]}
          onPress={() => handleTypeFilter(SettlementType.GAME)}
        >
          <Text style={[styles.filterText, selectedType === SettlementType.GAME && styles.filterTextActive]}>
            게임
          </Text>
        </TouchableOpacity>
      </View>

      {/* 정산 목록 */}
      <FlatList
        data={filteredSettlements}
        renderItem={renderSettlementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* 새 정산 추가 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddSettlement}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  settlementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  settlementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  settlementType: {
    fontSize: 12,
    color: '#757575',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settlementDescription: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  currencyText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#BDBDBD',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
