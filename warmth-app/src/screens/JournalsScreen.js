import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import Header from '../components/common/Header';
import ScreenWrapper from '../components/common/ScreenWrapper';
import api from '../services/api';
import theme from '../theme';

const { width } = Dimensions.get('window');

const MoodGraph = ({ data }) => {
    const graphHeight = 60;
    const graphWidth = width - 80;

    if (!data || data.length === 0) {
        return (
            <View style={styles.graphContainer}>
                <Text style={styles.graphTitle}>Mood Flow</Text>
                <Text style={styles.emptyText}>No mood data yet</Text>
            </View>
        );
    }

    const stepX = graphWidth / (data.length - 1 || 1);
    const getY = (value) => graphHeight - ((value - 1) / 4) * graphHeight;

    const points = data.map((item, index) => ({
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
            <Text style={styles.graphTitle}>Mood Flow</Text>
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
                {data.map((item, index) => (
                    <Text key={index} style={styles.graphLabelText}>{item.day}</Text>
                ))}
            </View>
        </View>
    );
};

const JournalCard = React.memo(({ journal, onPress, onDelete, index }) => (
    <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={styles.journalCardWrapper}
    >
        <TouchableOpacity
            onPress={() => onPress(journal)}
            activeOpacity={0.7}
        >
            <BlurView intensity={20} tint="light" style={styles.journalCard}>
                <View style={styles.journalHeader}>
                    <Text style={styles.journalDate}>
                        {new Date(journal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {journal.mood_score !== null && (
                        <Text style={styles.journalMood}>Mood: {journal.mood_score}</Text>
                    )}
                </View>
                <Text style={styles.journalTitle} numberOfLines={1}>{journal.title}</Text>
                <Text style={styles.journalPreview} numberOfLines={2}>{journal.content}</Text>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDelete(journal.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </BlurView>
        </TouchableOpacity>
    </Animated.View>
));

const JournalsScreen = ({ navigation }) => {
    const [recap, setRecap] = useState(null);
    const [moodHistory, setMoodHistory] = useState([]);
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadRecap(),
                loadMoodHistory(),
                loadJournals()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadRecap = async () => {
        try {
            const data = await api.getLatestRecap();
            setRecap(data?.recap || null);
        } catch (error) {
            // 404 is expected if no recap exists yet
            if (error.message && (error.message.includes('No recap available') || error.message.includes('404'))) {
                setRecap(null);
            } else {
                console.error('Failed to load recap:', error);
            }
        }
    };

    const loadMoodHistory = async () => {
        try {
            const data = await api.getMoodHistory();
            if (data?.mood_logs && data.mood_logs.length > 0) {
                const recentMoods = data.mood_logs.slice(-7);
                const graphData = recentMoods.map(log => ({
                    day: new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
                    value: (log.score + 1) * 2.5,
                    label: log.label || 'Neutral'
                }));
                setMoodHistory(graphData);
            } else {
                setMoodHistory([]);
            }
        } catch (error) {
            console.error('Failed to load mood history:', error);
        }
    };

    const loadJournals = async () => {
        try {
            const data = await api.getJournal();
            if (Array.isArray(data)) {
                setJournals(data);
            } else {
                setJournals([]);
            }
        } catch (error) {
            console.error('Failed to load journals:', error);
        }
    };

    const handleCreateJournal = async () => {
        if (!newContent.trim()) {
            Alert.alert('Empty Entry', 'Please write something in your journal.');
            return;
        }

        setSaving(true);
        try {
            await api.createJournal({
                title: newTitle || 'Untitled Entry',
                content: newContent,
                mood_score: null // Optional: Add mood selector later
            });

            setModalVisible(false);
            setNewTitle('');
            setNewContent('');
            loadJournals(); // Refresh list
        } catch (error) {
            Alert.alert('Error', 'Failed to save journal entry.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteJournal = (id) => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this journal entry?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.deleteJournal(id);
                            setJournals(prev => prev.filter(j => j.id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete entry.');
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    };

    return (
        <ScreenWrapper>
            <Header
                title="Journal & Insights"
                showBack
                rightIcon="add"
                onRightPress={() => setModalVisible(true)}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* 1. Mood Graph */}
                <MoodGraph data={moodHistory} />

                {/* 2. AI Recap Card */}
                {recap && (
                    <Animated.View entering={FadeIn.duration(600)} style={styles.recapCard}>
                        <BlurView intensity={30} tint="light" style={styles.recapBlur}>
                            <Text style={styles.recapTitle}>Your mood the last 3 days…</Text>
                            <Text style={styles.recapHeadline}>{recap.headline}</Text>
                            <Text style={styles.recapNarrative}>{recap.narrative}</Text>

                            {recap.recommendations?.[0] && (
                                <View style={styles.tinyAdvice}>
                                    <Ionicons name="sparkles" size={12} color={theme.colors.primary} />
                                    <Text style={styles.tinyAdviceText}>{recap.recommendations[0].title}</Text>
                                </View>
                            )}
                        </BlurView>
                    </Animated.View>
                )}

                {/* 3. Journals List */}
                <Text style={styles.sectionTitle}>Your Entries</Text>
                {journals.length > 0 ? (
                    journals.map((journal, index) => (
                        <JournalCard
                            key={journal.id}
                            journal={journal}
                            onPress={(j) => Alert.alert(j.title, j.content)} // Simple view for now
                            onDelete={handleDeleteJournal}
                            index={index}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="journal-outline" size={48} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No journal entries yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to create your first entry</Text>
                    </View>
                )}
            </ScrollView>

            {/* Create Journal Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <ScreenWrapper gradient={false} style={{ backgroundColor: '#FFF' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>New Entry</Text>
                        <TouchableOpacity onPress={handleCreateJournal} disabled={saving}>
                            <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView style={styles.modalContent}>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="Title (Optional)"
                                value={newTitle}
                                onChangeText={setNewTitle}
                                placeholderTextColor={theme.colors.textSecondary}
                            />
                            <TextInput
                                style={styles.contentInput}
                                placeholder="What's on your mind?"
                                value={newContent}
                                onChangeText={setNewContent}
                                multiline
                                textAlignVertical="top"
                                placeholderTextColor={theme.colors.textSecondary}
                                autoFocus
                            />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </ScreenWrapper>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
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
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceGlass,
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
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceGlass,
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
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.caption.fontFamily,
    },
    journalMood: {
        fontSize: 12,
        color: theme.colors.primary,
        fontFamily: theme.typography.caption.fontFamily,
        fontWeight: '600',
    },
    journalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
        fontFamily: theme.typography.heading.fontFamily,
    },
    journalPreview: {
        fontSize: 14,
        color: theme.colors.text,
        opacity: 0.7,
        lineHeight: 20,
        fontFamily: theme.typography.body.fontFamily,
    },
    deleteButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        padding: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
        fontFamily: theme.typography.body.fontFamily,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.textQuiet,
        marginTop: theme.spacing.xs,
        fontFamily: theme.typography.caption.fontFamily,
    },
    // Modal Styles
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    modalCancel: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
    },
    modalSave: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
        fontFamily: theme.typography.body.fontFamily,
    },
    modalContent: {
        flex: 1,
        padding: theme.spacing.md,
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
        marginBottom: theme.spacing.lg,
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        minHeight: 200,
    },
});

export default JournalsScreen;
