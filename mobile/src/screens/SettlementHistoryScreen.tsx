import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Settlement, SettlementStatus, SettlementType } from '../models/Settlement';
import { getSettlements, searchSettlements } from '../services/api/settlementService';

/**
 * SettlementHistoryScreen
 * 정산 히스토리를 표시하고 검색하는 화면
 */
export default function SettlementHistoryScreen() {
  const navigation = useNavigation();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SettlementType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<SettlementStatus | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  /**
   * 정산 목록 로드
   */
  const loadSettlements = async () => {
    try {
      setLoading(true);
      const data = await getSettlements();

      // 날짜순 정렬 (최신순)
      const sorted = data.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });

      setSettlements(sorted);
      filterSettlements(sorted, searchQuery, selectedType, selectedStatus);
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
   * 검색 및 필터링
   */
  const filterSettlements = (
    data: Settlement[],
    query: string,
    type: SettlementType | 'ALL',
    status: SettlementStatus | 'ALL'
  ) => {
    let filtered = data;

    // 타입 필터
    if (type !== 'ALL') {
      filtered = filtered.filter(s => s.type === type);
    }

    // 상태 필터
    if (status !== 'ALL') {
      filtered = filtered.filter(s => s.status === status);
    }

    // 검색어 필터
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(lowerQuery) ||
        (s.description && s.description.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredSettlements(filtered);
  };

  /**
   * 검색어 변경
   */
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    filterSettlements(settlements, query, selectedType, selectedStatus);
  };

  /**
   * 타입 필터 변경
   */
  const handleTypeFilter = (type: SettlementType | 'ALL') => {
    setSelectedType(type);
    filterSettlements(settlements, searchQuery, type, selectedStatus);
  };

  /**
   * 상태 필터 변경
   */
  const handleStatusFilter = (status: SettlementStatus | 'ALL') => {
    setSelectedStatus(status);
    filterSettlements(settlements, searchQuery, selectedType, status);
  };

  /**
   * 정산 항목 클릭
   */
  const handleSettlementPress = (settlement: Settlement) => {
    navigation.navigate('TravelSettlement', { settlementId: settlement.id });
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
   * 날짜 포맷팅
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <View style={styles.badges}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getTypeText(item.type)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>
      </View>

      {item.description && (
        <Text style={styles.settlementDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {formatDate(item.updatedAt || item.createdAt)}
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
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL'
          ? '검색 결과가 없습니다'
          : '정산 내역이 없습니다'}
      </Text>
      <Text style={styles.emptySubText}>
        {searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL'
          ? '다른 검색어나 필터를 사용해보세요'
          : ''}
      </Text>
    </View>
  );

  /**
   * 리스트 헤더 (검색바)
   */
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="정산 제목 또는 설명 검색..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#9E9E9E"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearchChange('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 타입 필터 */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>타입</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === 'ALL' && styles.filterButtonActive]}
            onPress={() => handleTypeFilter('ALL')}
          >
            <Text style={[styles.filterButtonText, selectedType === 'ALL' && styles.filterButtonTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === SettlementType.TRAVEL && styles.filterButtonActive]}
            onPress={() => handleTypeFilter(SettlementType.TRAVEL)}
          >
            <Text style={[styles.filterButtonText, selectedType === SettlementType.TRAVEL && styles.filterButtonTextActive]}>
              여행
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedType === SettlementType.GAME && styles.filterButtonActive]}
            onPress={() => handleTypeFilter(SettlementType.GAME)}
          >
            <Text style={[styles.filterButtonText, selectedType === SettlementType.GAME && styles.filterButtonTextActive]}>
              게임
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 상태 필터 */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>상태</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'ALL' && styles.filterButtonActive]}
            onPress={() => handleStatusFilter('ALL')}
          >
            <Text style={[styles.filterButtonText, selectedStatus === 'ALL' && styles.filterButtonTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === SettlementStatus.ACTIVE && styles.filterButtonActive]}
            onPress={() => handleStatusFilter(SettlementStatus.ACTIVE)}
          >
            <Text style={[styles.filterButtonText, selectedStatus === SettlementStatus.ACTIVE && styles.filterButtonTextActive]}>
              진행중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === SettlementStatus.COMPLETED && styles.filterButtonActive]}
            onPress={() => handleStatusFilter(SettlementStatus.COMPLETED)}
          >
            <Text style={[styles.filterButtonText, selectedStatus === SettlementStatus.COMPLETED && styles.filterButtonTextActive]}>
              완료
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === SettlementStatus.ARCHIVED && styles.filterButtonActive]}
            onPress={() => handleStatusFilter(SettlementStatus.ARCHIVED)}
          >
            <Text style={[styles.filterButtonText, selectedStatus === SettlementStatus.ARCHIVED && styles.filterButtonTextActive]}>
              보관
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 결과 카운트 */}
      <Text style={styles.resultCount}>
        총 {filteredSettlements.length}개의 정산
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredSettlements}
        renderItem={renderSettlementItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    flexGrow: 1,
  },
  listHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#212121',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#9E9E9E',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  resultCount: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 8,
  },
  settlementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  settlementTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
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
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
});
