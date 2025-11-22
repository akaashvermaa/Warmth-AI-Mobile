import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import api from '../services/api';
import theme from '../theme';

const { width } = Dimensions.get('window');

// Mock data for the 3-Day Mood Graph
const MOOD_HISTORY = [
    { day: 'Mon', value: 3, label: 'Neutral' },
    { day: 'Tue', value: 4, label: 'Good' },
    { day: 'Wed', value: 2, label: 'Anxious' },
];

const MoodGraph = () => {
    const graphHeight = 60;
    const graphWidth = width - 80;
    const stepX = graphWidth / (MOOD_HISTORY.length - 1);

    const getY = (value) => graphHeight - ((value - 1) / 4) * graphHeight;

    const points = MOOD_HISTORY.map((item, index) => ({
        x: index * stepX + 10,
        y: getY(item.value),
        ...item
    }));

    const pathData = points.reduce((acc, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        return `${acc} L ${point.x} ${point.y}`;
    }, '');

    return (
        <View style={styles.graphContainer}>
            <Text style={styles.graphTitle}>3-Day Mood Flow</Text>
            <Svg height={graphHeight + 20} width={graphWidth + 20}>
                <Path
                    d={pathData}
                    stroke={theme.colors.primary}
                    strokeWidth="2"
                    fill="none"
                />
                {points.map((point, index) => (
                    <Circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill={theme.colors.background}
                        stroke={theme.colors.primary}
                        strokeWidth="2"
                    />
                ))}
            </Svg>
            <View style={styles.graphLabels}>
                {MOOD_HISTORY.map((item, index) => (
                    <Text key={index} style={styles.graphLabelText}>{item.day}</Text>
                ))}
            </View>
        </View>
    );
};

const JournalCard = React.memo(({ date, preview, mood, index }) => (
    <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={styles.journalCardWrapper}
    >
        <BlurView intensity={20} tint="light" style={styles.journalCard}>
            <View style={styles.journalHeader}>
                <Text style={styles.journalDate}>{date}</Text>
                <Text style={styles.journalMood}>{mood}</Text>
            </View>
            <Text style={styles.journalPreview} numberOfLines={2}>{preview}</Text>
        </BlurView>
    </Animated.View>
));

const JournalsScreen = ({ navigation }) => {
    const [recap, setRecap] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecap();
    }, []);

    const loadRecap = async () => {
        try {
            setLoading(true);
            const data = await api.getLatestRecap().catch(() => null);
            setRecap(data?.recap || {
                headline: "Finding Balance",
                narrative: "You've been navigating some ups and downs lately, showing real resilience.",
                recommendations: [{ type: 'breathing', title: 'Deep Breath', description: 'Take a moment to center yourself.' }]
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Journal</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. Small 3-Day Mood Graph */}
                    <MoodGraph />

                    {/* 2. AI Recap Card */}
                    <Animated.View entering={FadeIn.duration(600)} style={styles.recapCard}>
                        <BlurView intensity={30} tint="light" style={styles.recapBlur}>
                            <Text style={styles.recapTitle}>Your mood the last 3 days…</Text>
                            <Text style={styles.recapHeadline}>{recap?.headline || "Gathering insights..."}</Text>
                            <Text style={styles.recapNarrative}>{recap?.narrative || "Keep chatting to see your summary here."}</Text>

                            {recap?.recommendations?.[0] && (
                                <View style={styles.tinyAdvice}>
                                    <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
                                    <Text style={styles.tinyAdviceText}>{recap.recommendations[0].title}</Text>
                                </View>
                            )}
                        </BlurView>
                    </Animated.View>

                    {/* 3. Recent Small Journals List */}
                    <Text style={styles.sectionTitle}>Recent Entries</Text>
                    <JournalCard
                        date="Today, 9:41 AM"
                        mood="Calm"
                        preview="Started the day feeling a bit anxious but breathing helped..."
                        index={0}
                    />
                    <JournalCard
                        date="Yesterday"
                        mood="Tired"
                        preview="Long day at work. Need to focus on rest tonight."
                        index={1}
                    />
                    <JournalCard
                        date="Mon, Oct 24"
                        mood="Inspired"
                        preview="Had a great idea for the new project!"
                        index={2}
                    />

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
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    // Graph Styles
    graphContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    graphTitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        fontFamily: theme.typography.caption.fontFamily,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    graphLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: width - 80,
        marginTop: theme.spacing.xs,
    },
    graphLabelText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.caption.fontFamily,
    },
    // Recap Card Styles
    recapCard: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    },
    recapBlur: {
        padding: theme.spacing.lg,
    },
    recapTitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        fontFamily: theme.typography.caption.fontFamily,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recapHeadline: {
        fontSize: 22,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        fontFamily: theme.typography.heading.fontFamily,
    },
    recapNarrative: {
        fontSize: 15,
        lineHeight: 24,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        marginBottom: theme.spacing.md,
        opacity: 0.8,
    },
    tinyAdvice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(201, 116, 84, 0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tinyAdviceText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600',
        fontFamily: theme.typography.caption.fontFamily,
    },
    // Journal List Styles
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        marginLeft: theme.spacing.xs,
        fontFamily: theme.typography.heading.fontFamily,
    },
    journalCardWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    journalCard: {
        padding: theme.spacing.md,
    },
    journalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    journalDate: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
    },
    journalMood: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.caption.fontFamily,
    },
    journalPreview: {
        fontSize: 14,
        color: theme.colors.text,
        opacity: 0.7,
        lineHeight: 20,
        fontFamily: theme.typography.body.fontFamily,
    },
});

export default JournalsScreen;
