import { Animated, Easing } from 'react-native';

/**
 * 애니메이션 상수 및 유틸리티
 */

// 애니메이션 지속 시간
export const AnimationDuration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// 이징 함수
export const AnimationEasing = {
  ease: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  linear: Easing.linear,
  spring: Easing.elastic(1.2),
} as const;

// 스크린 전환 애니메이션 설정
export const ScreenTransitions = {
  slideFromRight: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationDuration.normal,
          easing: AnimationEasing.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationDuration.normal,
          easing: AnimationEasing.easeIn,
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => ({
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    }),
  },
  slideFromBottom: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationDuration.normal,
          easing: AnimationEasing.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationDuration.normal,
          easing: AnimationEasing.easeIn,
        },
      },
    },
    cardStyleInterpolator: ({ current, layouts }: any) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    }),
  },
  fadeIn: {
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationDuration.normal,
          easing: AnimationEasing.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationDuration.fast,
          easing: AnimationEasing.easeIn,
        },
      },
    },
    cardStyleInterpolator: ({ current }: any) => ({
      cardStyle: {
        opacity: current.progress,
      },
    }),
  },
} as const;

// 리스트 아이템 애니메이션 클래스
export class ListItemAnimation {
  private animatedValue: Animated.Value;

  constructor(initialValue = 0) {
    this.animatedValue = new Animated.Value(initialValue);
  }

  // 페이드인 애니메이션
  fadeIn(duration = AnimationDuration.normal): Animated.CompositeAnimation {
    return Animated.timing(this.animatedValue, {
      toValue: 1,
      duration,
      easing: AnimationEasing.easeOut,
      useNativeDriver: true,
    });
  }

  // 페이드아웃 애니메이션
  fadeOut(duration = AnimationDuration.fast): Animated.CompositeAnimation {
    return Animated.timing(this.animatedValue, {
      toValue: 0,
      duration,
      easing: AnimationEasing.easeIn,
      useNativeDriver: true,
    });
  }

  // 슬라이드 애니메이션
  slideIn(direction: 'left' | 'right' | 'up' | 'down' = 'left', duration = AnimationDuration.normal) {
    this.animatedValue.setValue(direction === 'left' || direction === 'up' ? -100 : 100);
    return Animated.timing(this.animatedValue, {
      toValue: 0,
      duration,
      easing: AnimationEasing.easeOut,
      useNativeDriver: true,
    });
  }

  // 스케일 애니메이션
  scale(toValue = 1, duration = AnimationDuration.normal): Animated.CompositeAnimation {
    return Animated.timing(this.animatedValue, {
      toValue,
      duration,
      easing: AnimationEasing.easeOut,
      useNativeDriver: true,
    });
  }

  // 스프링 애니메이션
  spring(toValue = 1): Animated.CompositeAnimation {
    return Animated.spring(this.animatedValue, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });
  }

  // 애니메이션 값 반환
  getValue(): Animated.Value {
    return this.animatedValue;
  }

  // 현재 값 설정
  setValue(value: number): void {
    this.animatedValue.setValue(value);
  }
}

// 버튼 피드백 애니메이션
export class ButtonFeedbackAnimation {
  private scaleValue: Animated.Value;
  private opacityValue: Animated.Value;

  constructor() {
    this.scaleValue = new Animated.Value(1);
    this.opacityValue = new Animated.Value(1);
  }

  // 터치 시작 애니메이션
  pressIn(): Animated.CompositeAnimation {
    return Animated.parallel([
      Animated.timing(this.scaleValue, {
        toValue: 0.95,
        duration: AnimationDuration.fast,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(this.opacityValue, {
        toValue: 0.7,
        duration: AnimationDuration.fast,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
    ]);
  }

  // 터치 종료 애니메이션
  pressOut(): Animated.CompositeAnimation {
    return Animated.parallel([
      Animated.timing(this.scaleValue, {
        toValue: 1,
        duration: AnimationDuration.fast,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(this.opacityValue, {
        toValue: 1,
        duration: AnimationDuration.fast,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
    ]);
  }

  // 펄스 애니메이션 (성공 등의 피드백)
  pulse(): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(this.scaleValue, {
        toValue: 1.05,
        duration: AnimationDuration.fast,
        easing: AnimationEasing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(this.scaleValue, {
        toValue: 1,
        duration: AnimationDuration.fast,
        easing: AnimationEasing.easeIn,
        useNativeDriver: true,
      }),
    ]);
  }

  // 흔들기 애니메이션 (에러 피드백)
  shake(): Animated.CompositeAnimation {
    const shakeAnimation = (direction: number) =>
      Animated.timing(this.scaleValue, {
        toValue: direction,
        duration: 100,
        easing: AnimationEasing.linear,
        useNativeDriver: true,
      });

    return Animated.sequence([
      shakeAnimation(1.02),
      shakeAnimation(0.98),
      shakeAnimation(1.02),
      shakeAnimation(0.98),
      shakeAnimation(1),
    ]);
  }

  // 애니메이션 스타일 반환
  getAnimatedStyle() {
    return {
      transform: [{ scale: this.scaleValue }],
      opacity: this.opacityValue,
    };
  }

  // 값들 초기화
  reset(): void {
    this.scaleValue.setValue(1);
    this.opacityValue.setValue(1);
  }
}

// 스태거드 애니메이션 (순차적 애니메이션)
export const createStaggeredAnimation = (
  animations: Animated.CompositeAnimation[],
  delay = 50
): Animated.CompositeAnimation => {
  const staggered = animations.map((animation, index) =>
    Animated.timing(new Animated.Value(0), {
      toValue: 1,
      delay: delay * index,
      duration: 0,
      useNativeDriver: true,
    })
  );

  return Animated.stagger(delay, animations);
};

// 인터폴레이션 헬퍼 함수
export const interpolateColor = (
  animatedValue: Animated.Value,
  inputRange: number[],
  outputRange: string[]
): Animated.AnimatedInterpolation => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });
};

export const interpolateRotation = (
  animatedValue: Animated.Value,
  rotations = ['0deg', '360deg']
): Animated.AnimatedInterpolation => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: rotations,
    extrapolate: 'clamp',
  });
};