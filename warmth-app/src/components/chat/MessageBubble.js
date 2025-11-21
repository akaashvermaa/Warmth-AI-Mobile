import LinearGradient from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import theme from '../../theme';

const MessageBubble = React.memo(({ message, isUser, timestamp, emotions }) => {
    const containerStyle = isUser ? styles.userContainer : styles.assistantContainer;

    // Scale pop animation on entrance
    const scale = useSharedValue(0.95);

    React.useEffect(() => {
        scale.value = withSpring(1, {
            damping: 15,
            stiffness: 150,
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Animation: user messages slide from right, assistant from left
    const entering = isUser
        ? FadeInUp.duration(300).springify()
        : FadeInDown.duration(300).springify();

    // Gradient colors based on message type
    const gradientColors = isUser
        ? theme.colors.userBubbleGradient
        : theme.colors.aiBubbleGradient;

    return (
        <Animated.View
            style={[styles.container, containerStyle]}
            entering={entering}
        >
            <Animated.View style={[styles.bubbleWrapper, animatedStyle]}>
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.bubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                        theme.shadows.bubble
                    ]}
                >
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                        {message}
                    </Text>

                    {timestamp && (
                        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
                            {new Date(timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                        </Text>
                    )}
                </LinearGradient>
            </Animated.View>

            {/* Emotion chips for user messages - auto-detected */}
            {emotions && emotions.length > 0 && isUser && (
                <View style={styles.emotionChipsContainer}>
                    {emotions.slice(0, 3).map((emotion, index) => (
                        <View
                            key={index}
                            style={[
                                styles.emotionChip,
                                { backgroundColor: theme.colors.emotion[emotion.name?.toLowerCase()]?.bg || '#F5F5F5' }
                            ]}
                        >
                            <Text style={[
                                styles.emotionText,
                                { color: theme.colors.emotion[emotion.name?.toLowerCase()]?.text || theme.colors.textSecondary }
                            ]}>
                                {emotion.emoji || '💭'} {emotion.name}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    assistantContainer: {
        alignItems: 'flex-start',
    },
    bubbleWrapper: {
        maxWidth: '80%',
    },
    bubble: {
        borderRadius: theme.borderRadius.bubble,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm + 2,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...theme.typography.message,
        color: theme.colors.text,
    },
    userText: {
        color: '#2D2D2D',  // Dark text on light gradient
    },
    assistantText: {
        color: theme.colors.text,
    },
    timestamp: {
        ...theme.typography.timestamp,
        marginTop: theme.spacing.xs,
    },
    userTimestamp: {
        color: '#999999',
    },
    assistantTimestamp: {
        color: theme.colors.textQuiet,
    },
    emotionChipsContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.xs,
        gap: theme.spacing.xs,
        flexWrap: 'wrap',
    },
    emotionChip: {
        borderRadius: 12,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
    },
    emotionText: {
        ...theme.typography.caption,
    },
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
