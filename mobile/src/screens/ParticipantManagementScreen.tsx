import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Participant } from '../models/Participant';
import { AddParticipantRequest, UpdateParticipantRequest } from '../models/Participant';
import ParticipantList from '../components/ParticipantList';
import AddParticipantModal from '../components/AddParticipantModal';
import EditParticipantModal from '../components/EditParticipantModal';
import {
  getParticipants,
  addParticipant,
  toggleParticipantStatus,
  deleteParticipant,
  updateParticipant,
} from '../services/api/settlementService';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

export default function ParticipantManagementScreen() {
  const route = useRoute();
  const { settlementId, isCompleted } = route.params as {
    settlementId: string;
    isCompleted: boolean;
  };

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const data = await getParticipants(settlementId);
      setParticipants(data);
    } catch (error) {
      console.error('참가자 로드 실패:', error);
      Alert.alert('오류', '참가자 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParticipants();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [settlementId])
  );

  const handleAddParticipant = async (data: AddParticipantRequest) => {
    await addParticipant(settlementId, data);
    await loadParticipants();
  };

  const handleEditParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
    setEditModalVisible(true);
  };

  const handleUpdateParticipant = async (data: UpdateParticipantRequest) => {
    if (!selectedParticipant) return;
    try {
      await updateParticipant(settlementId, selectedParticipant.id, data);
      await loadParticipants();
    } catch (error) {
      console.error('참가자 수정 실패:', error);
      throw error;
    }
  };

  const handleToggleParticipant = async (participantId: string, isActive: boolean) => {
    try {
      await toggleParticipantStatus(settlementId, participantId, isActive);
      await loadParticipants();
      Alert.alert('완료', isActive ? '참가자를 활성화했습니다.' : '참가자를 비활성화했습니다.');
    } catch (error) {
      console.error('참가자 상태 변경 실패:', error);
      Alert.alert('오류', '참가자 상태를 변경할 수 없습니다.');
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    try {
      await deleteParticipant(settlementId, participantId);
      await loadParticipants();
      Alert.alert('완료', '참가자를 삭제했습니다.');
    } catch (error) {
      console.error('참가자 삭제 실패:', error);
      Alert.alert('오류', '참가자를 삭제할 수 없습니다.\n관련 지출 내역이 있을 수 있습니다.');
    }
  };

  if (loading && participants.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isCompleted && (
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ 참가자 추가</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={[1]}
        keyExtractor={() => 'participants'}
        renderItem={() => (
          <View style={styles.content}>
            <ParticipantList
              participants={participants}
              onEdit={isCompleted ? undefined : handleEditParticipant}
              onToggleActive={isCompleted ? undefined : handleToggleParticipant}
              onDelete={isCompleted ? undefined : handleDeleteParticipant}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <AddParticipantModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddParticipant}
      />

      {selectedParticipant && (
        <EditParticipantModal
          visible={editModalVisible}
          participant={selectedParticipant}
          onClose={() => setEditModalVisible(false)}
          onSubmit={handleUpdateParticipant}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.default,
  },
  loadingText: {
    ...Typography.styles.body1,
    color: Colors.text.hint,
  },
  headerBar: {
    paddingHorizontal: Spacing.spacing.lg,
    paddingVertical: Spacing.spacing.md,
    backgroundColor: Colors.background.default,
  },
  addButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.spacing.md,
    borderRadius: Spacing.radius.md,
    alignItems: 'center',
  },
  addButtonText: {
    ...Typography.styles.button,
    color: Colors.primary.contrast,
  },
  content: {
    padding: Spacing.spacing.lg,
  },
});
