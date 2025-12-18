import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Participant } from '../models/Participant';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';
import { AnimationDuration, AnimationEasing } from '../constants/Animations';
import AnimatedButton from './AnimatedButton';

interface AnimatedParticipantItemProps {
  participant: Participant;
  index: number;
  onPress?: () => void;
  onLongPress?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export default function AnimatedParticipantItem({
  participant,
  index,
  onPress,
  onLongPress,
  onEdit,
  onToggleActive,
  onDelete,
}: AnimatedParticipantItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const delay = index * 100; // 순차적 애니메이션

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AnimationDuration.normal,
        delay,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: AnimationDuration.normal,
        delay,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.participantItem, !participant.isActive && styles.participantItemInactive]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.participantInfo}>
          <View style={[styles.statusDot, { backgroundColor: participant.isActive ? Colors.status.success : Colors.text.hint }]} />

          <View style={styles.participantDetails}>
            <Text style={[styles.participantName, !participant.isActive && styles.participantNameInactive]}>
              {participant.name}
            </Text>
            <Text style={styles.participantDate}>
              {new Date(participant.joinedAt).toLocaleDateString('ko-KR')} 참가
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {onEdit && (
            <AnimatedButton
              title="수정"
              onPress={onEdit}
              variant="secondary"
              size="small"
              feedbackType="scale"
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          )}
          {onToggleActive && (
            <AnimatedButton
              title={participant.isActive ? '비활성화' : '활성화'}
              onPress={onToggleActive}
              variant="secondary"
              size="small"
              feedbackType="scale"
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
            />
          )}
          {onDelete && (
            <AnimatedButton
              title="삭제"
              onPress={onDelete}
              variant="danger"
              size="small"
              feedbackType="shake"
              style={[styles.actionButton, styles.deleteButton]}
              textStyle={[styles.actionButtonText, styles.deleteButtonText]}
            />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});