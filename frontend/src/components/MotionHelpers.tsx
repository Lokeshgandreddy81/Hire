import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing
} from 'react-native-reanimated';
import { MOTION } from '../constants/motion';
import { IconCheck } from './Icons';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// =============================================================================
// 2️⃣ CARD TOUCH FEEDBACK & 3️⃣ SCROLL-BASED REVEAL
// =============================================================================

interface AnimatedCardProps {
    children: React.ReactNode;
    onPress: () => void;
    index: number;
    style?: ViewStyle;
    isHighConfidence?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    onPress,
    index,
    style,
    isHighConfidence = false,
}) => {
    // 3️⃣ SCROLL REVEAL (Staggered)
    const opacity = useSharedValue(MOTION.opacity.enterStart);
    const translateY = useSharedValue(MOTION.translate.revealOffsetY);

    // 2️⃣ TOUCH FEEDBACK
    const scale = useSharedValue(1);

    useEffect(() => {
        const delay = index * 40; // 40ms stagger
        opacity.value = withDelay(delay, withTiming(MOTION.opacity.enterEnd, {
            duration: MOTION.durations.standard,
            easing: MOTION.easings.out,
        }));
        translateY.value = withDelay(delay, withTiming(0, {
            duration: MOTION.durations.standard,
            easing: MOTION.easings.out,
        }));

        // 1️⃣ HIGH CONFIDENCE ANIMATION
        if (isHighConfidence) {
            scale.value = MOTION.scale.enterStart;
            scale.value = withDelay(delay, withTiming(MOTION.scale.enterEnd, {
                duration: MOTION.durations.emphasis,
                easing: MOTION.easings.out
            }));
        }
    }, [index, isHighConfidence]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(MOTION.scale.pressDown, {
            duration: MOTION.durations.fast,
            easing: MOTION.easings.standard,
        });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, {
            duration: MOTION.durations.standard,
            easing: MOTION.easings.out,
        });
    };

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            style={[
                style,
                animatedStyle,
                isHighConfidence && styles.highConfidenceBorder
            ]}
        >
            {children}
        </AnimatedTouchable>
    );
};

// =============================================================================
// 4️⃣ ACTION CONFIRMATION (BUTTONS)
// =============================================================================

interface AnimatedButtonProps {
    onPress: () => void;
    label: string;
    loadingLabel?: string;
    successLabel?: string;
    isLoading?: boolean;
    isSuccess?: boolean;
    style?: any;
    textStyle?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    onPress,
    label,
    loadingLabel = "Requesting...",
    successLabel = "Requested",
    isLoading = false,
    isSuccess = false,
    style,
    textStyle
}) => {
    const scale = useSharedValue(1);
    const checkOpacity = useSharedValue(0);

    useEffect(() => {
        if (isSuccess) {
            checkOpacity.value = withTiming(1, {
                duration: MOTION.durations.standard,
                easing: MOTION.easings.linear
            });
        } else {
            checkOpacity.value = 0;
        }
    }, [isSuccess]);

    const handlePressIn = () => {
        if (isLoading || isSuccess) return;
        scale.value = withTiming(0.98, { duration: MOTION.durations.instant });
    };

    const handlePressOut = () => {
        if (isLoading || isSuccess) return;
        scale.value = withTiming(1, { duration: MOTION.durations.instant });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const checkStyle = useAnimatedStyle(() => ({
        opacity: checkOpacity.value,
        marginRight: 8
    }));

    let currentLabel = label;
    if (isLoading) currentLabel = loadingLabel;
    if (isSuccess) currentLabel = successLabel;

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLoading || isSuccess}
            activeOpacity={1}
            style={[
                style,
                animatedStyle,
                isSuccess && styles.successButton,
                styles.buttonInner
            ]}
        >
            {isSuccess && (
                <Animated.View style={checkStyle}>
                    <IconCheck size={20} color="#fff" />
                </Animated.View>
            )}
            <Text style={[textStyle, isSuccess && styles.successText]}>
                {currentLabel}
            </Text>
        </AnimatedTouchable>
    );
};

// =============================================================================
// 6️⃣ EMPTY STATE BREATHING
// =============================================================================

export const BreathingBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(-MOTION.translate.floatOffsetY, { duration: MOTION.durations.breathing / 2, easing: MOTION.easings.linear }),
                withTiming(MOTION.translate.floatOffsetY, { duration: MOTION.durations.breathing / 2, easing: MOTION.easings.linear })
            ),
            -1, // Infinite
            true // Reverse
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <Animated.View style={animatedStyle}>
            {children}
        </Animated.View>
    );
};

// =============================================================================
// 5️⃣ CHAT MESSAGE MOTION
// =============================================================================

interface AnimatedMessageProps {
    children: React.ReactNode;
    style?: any;
    isMe: boolean;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ children, style, isMe }) => {
    const opacity = useSharedValue(MOTION.opacity.chatStart);
    const translateY = useSharedValue(MOTION.translate.chatOffsetY);

    useEffect(() => {
        const delay = isMe ? 0 : 100; // Received messages delay
        opacity.value = withDelay(delay, withTiming(1, {
            duration: MOTION.durations.standard,
            easing: MOTION.easings.out
        }));
        translateY.value = withDelay(delay, withTiming(0, {
            duration: MOTION.durations.standard,
            easing: MOTION.easings.out
        }));
    }, [isMe]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <Animated.View style={[style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    highConfidenceBorder: {
        borderWidth: 2,
        borderColor: 'rgba(124, 58, 237, 0.12)',
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    successButton: {
        backgroundColor: '#94a3b8',
        shadowOpacity: 0,
        elevation: 0,
    },
    successText: {
        color: 'white',
    }
});
