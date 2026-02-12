import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 동기화 작업 타입
 */
export enum SyncActionType {
  CREATE_SETTLEMENT = 'CREATE_SETTLEMENT',
  UPDATE_SETTLEMENT = 'UPDATE_SETTLEMENT',
  DELETE_SETTLEMENT = 'DELETE_SETTLEMENT',
  ADD_PARTICIPANT = 'ADD_PARTICIPANT',
  DELETE_PARTICIPANT = 'DELETE_PARTICIPANT',
  TOGGLE_PARTICIPANT = 'TOGGLE_PARTICIPANT',
  ADD_EXPENSE = 'ADD_EXPENSE',
  UPDATE_EXPENSE = 'UPDATE_EXPENSE',
  DELETE_EXPENSE = 'DELETE_EXPENSE',
}

/**
 * 동기화 작업 상태
 */
export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * 동기화 작업 인터페이스
 */
export interface SyncAction {
  /** 작업 ID (UUID) */
  id: string;

  /** 작업 타입 */
  type: SyncActionType;

  /** 작업 데이터 (API 요청 페이로드) */
  payload: any;

  /** 작업 상태 */
  status: SyncStatus;

  /** 재시도 횟수 */
  retryCount: number;

  /** 생성 일시 */
  createdAt: string;

  /** 마지막 시도 일시 */
  lastAttemptAt?: string;

  /** 에러 메시지 */
  errorMessage?: string;
}

const SYNC_QUEUE_KEY = '@settleup:sync_queue';
const MAX_RETRY_COUNT = 3;

/**
 * SyncService
 * 오프라인 동기화 큐 관리
 */
class SyncService {
  private queue: SyncAction[] = [];
  private isProcessing = false;

  /**
   * 초기화 (앱 시작 시 호출)
   */
  async initialize(): Promise<void> {
    try {
      await this.loadQueue();
      console.log('동기화 큐 초기화 완료:', this.queue.length, '개 작업');
    } catch (error) {
      console.error('동기화 큐 초기화 실패:', error);
    }
  }

  /**
   * 큐에서 로드
   */
  private async loadQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      } else {
        this.queue = [];
      }
    } catch (error) {
      console.error('큐 로드 실패:', error);
      this.queue = [];
    }
  }

  /**
   * 큐에 저장
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('큐 저장 실패:', error);
    }
  }

  /**
   * 작업 추가
   */
  async addAction(type: SyncActionType, payload: any): Promise<string> {
    const action: SyncAction = {
      id: this.generateId(),
      type,
      payload,
      status: SyncStatus.PENDING,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(action);
    await this.saveQueue();

    console.log('동기화 작업 추가:', type, action.id);

    // 자동으로 처리 시작
    this.processQueue();

    return action.id;
  }

  /**
   * 큐 처리
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('이미 큐 처리 중');
      return;
    }

    if (this.queue.length === 0) {
      console.log('처리할 작업 없음');
      return;
    }

    this.isProcessing = true;
    console.log('큐 처리 시작:', this.queue.length, '개 작업');

    try {
      // PENDING 또는 FAILED 상태의 작업만 처리
      const pendingActions = this.queue.filter(
        action =>
          (action.status === SyncStatus.PENDING || action.status === SyncStatus.FAILED) &&
          action.retryCount < MAX_RETRY_COUNT
      );

      for (const action of pendingActions) {
        await this.processAction(action);
      }

      // 완료된 작업 제거
      this.queue = this.queue.filter(
        action => action.status !== SyncStatus.COMPLETED
      );

      await this.saveQueue();
      console.log('큐 처리 완료, 남은 작업:', this.queue.length);
    } catch (error) {
      console.error('큐 처리 중 오류:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 단일 작업 처리
   */
  private async processAction(action: SyncAction): Promise<void> {
    console.log('작업 처리 시작:', action.type, action.id);

    action.status = SyncStatus.IN_PROGRESS;
    action.lastAttemptAt = new Date().toISOString();
    await this.saveQueue();

    try {
      // TODO: 실제 API 호출 구현
      // 현재는 시뮬레이션만 수행
      await this.simulateApiCall(action);

      action.status = SyncStatus.COMPLETED;
      console.log('작업 완료:', action.type, action.id);
    } catch (error: any) {
      action.retryCount++;
      action.status = SyncStatus.FAILED;
      action.errorMessage = error.message || '알 수 없는 오류';

      console.error('작업 실패:', action.type, action.id, error);

      if (action.retryCount >= MAX_RETRY_COUNT) {
        console.log('최대 재시도 횟수 도달:', action.id);
      }
    }

    await this.saveQueue();
  }

  /**
   * API 호출 시뮬레이션 (실제 구현 시 교체 필요)
   */
  private async simulateApiCall(action: SyncAction): Promise<void> {
    // 시뮬레이션: 1초 대기
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: 실제 API 호출 구현
    // switch (action.type) {
    //   case SyncActionType.CREATE_SETTLEMENT:
    //     await createSettlement(action.payload);
    //     break;
    //   case SyncActionType.ADD_PARTICIPANT:
    //     await addParticipant(action.payload.settlementId, action.payload.data);
    //     break;
    //   // ... 기타 작업 타입
    // }

    console.log('API 호출 시뮬레이션:', action.type);
  }

  /**
   * 큐 상태 조회
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    inProgress: number;
    failed: number;
    completed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(a => a.status === SyncStatus.PENDING).length,
      inProgress: this.queue.filter(a => a.status === SyncStatus.IN_PROGRESS).length,
      failed: this.queue.filter(a => a.status === SyncStatus.FAILED).length,
      completed: this.queue.filter(a => a.status === SyncStatus.COMPLETED).length,
    };
  }

  /**
   * 실패한 작업 재시도
   */
  async retryFailedActions(): Promise<void> {
    console.log('실패한 작업 재시도');

    this.queue
      .filter(action => action.status === SyncStatus.FAILED)
      .forEach(action => {
        action.retryCount = 0;
        action.status = SyncStatus.PENDING;
      });

    await this.saveQueue();
    await this.processQueue();
  }

  /**
   * 큐 전체 삭제 (주의: 동기화되지 않은 데이터 손실 가능)
   */
  async clearQueue(): Promise<void> {
    console.log('큐 전체 삭제');
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * UUID 생성 (간단한 버전)
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// 싱글톤 인스턴스
export const syncService = new SyncService();

/**
 * 동기화 큐 초기화 (앱 시작 시 호출)
 */
export async function initializeSyncService(): Promise<void> {
  await syncService.initialize();
}

/**
 * 동기화 작업 추가
 */
export async function addSyncAction(
  type: SyncActionType,
  payload: any
): Promise<string> {
  return syncService.addAction(type, payload);
}

/**
 * 동기화 큐 처리
 */
export async function processSyncQueue(): Promise<void> {
  return syncService.processQueue();
}

/**
 * 큐 상태 조회
 */
export function getSyncQueueStatus() {
  return syncService.getQueueStatus();
}

/**
 * 실패한 작업 재시도
 */
export async function retryFailedActions(): Promise<void> {
  return syncService.retryFailedActions();
}

/**
 * 큐 전체 삭제
 */
export async function clearSyncQueue(): Promise<void> {
  return syncService.clearQueue();
}
