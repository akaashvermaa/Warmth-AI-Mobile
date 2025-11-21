import LinearGradient from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '../services/api';
import theme from '../theme';

const SettingsScreen = ({ navigation }) => {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        try {
            // TODO: Implement memory graph endpoint
            // For now, show placeholder
            setMemories([
                { id: 1, topic: 'Work', count: 24, snippet: 'Feeling stressed lately...' },
                { id: 2, topic: 'Family', count: 18, snippet: 'Mom\'s health improving...' },
                { id: 3, topic: 'Creative Projects', count: 12, snippet: 'New painting started...' },
            ]);
        } catch (error) {
            console.error('Error loading memories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const data = await api.exportAllData();
            Alert.alert('Success', 'Data exported successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'Are you sure? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.eraseAllData();
                            Alert.alert('Success', 'All data cleared');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    },
                },
            ]
        );
    };

    return (
        <LinearGradient
            colors={theme.colors.backgroundGradient}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>

                    <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
                        <Text style={styles.settingText}>Export All Data</Text>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
                        <Text style={[styles.settingText, styles.dangerText]}>Clear All Data</Text>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Text style={styles.settingText}>Privacy</Text>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Text style={styles.settingText}>About Warmth AI</Text>
                        <Text style={styles.settingArrow}>→</Text>
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Memories Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Memories</Text>
                    <Text style={styles.sectionSubtitle}>
                        AI-generated emotional snapshots from your conversations
                    </Text>

                    {loading ? (
                        <Text style={styles.loadingText}>Loading memories...</Text>
                    ) : (
                        memories.map((memory, index) => (
                            <Animated.View
                                key={memory.id}
                                entering={FadeInDown.delay(index * 100).duration(300)}
                            >
                                <View style={[styles.memoryCard, theme.shadows.card]}>
                                    <View style={styles.memoryHeader}>
                                        <Text style={styles.memoryTopic}>{memory.topic}</Text>
                                        <Text style={styles.memoryCount}>{memory.count} mentions</Text>
                                    </View>
                                    <Text style={styles.memorySnippet}>"{memory.snippet}"</Text>
                                </View>
                            </Animated.View>
                        ))
                    )}

                    {!loading && memories.length === 0 && (
                        <Text style={styles.emptyText}>
                            No memories yet. Keep chatting to build your memory graph!
                        </Text>
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.lg,
    },
    backButton: {
        marginRight: theme.spacing.md,
    },
    backText: {
        fontSize: 24,
        color: theme.colors.primary,
    },
    title: {
        ...theme.typography.heading,
        color: theme.colors.text,
    },
    section: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.subheading,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    sectionSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    settingText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    dangerText: {
        color: theme.colors.primary,
    },
    settingArrow: {
        fontSize: 18,
        color: theme.colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
    },
    memoryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    memoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    memoryTopic: {
        ...theme.typography.subheading,
        fontSize: 16,
        color: theme.colors.text,
    },
    memoryCount: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    memorySnippet: {
        ...theme.typography.body,
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    loadingText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
    },
});

export default SettingsScreen;
