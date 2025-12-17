import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Participant } from '../models/Participant';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

interface ParticipantListProps {
  participants: Participant[];
  onToggleActive?: (participantId: string, isActive: boolean) => void;
  onEdit?: (participant: Participant) => void;
  onDelete?: (participantId: string) => void;
  onPress?: (participant: Participant) => void;
}

/**
 * ParticipantList
 * 참가자 목록 컴포넌트
 */
export default function ParticipantList({
  participants,
  onToggleActive,
  onEdit,
  onDelete,
  onPress,
}: ParticipantListProps) {
  /**
   * 참가자 활성/비활성 토글
   */
  const handleToggleActive = (participant: Participant) => {
    if (!onToggleActive) return;

    const newStatus = !participant.isActive;
    const statusText = newStatus ? '활성화' : '비활성화';

    Alert.alert(
      '참가자 상태 변경',
      `${participant.name}님을 ${statusText}하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => onToggleActive(participant.id, newStatus),
        },
      ]
    );
  };

  /**
   * 참가자 삭제
   */
  const handleDelete = (participant: Participant) => {
    if (!onDelete) return;

    Alert.alert(
      '참가자 삭제',
      `${participant.name}님을 삭제하시겠습니까?\n관련 지출 내역이 있으면 삭제할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => onDelete(participant.id),
        },
      ]
    );
  };

  /**
   * 참가자 항목 렌더링
   */
  const renderParticipantItem = ({ item }: { item: Participant }) => (
    <TouchableOpacity
      style={[styles.participantItem, !item.isActive && styles.participantItemInactive]}
      onPress={() => onPress && onPress(item)}
      onLongPress={() => handleToggleActive(item)}
      activeOpacity={0.7}
    >
      <View style={styles.participantInfo}>
        {/* 활성 상태 표시 */}
        <View style={[styles.statusDot, { backgroundColor: item.isActive ? Colors.status.success : Colors.text.hint }]} />

        <View style={styles.participantDetails}>
          <Text style={[styles.participantName, !item.isActive && styles.participantNameInactive]}>
            {item.name}
          </Text>
          <Text style={styles.participantDate}>
            {new Date(item.joinedAt).toLocaleDateString('ko-KR')} 참가
          </Text>
        </View>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.actionButtons}>
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(item)}
          >
            <Text style={styles.actionButtonText}>수정</Text>
          </TouchableOpacity>
        )}
        {onToggleActive && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleActive(item)}
          >
            <Text style={styles.actionButtonText}>
              {item.isActive ? '비활성화' : '활성화'}
            </Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  /**
   * 빈 목록 표시
   */
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>참가자가 없습니다</Text>
      <Text style={styles.emptySubText}>참가자를 추가해주세요</Text>
    </View>
  );

  /**
   * 참가자 수 헤더
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerText}>
        참가자 {participants.length}명
        {participants.filter(p => p.isActive).length !== participants.length && (
          <Text style={styles.headerSubText}>
            {' '}(활성 {participants.filter(p => p.isActive).length}명)
          </Text>
        )}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {participants.length > 0 && renderHeader()}
      <FlatList
        data={participants}
        renderItem={renderParticipantItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.paper,
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: Spacing.spacing.lg,
    backgroundColor: Colors.background.elevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerText: {
    ...Typography.styles.body1,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  headerSubText: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
  },
  listContainer: {
    flexGrow: 1,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.elevated,
    backgroundColor: Colors.background.paper,
  },
  participantItemInactive: {
    backgroundColor: Colors.background.disabled,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: Spacing.radius.full,
    marginRight: Spacing.spacing.lg,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  participantNameInactive: {
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  participantDate: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.spacing.sm,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#F44336',
  },
  emptyContainer: {
    padding: Spacing.spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
    marginBottom: Spacing.spacing.sm,
  },
  emptySubText: {
    ...Typography.styles.body2,
    color: Colors.text.disabled,
  },
});
