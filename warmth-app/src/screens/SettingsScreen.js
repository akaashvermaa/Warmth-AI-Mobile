import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Header from '../components/common/Header';
import ScreenWrapper from '../components/common/ScreenWrapper';
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
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityHint={`Tap to ${label.toLowerCase()}`}
        accessibilityState={{ disabled: type === 'switch' }}
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

import { useFocusEffect } from '@react-navigation/native';

const SettingsScreen = ({ navigation, onLogout }) => {
    const [settings, setSettings] = useState({
        theme: 'light',
        notifications_enabled: true,
        sound_enabled: true,
        haptic_enabled: true
    });
    const [userProfile, setUserProfile] = useState(null);
    const [memoryCount, setMemoryCount] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        try {
            // Fetch profile separately so it doesn't fail if other endpoints are down
            try {
                const profileData = await api.getUserProfile();
                if (profileData?.user) setUserProfile(profileData.user);
            } catch (e) {
                console.error('Profile fetch failed:', e);
            }

            // Fetch settings
            try {
                const settingsData = await api.getPreferences();
                if (settingsData) setSettings(settingsData);
            } catch (e) {
                console.warn('Settings fetch failed (tables might be missing):', e);
            }

            // Fetch export data (memory count)
            try {
                const exportData = await api.exportAllData();
                setMemoryCount(exportData.memories?.length || 0);
            } catch (e) {
                console.warn('Export fetch failed:', e);
            }

        } catch (error) {
            console.error('General fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key, value) => {
        // Optimistic update
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await api.updateUserSettings({ [key]: value });
        } catch (error) {
            console.error('Failed to save setting:', error);
            // Revert on failure
            setSettings(settings);
            // Alert.alert('Error', 'Failed to save setting');
        }
    };

    const handleLogout = async () => {
        // Direct logout without confirmation to ensure it works
        try {
            api.signOut().catch(err => console.warn('Server signout warning:', err));
        } finally {
            if (onLogout) onLogout();
        }
    };

    return (
        <ScreenWrapper>
            <Header title="Settings" showBack />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                {/* Account Section */}
                <Section title="Account">
                    <SettingItem
                        label="Email"
                        value={userProfile?.email || 'No email found'}
                        type="value"
                        icon="mail-outline"
                    />
                    <SettingItem
                        label="Memories Linked"
                        value={loading ? '...' : `${memoryCount || 0}`}
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

                {/* Preferences */}
                <Section title="Preferences">
                    <SettingItem
                        label="Notifications"
                        type="switch"
                        value={settings.notifications_enabled}
                        onPress={(val) => updateSetting('notifications_enabled', val)}
                        icon="notifications-outline"
                    />
                    <SettingItem
                        label="Sounds"
                        type="switch"
                        value={settings.sound_enabled}
                        onPress={(val) => updateSetting('sound_enabled', val)}
                        icon="volume-high-outline"
                    />
                    <SettingItem
                        label="Haptics"
                        type="switch"
                        value={settings.haptic_enabled}
                        onPress={(val) => updateSetting('haptic_enabled', val)}
                        icon="finger-print-outline"
                    />
                </Section>

                {/* App Info */}
                <Section title="App">
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
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceGlass,
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
