import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import api from '../services/api';
import theme from '../theme';

const Section = React.memo(({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContentWrapper}>
            <BlurView intensity={20} tint="light" style={styles.sectionContent}>
                {children}
            </BlurView>
        </View>
    </View>
));

const SettingItem = React.memo(({ label, value, type = 'arrow', onPress, danger = false, icon }) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={type === 'switch'}
        activeOpacity={0.7}
    >
        <View style={styles.settingLeft}>
            {icon && <Ionicons name={icon} size={20} color={danger ? theme.colors.primary : theme.colors.textSecondary} style={styles.settingIcon} />}
            <Text style={[styles.settingLabel, danger && styles.dangerText]}>{label}</Text>
        </View>

        {type === 'switch' && (
            <Switch
                value={value}
                onValueChange={onPress}
                trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
                thumbColor="#FFFFFF"
            />
        )}

        {type === 'arrow' && (
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        )}

        {type === 'value' && (
            <Text style={styles.settingValue}>{value}</Text>
        )}
    </TouchableOpacity>
));

const SettingsScreen = ({ navigation, onLogout }) => {
    const [enterToSend, setEnterToSend] = useState(true);
    const [compactMode, setCompactMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [tonePreference, setTonePreference] = useState('neutral'); // New: tone control
    const [memoryCount, setMemoryCount] = useState(null); // null = loading
    const [loading, setLoading] = useState(true);

    // Fetch memory count on mount
    useEffect(() => {
        fetchMemoryCount();
    }, []);

    const fetchMemoryCount = async () => {
        try {
            const data = await api.exportAllData();
            const count = (data.memories?.length || 0);
            setMemoryCount(count);
        } catch (error) {
            console.error('Failed to fetch memory count:', error);
            setMemoryCount(0);
        } finally {
            setLoading(false);
        }
    };

    const getToneLabel = () => {
        switch (tonePreference) {
            case 'neutral': return 'Neutral';
            case 'empathetic': return 'Empathetic';
            case 'playful': return 'Playful';
            default: return 'Neutral';
        }
    };

    const handleToneChange = () => {
        // Cycle through tones
        const tones = ['neutral', 'empathetic', 'playful'];
        const currentIndex = tones.indexOf(tonePreference);
        const nextIndex = (currentIndex + 1) % tones.length;
        setTonePreference(tones[nextIndex]);
    };

    const handleExportData = async () => {
        try {
            const data = await api.exportAllData();
            Alert.alert(
                'Export Successful',
                `Your data has been prepared. ${data.messages?.length || 0} messages, ${data.memories?.length || 0} memories exported.`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to export data. Please try again.');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Memories',
            'Are you sure? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.eraseAllData();
                            setMemoryCount(0); // Update count after clearing
                            Alert.alert('Success', 'Memories cleared.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (onLogout) {
                                await api.signOut();
                                onLogout();
                            }
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to log out');
                        }
                    }
                }
            ]
        );
    };

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                    {/* Account Section */}
                    <Section title="Account">
                        <SettingItem
                            label="Email"
                            value="user@example.com"
                            type="value"
                            icon="mail-outline"
                        />
                        <SettingItem
                            label="Backup"
                            value="Last backup: Today"
                            type="value"
                            icon="cloud-upload-outline"
                        />
                        <SettingItem
                            label="Memories Linked"
                            value={
                                loading
                                    ? '...'
                                    : memoryCount === 0
                                        ? "Let's start creating"
                                        : `${memoryCount}`
                            }
                            type="value"
                            icon="heart-outline"
                        />
                        <SettingItem
                            label="Log Out"
                            onPress={handleLogout}
                            danger
                            icon="log-out-outline"
                        />
                    </Section>

                    {/* Conversation Section - NEW */}
                    <Section title="Conversation">
                        <SettingItem
                            label="Tone"
                            value={getToneLabel()}
                            type="arrow"
                            onPress={handleToneChange}
                            icon="chatbubble-outline"
                        />
                        <SettingItem
                            label="Enter to Send"
                            type="switch"
                            value={enterToSend}
                            onPress={setEnterToSend}
                            icon="return-down-back-outline"
                        />
                    </Section>

                    {/* Chat Behaviour */}
                    <Section title="Chat Behaviour">
                        <SettingItem
                            label="Typing Speed"
                            value="Normal"
                            type="value"
                            icon="speedometer-outline"
                        />
                        <SettingItem
                            label="Compact Mode"
                            type="switch"
                            value={compactMode}
                            onPress={setCompactMode}
                            icon="resize-outline"
                        />
                    </Section>

                    {/* Memories */}
                    <Section title="Memories">
                        <SettingItem
                            label="Export Data"
                            onPress={handleExportData}
                            icon="download-outline"
                        />
                        <SettingItem
                            label="Clear All Memories"
                            onPress={handleClearData}
                            danger
                            icon="trash-outline"
                        />
                    </Section>

                    {/* App */}
                    <Section title="App">
                        <SettingItem
                            label="Theme"
                            value="Warm (Default)"
                            type="value"
                            icon="color-palette-outline"
                        />
                        <SettingItem
                            label="Notifications"
                            type="switch"
                            value={notifications}
                            onPress={setNotifications}
                            icon="notifications-outline"
                        />
                        <SettingItem
                            label="Version"
                            value="1.0.0"
                            type="value"
                            icon="information-circle-outline"
                        />
                    </Section>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Warmth AI • Made with ❤️</Text>
                    </View>

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
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: theme.typography.caption.fontFamily,
    },
    sectionContentWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    sectionContent: {
        // No padding here as items have their own padding
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingIcon: {
        opacity: 0.8,
    },
    settingLabel: {
        fontSize: 16,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
    },
    settingValue: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
    },
    dangerText: {
        color: theme.colors.primary,
    },
    footer: {
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        opacity: 0.6,
        fontFamily: theme.typography.caption.fontFamily,
    },
});

export default SettingsScreen;
