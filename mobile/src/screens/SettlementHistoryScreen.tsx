import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Settlement, SettlementStatus, SettlementType } from '../models/Settlement';
import { getSettlements, searchSettlements } from '../services/api/settlementService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Toast } from '../components/ToastMessage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

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
      Toast.error('정산 목록을 불러올 수 없습니다.');
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
        return Colors.semantic.settlement.active;
      case SettlementStatus.COMPLETED:
        return Colors.semantic.settlement.completed;
      case SettlementStatus.ARCHIVED:
        return Colors.semantic.settlement.archived;
      default:
        return Colors.text.secondary;
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
  const isFiltered = searchQuery || selectedType !== 'ALL' || selectedStatus !== 'ALL';

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="clipboard-text-outline"
        size={64}
        color={Colors.text.disabled}
      />
      <Text style={styles.emptyText}>
        {isFiltered
          ? '검색 결과가 없습니다'
          : '정산 내역이 없습니다'}
      </Text>
      <Text style={styles.emptySubText}>
        {isFiltered
          ? '다른 조건을 사용해보세요'
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
    backgroundColor: Colors.background.default,
  },
  listContainer: {
    flexGrow: 1,
  },
  listHeader: {
    padding: Spacing.spacing.lg,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    borderRadius: Spacing.radius.lg,
    paddingHorizontal: Spacing.spacing.lg,
    marginBottom: Spacing.spacing.lg,
  },
  searchIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.spacing.lg,
    ...Typography.styles.body1,
    color: Colors.text.primary,
  },
  clearButton: {
    padding: Spacing.spacing.xs,
  },
  clearButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.hint,
  },
  filterSection: {
    marginBottom: Spacing.spacing.lg,
  },
  filterLabel: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.sm,
    borderRadius: Spacing.radius['2xl'],
    backgroundColor: Colors.background.default,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  filterButtonText: {
    ...Typography.styles.buttonSmall,
    color: Colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Colors.primary.contrast,
  },
  resultCount: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.sm,
  },
  settlementCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.component.card,
    marginHorizontal: Spacing.container.md,
    marginVertical: Spacing.spacing.sm,
    ...createShadowStyle('sm'),
  },
  cardHeader: {
    marginBottom: Spacing.spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  settlementTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.radius.lg,
    backgroundColor: Colors.action.success,
  },
  typeBadgeText: {
    ...Typography.styles.overline,
    color: Colors.status.success,
    textTransform: 'none',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Spacing.radius.lg,
  },
  statusText: {
    ...Typography.styles.overline,
    color: Colors.text.inverse,
    textTransform: 'none',
  },
  settlementDescription: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.lg,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
  },
  currencyText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.spacing['5xl'],
  },
  emptyText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
    marginTop: Spacing.spacing.lg,
    marginBottom: Spacing.spacing.sm,
  },
  emptySubText: {
    ...Typography.styles.body2,
    color: Colors.text.disabled,
  },
});
