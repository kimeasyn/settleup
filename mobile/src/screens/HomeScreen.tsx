import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Settlement, SettlementStatus, SettlementType } from '../models/Settlement';
import { getAllSettlements } from '../services/storage/settlementStorage';
import { getSettlements, deleteSettlement, searchSettlements } from '../services/api/settlementService';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/ToastMessage';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, createShadowStyle } from '../constants/Spacing';

/**
 * 타입 아이콘 반환
 */
const getTypeIcon = (type: SettlementType): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (type) {
    case SettlementType.TRAVEL:
      return 'airplane';
    case SettlementType.GAME:
      return 'cards-playing-outline';
    default:
      return 'file-document-outline';
  }
};

/**
 * 상대시간 반환
 */
const getRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}달 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
};

/**
 * HomeScreen
 * 정산 목록을 표시하는 메인 화면
 */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { logout, user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [selectedType, setSelectedType] = useState<SettlementType | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Settlement[] | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // API에서 정산 목록 조회
      try {
        const apiSettlements = await getSettlements();
        if (apiSettlements.length > 0 || localSettlements.length === 0) {
          setSettlements(apiSettlements);
          filterSettlements(apiSettlements, selectedType);
        }
      } catch (apiError) {
        console.log('API 동기화 실패 (오프라인 모드):', apiError);
      }
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
    if (searchQuery.trim()) {
      performSearch(searchQuery, type);
    } else {
      filterSettlements(settlements, type);
      setSearchResults(null);
    }
  };

  /**
   * 검색 실행
   */
  const performSearch = async (query: string, type: SettlementType | 'ALL' = selectedType) => {
    try {
      const result = await searchSettlements(
        query,
        undefined,
        type !== 'ALL' ? type : undefined
      );
      setSearchResults(result.content);
    } catch (error) {
      console.log('검색 실패:', error);
    }
  };

  /**
   * 검색어 변경 (300ms 디바운스)
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (!text.trim()) {
      setSearchResults(null);
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  /**
   * 검색어 클리어
   */
  const handleSearchClear = () => {
    setSearchQuery('');
    setSearchResults(null);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
  };

  /**
   * 정산 항목 클릭
   */
  const handleSettlementPress = (settlement: Settlement) => {
    if (settlement.type === SettlementType.GAME) {
      navigation.navigate('GameSettlement', { settlementId: settlement.id });
    } else {
      navigation.navigate('TravelSettlement', { settlementId: settlement.id });
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => { setMenuVisible(false); logout(); } },
    ]);
  };

  const handleDeleteSettlement = (settlement: Settlement) => {
    Alert.alert(
      '정산 삭제',
      `"${settlement.title}"을(를) 삭제하시겠습니까?\n관련된 모든 데이터가 삭제됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSettlement(settlement.id);
              await loadSettlements();
            } catch (error) {
              Toast.error('정산을 삭제할 수 없습니다.');
            }
          },
        },
      ],
    );
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
   * 정산 항목 렌더링
   */
  const renderSettlementItem = ({ item }: { item: Settlement }) => (
    <TouchableOpacity
      style={styles.settlementCard}
      onPress={() => handleSettlementPress(item)}
      onLongPress={() => handleDeleteSettlement(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name={getTypeIcon(item.type)}
              size={20}
              color={Colors.primary.main}
              style={styles.typeIcon}
            />
            <Text style={styles.settlementTitle} numberOfLines={1}>{item.title}</Text>
          </View>
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

      {(item.totalExpense != null || item.participantCount != null) && (
        <View style={styles.summaryRow}>
          {item.type === SettlementType.TRAVEL && item.totalExpense != null && (
            <Text style={styles.summaryText}>
              총 {new Intl.NumberFormat('ko-KR').format(item.totalExpense)}원
            </Text>
          )}
          {item.type === SettlementType.GAME && item.roundCount != null && (
            <Text style={styles.summaryText}>
              {item.roundCount}라운드
            </Text>
          )}
          {item.participantCount != null && item.participantCount > 0 && (
            <Text style={styles.summaryParticipants}>
              {item.participantCount}명
            </Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {item.startDate && new Date(item.startDate).toLocaleDateString('ko-KR')}
          {item.endDate && ` ~ ${new Date(item.endDate).toLocaleDateString('ko-KR')}`}
        </Text>
        <View style={styles.footerRight}>
          <Text style={styles.relativeTime}>{getRelativeTime(item.updatedAt)}</Text>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyBadgeText}>{item.currency === 'KRW' ? '\u20A9' : item.currency}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * 빈 목록 표시
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="file-document-outline"
        size={64}
        color={Colors.text.disabled}
      />
      <Text style={styles.emptyText}>아직 정산이 없어요</Text>
      <Text style={styles.emptySubText}>첫 정산을 시작해보세요</Text>
      <TouchableOpacity style={styles.emptyCta} onPress={handleAddSettlement}>
        <Text style={styles.emptyCtaText}>새 정산 추가</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 타입 필터 + 메뉴 */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
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
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
          activeOpacity={0.6}
        >
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      {/* 드롭다운 메뉴 */}
      {menuVisible && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuDropdown}>
            {user && (
              <View style={styles.menuUserInfo}>
                <Text style={styles.menuUserName}>{user.name}</Text>
                <Text style={styles.menuUserEmail}>{user.email}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              navigation.navigate('JoinSettlement');
            }}>
              <Text style={styles.menuItemText}>초대 코드 입력</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuItemTextDestructive}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={Colors.text.hint}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="정산 검색..."
            placeholderTextColor={Colors.text.hint}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleSearchClear} style={styles.searchClear}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.text.hint} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 정산 목록 */}
      <FlatList
        data={searchResults !== null ? searchResults : filteredSettlements}
        renderItem={renderSettlementItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* 새 정산 추가 버튼 */}
      <View style={styles.fabContainer}>
        <AnimatedButton
          title="+"
          onPress={handleAddSettlement}
          variant="primary"
          size="large"
          feedbackType="pulse"
          style={styles.fab}
          textStyle={styles.fabText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.spacing.lg,
    backgroundColor: Colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterTabs: {
    flexDirection: 'row',
    flex: 1,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.text.secondary,
    borderRadius: 1,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuDropdown: {
    position: 'absolute',
    top: 108,
    right: Spacing.spacing.lg,
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    paddingVertical: Spacing.spacing.xs,
    minWidth: 200,
    ...createShadowStyle('lg'),
    zIndex: 11,
  },
  menuUserInfo: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  menuUserName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  menuUserEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.hint,
    marginTop: 2,
  },
  menuItem: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.lg,
  },
  menuItemText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  menuItemTextDestructive: {
    fontSize: Typography.fontSize.md,
    color: Colors.status.error,
  },
  filterButton: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.sm,
    borderRadius: Spacing.radius['2xl'],
    marginRight: Spacing.spacing.sm,
    backgroundColor: Colors.background.disabled,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.main,
  },
  filterText: {
    ...Typography.styles.label,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.primary.contrast,
  },
  searchContainer: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.sm,
    backgroundColor: Colors.background.paper,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: Spacing.spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.spacing.sm,
  },
  searchClear: {
    padding: Spacing.spacing.xs,
  },
  listContainer: {
    padding: Spacing.spacing.lg,
    flexGrow: 1,
  },
  settlementCard: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.component.card,
    marginBottom: Spacing.spacing.md,
    ...createShadowStyle('sm'),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.spacing.xs,
  },
  typeIcon: {
    marginRight: Spacing.spacing.sm,
  },
  settlementTitle: {
    ...Typography.styles.h4,
    color: Colors.text.primary,
    flex: 1,
  },
  settlementType: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    marginLeft: 28,
  },
  statusBadge: {
    paddingHorizontal: Spacing.spacing.md,
    paddingVertical: Spacing.spacing.xs,
    borderRadius: Spacing.radius.lg,
  },
  statusText: {
    ...Typography.styles.caption,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
  settlementDescription: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    marginBottom: Spacing.spacing.md,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.spacing.sm,
    marginBottom: Spacing.spacing.md,
  },
  summaryText: {
    ...Typography.styles.body2,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
  },
  summaryParticipants: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
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
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.spacing.sm,
  },
  relativeTime: {
    ...Typography.styles.caption,
    color: Colors.text.hint,
  },
  currencyBadge: {
    backgroundColor: Colors.action.secondary,
    paddingHorizontal: Spacing.spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radius.sm,
  },
  currencyBadgeText: {
    ...Typography.styles.caption,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semibold,
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
  emptyCta: {
    marginTop: Spacing.spacing.xl,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.spacing['2xl'],
    paddingVertical: Spacing.spacing.md,
    borderRadius: Spacing.radius.md,
  },
  emptyCtaText: {
    ...Typography.styles.button,
    color: Colors.primary.contrast,
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.spacing.xl,
    bottom: Spacing.spacing.xl,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadowStyle('md'),
    minHeight: 56,
  },
  fabText: {
    fontSize: 28,
    lineHeight: 28,
    color: Colors.primary.contrast,
    fontWeight: '300',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
