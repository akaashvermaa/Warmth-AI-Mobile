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

    // Animation: gentler, faster transitions (220ms ease-out)
    const entering = isUser
        ? FadeInUp.duration(220)
        : FadeInDown.duration(220);

    return (
        <Animated.View
            style={[styles.container, containerStyle]}
            entering={entering}
        >
            <Animated.View style={[styles.bubbleWrapper, animatedStyle]}>
                <View
                    style={[
                        styles.bubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                        !isUser && theme.shadows.soft // Only AI bubble has shadow
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
                </View>
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
        marginVertical: 6,
        paddingHorizontal: theme.spacing.md,
        width: '100%',
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    userBubble: {
        backgroundColor: theme.colors.userBubble,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: theme.colors.aiBubble,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.aiBubbleBorder,
    },
    messageText: {
        ...theme.typography.message,
    },
    userText: {
        color: theme.colors.userBubbleText,
    },
    assistantText: {
        color: theme.colors.aiBubbleText,
    },
    timestamp: {
        ...theme.typography.caption,
        fontSize: 11,
        marginTop: 6,
        alignSelf: 'flex-end',
        opacity: 0.7,
    },
    userTimestamp: {
        color: theme.colors.textSecondary,
    },
    assistantTimestamp: {
        color: theme.colors.textSecondary,
    },
    emotionChipsContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.xs,
        gap: theme.spacing.xs,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    emotionChip: {
        borderRadius: 12,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
    },
    emotionText: {
        ...theme.typography.caption,
        fontSize: 11,
    },
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
