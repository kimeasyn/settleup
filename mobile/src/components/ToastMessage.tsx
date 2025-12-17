/**
 * 토스트 메시지 컴포넌트
 * 사용자에게 간단한 알림 메시지를 표시하기 위한 컴포넌트
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Spacing';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  visible: boolean;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onHide?: () => void;
  position?: 'top' | 'bottom';
  actionText?: string;
  onActionPress?: () => void;
}

/**
 * 토스트 메시지 컴포넌트
 */
export default function ToastMessage({
  visible,
  type,
  title,
  message,
  duration = 3000,
  onHide,
  position = 'top',
  actionText,
  onActionPress,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (visible) {
      showToast();
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const showToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastStyle = (type: ToastType) => {
    const baseStyle = {
      backgroundColor: Colors.background.paper,
      borderLeftWidth: 4,
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          borderLeftColor: Colors.status.success,
          backgroundColor: Colors.action.success,
        };
      case 'error':
        return {
          ...baseStyle,
          borderLeftColor: Colors.status.error,
          backgroundColor: Colors.action.danger,
        };
      case 'warning':
        return {
          ...baseStyle,
          borderLeftColor: Colors.status.warning,
          backgroundColor: '#FFF3E0',
        };
      case 'info':
        return {
          ...baseStyle,
          borderLeftColor: Colors.status.info,
          backgroundColor: Colors.action.secondary,
        };
      default:
        return baseStyle;
    }
  };

  const getIcon = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, position === 'top' ? styles.topPosition : styles.bottomPosition]}>
      <Animated.View
        style={[
          styles.toast,
          getToastStyle(type),
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={onActionPress}
          disabled={!onActionPress}
          activeOpacity={onActionPress ? 0.7 : 1}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{getIcon(type)}</Text>
          </View>

          <View style={styles.textContainer}>
            {title && (
              <Text style={styles.title}>{title}</Text>
            )}
            <Text style={[styles.message, !title && styles.messageOnly]}>
              {message}
            </Text>
          </View>

          {actionText && onActionPress && (
            <View style={styles.actionContainer}>
              <Text style={styles.actionText}>{actionText}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/**
 * 토스트 매니저 클래스 (싱글톤)
 */
class ToastManager {
  private static instance: ToastManager;
  private currentToast: ToastProps | null = null;
  private listeners: Set<(toast: ToastProps | null) => void> = new Set();

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  show(props: Omit<ToastProps, 'visible' | 'onHide'>) {
    this.currentToast = {
      ...props,
      visible: true,
      onHide: () => {
        this.currentToast = null;
        this.notifyListeners();
      },
    };
    this.notifyListeners();
  }

  hide() {
    if (this.currentToast) {
      this.currentToast = { ...this.currentToast, visible: false };
      this.notifyListeners();
    }
  }

  success(message: string, title?: string, options?: Partial<ToastProps>) {
    this.show({
      type: 'success',
      title,
      message,
      ...options,
    });
  }

  error(message: string, title?: string, options?: Partial<ToastProps>) {
    this.show({
      type: 'error',
      title,
      message,
      duration: 4000,
      ...options,
    });
  }

  warning(message: string, title?: string, options?: Partial<ToastProps>) {
    this.show({
      type: 'warning',
      title,
      message,
      ...options,
    });
  }

  info(message: string, title?: string, options?: Partial<ToastProps>) {
    this.show({
      type: 'info',
      title,
      message,
      ...options,
    });
  }

  subscribe(listener: (toast: ToastProps | null) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentToast));
  }

  getCurrentToast() {
    return this.currentToast;
  }
}

export const Toast = ToastManager.getInstance();

/**
 * 토스트 프로바이더 컴포넌트
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [currentToast, setCurrentToast] = React.useState<ToastProps | null>(null);

  React.useEffect(() => {
    const unsubscribe = Toast.subscribe(setCurrentToast);
    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      {currentToast && (
        <ToastMessage
          {...currentToast}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: Spacing.container.md,
  },
  topPosition: {
    top: Platform.OS === 'ios' ? Spacing.safeArea.top + 10 : 20,
  },
  bottomPosition: {
    bottom: Platform.OS === 'ios' ? Spacing.safeArea.bottom + 20 : 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Spacing.radius.lg,
    paddingVertical: Spacing.spacing.lg,
    paddingHorizontal: Spacing.spacing.lg,
    marginHorizontal: Spacing.spacing.md,
    maxWidth: width - 40,
    minHeight: 60,
    ...{
      elevation: 6,
      shadowColor: Colors.shadow.medium,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: Spacing.spacing.lg,
    paddingTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.spacing.md,
  },
  title: {
    ...Typography.styles.label,
    color: Colors.text.primary,
    marginBottom: Spacing.spacing.xs,
  },
  message: {
    ...Typography.styles.body2,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
  },
  messageOnly: {
    ...Typography.styles.body1,
    color: Colors.text.primary,
  },
  actionContainer: {
    marginLeft: Spacing.spacing.md,
    justifyContent: 'center',
  },
  actionText: {
    ...Typography.styles.button,
    color: Colors.primary.main,
    textDecorationLine: 'underline',
  },
  closeButton: {
    padding: Spacing.spacing.xs,
    marginTop: -2,
    marginRight: -4,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.text.hint,
    lineHeight: 16,
  },
});