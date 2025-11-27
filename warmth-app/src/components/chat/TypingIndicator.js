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
        dot1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 600 }),
                withTiming(0, { duration: 600 })
            ),
            -1,
            false
        );

        dot2.value = withRepeat(
            withSequence(
                withDelay(200, withTiming(1, { duration: 600 })),
                withTiming(0, { duration: 600 })
            ),
            -1,
            false
        );

        dot3.value = withRepeat(
            withSequence(
                withDelay(400, withTiming(1, { duration: 600 })),
                withTiming(0, { duration: 600 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle1 = useAnimatedStyle(() => ({
        opacity: 0.3 + (dot1.value * 0.7),
        transform: [{ translateY: -dot1.value * 3 }],
    }));

    const animatedStyle2 = useAnimatedStyle(() => ({
        opacity: 0.3 + (dot2.value * 0.7),
        transform: [{ translateY: -dot2.value * 3 }],
    }));

    const animatedStyle3 = useAnimatedStyle(() => ({
        opacity: 0.3 + (dot3.value * 0.7),
        transform: [{ translateY: -dot3.value * 3 }],
    }));

    return (
        <View style={styles.container}>
            <View style={[styles.bubble, theme.shadows.soft]}>
                <Animated.View style={[styles.dot, animatedStyle1]} />
                <Animated.View style={[styles.dot, animatedStyle2]} />
                <Animated.View style={[styles.dot, animatedStyle3]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 6,
        paddingHorizontal: theme.spacing.md,
        alignItems: 'flex-start',
    },
    bubble: {
        flexDirection: 'row',
        backgroundColor: theme.colors.aiBubble,
        borderRadius: theme.borderRadius.bubble,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.aiBubbleBorder,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.textSecondary,
    },
});

export default TypingIndicator;
