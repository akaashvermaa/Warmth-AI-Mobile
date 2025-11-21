import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import api from '../services/api';
import theme from '../theme';

const EmotionChip = ({ emotion, emoji }) => (
    <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.emotionChip}>
        <Text style={styles.emotionEmoji}>{emoji}</Text>
        <Text style={styles.emotionName}>{emotion}</Text>
    </Animated.View>
);

const RecommendationCard = ({ emoji, title, description, action, onPress, index }) => (
    <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400).springify()}
        style={styles.recommendationCard}
    >
        <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationEmoji}>{emoji}</Text>
            <Text style={styles.recommendationTitle}>{title}</Text>
        </View>
        <Text style={styles.recommendationDescription}>{description}</Text>
        {action && (
            <TouchableOpacity
                style={styles.recommendationButton}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={styles.recommendationButtonText}>{action}</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
        )}
    </Animated.View>
);

const JournalsScreen = ({ navigation }) => {
    const [recap, setRecap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRecap();
    }, []);

    const loadRecap = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getLatestRecap();
            setRecap(data.recap);
        } catch (err) {
            console.error('Failed to load recap:', err);
            setError('Unable to load your emotional recap. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecommendationPress = (recommendation) => {
        // Navigate based on recommendation type
        if (recommendation.type === 'breathing') {
            navigation.navigate('WarmMoments', { activity: 'breathing' });
        } else if (recommendation.type === 'chat') {
            navigation.navigate('Chat');
        }
    };

    if (loading) {
        return (
            <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" />
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading your journal...</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (error || !recap) {
        return (
            <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" />
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            accessibilityLabel="Go back"
                        >
                            <Text style={styles.backText}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Journals & Advice</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>📔</Text>
                        <Text style={styles.emptyTitle}>Your journal is waiting</Text>
                        <Text style={styles.emptyMessage}>
                            Keep chatting with Warmth, and I'll create a beautiful 3-day journal for you with personalized insights and advice.
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const emotions = recap.top_emotions || [];
    const topics = recap.key_topics || [];
    const recommendations = recap.recommendations || [];

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Go back"
                    >
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Journals & Advice</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Headline */}
                    <Animated.View entering={FadeIn.duration(600)} style={styles.headlineContainer}>
                        <Text style={styles.headline}>{recap.headline}</Text>
                    </Animated.View>

                    {/* Narrative */}
                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.narrativeCard}>
                        <Text style={styles.narrativeText}>{recap.narrative}</Text>
                    </Animated.View>

                    {/* Emotions */}
                    {emotions.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How You've Been Feeling</Text>
                            <View style={styles.emotionChipsContainer}>
                                {emotions.map((emotion, index) => (
                                    <EmotionChip
                                        key={index}
                                        emotion={emotion.name}
                                        emoji={emotion.emoji}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Topics */}
                    {topics.length > 0 && (
                        <Animated.View
                            entering={FadeInDown.delay(300).duration(500)}
                            style={styles.section}
                        >
                            <Text style={styles.sectionTitle}>What's Been On Your Mind</Text>
                            <View style={styles.topicsContainer}>
                                {topics.map((topic, index) => (
                                    <View key={index} style={styles.topicTag}>
                                        <Text style={styles.topicText}>{topic}</Text>
                                    </View>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Gentle Recommendations</Text>
                            {recommendations.map((rec, index) => (
                                <RecommendationCard
                                    key={index}
                                    index={index}
                                    emoji={rec.emoji}
                                    title={rec.title}
                                    description={rec.description}
                                    action={rec.action}
                                    onPress={() => handleRecommendationPress(rec)}
                                />
                            ))}
                        </View>
                    )}

                    {/* Date Range */}
                    <Animated.View
                        entering={FadeIn.delay(600).duration(400)}
                        style={styles.dateContainer}
                    >
                        <Text style={styles.dateText}>
                            {new Date(recap.start_date).toLocaleDateString()} - {new Date(recap.end_date).toLocaleDateString()}
                        </Text>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backText: {
        fontSize: 24,
        color: theme.colors.primary,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 44,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: theme.spacing.sm,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxl,
    },
    headlineContainer: {
        marginBottom: theme.spacing.lg,
    },
    headline: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
        lineHeight: 32,
    },
    narrativeCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    narrativeText: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
        marginBottom: theme.spacing.md,
    },
    emotionChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    emotionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
    },
    emotionEmoji: {
        fontSize: 20,
    },
    emotionName: {
        fontSize: 14,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        fontWeight: '500',
    },
    topicsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    topicTag: {
        backgroundColor: theme.colors.primary + '10',
        borderRadius: 12,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
    },
    topicText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontFamily: theme.typography.body.fontFamily,
        fontWeight: '500',
    },
    recommendationCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.primary + '10',
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    recommendationEmoji: {
        fontSize: 24,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        flex: 1,
    },
    recommendationDescription: {
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
        marginBottom: theme.spacing.md,
    },
    recommendationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary + '10',
        borderRadius: 12,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    recommendationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
        fontFamily: theme.typography.body.fontFamily,
    },
    dateContainer: {
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.caption.fontFamily,
    },
});

export default JournalsScreen;
