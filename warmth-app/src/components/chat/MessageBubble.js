import { LinearGradient } from 'expo-linear-gradient';
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
                    end={{ x: 0, y: 1 }}
                    style={[
                        styles.bubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                        !isUser && theme.shadows.bubble // Only AI bubble has shadow
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
        marginVertical: 4, // 8px gap between bubbles (4 top + 4 bottom)
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
        maxWidth: '75%', // Max width 75%
    },
    bubble: {
        borderRadius: 18, // Radius 18
        paddingHorizontal: 16, // Padding 16h
        paddingVertical: 14, // Padding 14v
    },
    userBubble: {
        borderWidth: 1,
        borderColor: theme.colors.userBubbleBorder, // #E9C6BE
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        borderWidth: 1,
        borderColor: theme.colors.aiBubbleBorder, // #F0D7C8
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...theme.typography.message,
        color: theme.colors.text,
    },
    userText: {
        color: theme.colors.text,
    },
    assistantText: {
        color: theme.colors.text,
    },
    timestamp: {
        ...theme.typography.timestamp,
        marginTop: 4,
        alignSelf: 'flex-end',
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
        justifyContent: 'flex-end', // Align chips to right for user
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
