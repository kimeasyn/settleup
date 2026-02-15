import React, { useRef, useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ButtonFeedbackAnimation } from '../constants/Animations';

interface AnimatedButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  feedbackType?: 'scale' | 'pulse' | 'shake';
}

export default function AnimatedButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  feedbackType = 'scale',
}: AnimatedButtonProps) {
  const animationRef = useRef(new ButtonFeedbackAnimation());
  const processingRef = useRef(false);
  const [processing, setProcessing] = useState(false);

  const handlePressIn = () => {
    if (disabled || processing) return;
    animationRef.current.pressIn().start();
  };

  const handlePressOut = () => {
    if (disabled || processing) return;
    animationRef.current.pressOut().start();
  };

  const handlePress = useCallback((event: GestureResponderEvent) => {
    if (disabled || !onPress || processingRef.current) return;

    // 피드백 애니메이션 실행
    if (feedbackType === 'pulse') {
      animationRef.current.pulse().start();
    } else if (feedbackType === 'shake') {
      animationRef.current.shake().start();
    }

    const result = onPress(event);

    if (result && typeof result.then === 'function') {
      processingRef.current = true;
      setProcessing(true);
      result.finally(() => {
        processingRef.current = false;
        setProcessing(false);
      });
    }
  }, [disabled, onPress, feedbackType]);

  const isDisabled = disabled || processing;

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${size}Button`], styles[`${variant}Button`]];

    if (isDisabled) {
      baseStyle.push(styles.disabledButton);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${size}Text`], styles[`${variant}Text`]];

    if (isDisabled) {
      baseStyle.push(styles.disabledText);
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || processing}
      activeOpacity={1}
    >
      <Animated.View style={animationRef.current.getAnimatedStyle()}>
        <Text style={getTextStyle()}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 기본 버튼 스타일
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  // 크기별 스타일
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  mediumButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  largeButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },

  // 변형별 버튼 색상
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },

  // 비활성화 스타일
  disabledButton: {
    backgroundColor: '#BDBDBD',
    borderColor: '#BDBDBD',
  },

  // 텍스트 기본 스타일
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // 크기별 텍스트 스타일
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },

  // 변형별 텍스트 색상
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#2196F3',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  successText: {
    color: '#FFFFFF',
  },

  // 비활성화 텍스트
  disabledText: {
    color: '#757575',
  },
});

// 미리 정의된 버튼 스타일 Export
export const ButtonVariants = {
  primary: {
    variant: 'primary' as const,
    size: 'medium' as const,
    feedbackType: 'scale' as const,
  },
  secondary: {
    variant: 'secondary' as const,
    size: 'medium' as const,
    feedbackType: 'scale' as const,
  },
  danger: {
    variant: 'danger' as const,
    size: 'medium' as const,
    feedbackType: 'shake' as const,
  },
  success: {
    variant: 'success' as const,
    size: 'medium' as const,
    feedbackType: 'pulse' as const,
  },
};