import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import theme from '../../theme';

const TypingIndicator = () => {
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);

    useEffect(() => {
        // Staggered animation for each dot
        dot1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400 }),
                withTiming(0, { duration: 400 })
            ),
            -1, // Infinite
            false
        );

        dot2.value = withRepeat(
            withSequence(
                withDelay(133, withTiming(1, { duration: 400 })),
                withTiming(0, { duration: 400 })
            ),
            -1,
            false
        );

        dot3.value = withRepeat(
            withSequence(
                withDelay(266, withTiming(1, { duration: 400 })),
                withTiming(0, { duration: 400 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle1 = useAnimatedStyle(() => ({
        opacity: 0.3 + (dot1.value * 0.7),
        transform: [{ translateY: -dot1.value * 4 }],
    }));

    const animatedStyle2 = useAnimatedStyle(() => ({
        opacity: 0.3 + (dot2.value * 0.7),
        transform: [{ translateY: -dot2.value * 4 }],
    }));

    const animatedStyle3 = useAnimatedStyle(() => ({
        opacity: 0.3 + (dot3.value * 0.7),
        transform: [{ translateY: -dot3.value * 4 }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Animated.View style={[styles.dot, animatedStyle1]} />
                <Animated.View style={[styles.dot, animatedStyle2]} />
                <Animated.View style={[styles.dot, animatedStyle3]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'flex-start',
    },
    bubble: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm + 2,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.textSecondary,
    },
});

export default TypingIndicator;
