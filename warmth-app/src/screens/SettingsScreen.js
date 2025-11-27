import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/common/ScreenWrapper';
import api from '../services/api';
import theme from '../theme';

const Section = React.memo(({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.sectionContent, theme.shadows.soft]}>
            {children}
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
            {icon && <Ionicons name={icon} size={20} color={danger ? theme.colors.error : theme.colors.textSecondary} style={styles.settingIcon} />}
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
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textQuiet} />
        )}

        {type === 'value' && (
            <Text style={styles.settingValue}>{value}</Text>
        )}
    </TouchableOpacity>
));

const SettingsScreen = ({ navigation, onLogout }) => {
    const [settings, setSettings] = useState({
        notifications_enabled: true,
        sound_enabled: true,
        haptic_enabled: true
    });
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();

    const handleClearMemory = () => {
        Alert.alert(
            "Clear All Memories?",
            "This will delete all emotional patterns Warmth has learned. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete Everything", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.eraseAllData();
                            Alert.alert("Success", "All memories have been cleared.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear memories.");
                        }
                    }
                }
            ]
        );
    };

    const handleExportData = async () => {
        try {
            // In a real app, this would generate a file and share it
            // For now, we just call the API and show a success message
            await api.exportAllData();
            Alert.alert("Export Ready", "Your data has been prepared. (Feature in progress)");
        } catch (error) {
            Alert.alert("Error", "Failed to export data.");
        }
    };

    return (
        <ScreenWrapper>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy & Memories</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                
                {/* Privacy Assurance */}
                <View style={styles.privacyCard}>
                    <Ionicons name="shield-checkmark-outline" size={32} color={theme.colors.primary} style={styles.privacyIcon} />
                    <Text style={styles.privacyTitle}>Your Safe Space</Text>
                    <Text style={styles.privacyText}>
                        Warmth remembers emotional patterns to respond better. 
                        We never use your data for ads or resale. 
                        You are always in control.
                    </Text>
                </View>

                {/* Memory Controls */}
                <Section title="Data Control">
                    <SettingItem
                        label="Export My Data"
                        onPress={handleExportData}
                        icon="download-outline"
                    />
                    <SettingItem
                        label="Clear All Memories"
                        onPress={handleClearMemory}
                        danger
                        icon="trash-outline"
                    />
                </Section>

                {/* Account */}
                <Section title="Account">
                    <SettingItem
                        label="Log Out"
                        onPress={onLogout}
                        danger
                        icon="log-out-outline"
                    />
                </Section>

                {/* Preferences (Collapsed/Smaller) */}
                <Section title="Preferences">
                    <SettingItem
                        label="Notifications"
                        type="switch"
                        value={settings.notifications_enabled}
                        onPress={() => setSettings(s => ({...s, notifications_enabled: !s.notifications_enabled}))}
                        icon="notifications-outline"
                    />
                </Section>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Warmth AI v1.0.0</Text>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    headerTitle: {
        fontFamily: theme.typography.heading.fontFamily,
        fontSize: 24,
        color: theme.colors.text,
    },
    backButton: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xxl,
    },
    privacyCard: {
        backgroundColor: theme.colors.surfaceWarm,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    privacyIcon: {
        marginBottom: theme.spacing.sm,
        opacity: 0.8,
    },
    privacyTitle: {
        fontFamily: theme.typography.subheading.fontFamily,
        fontSize: 18,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    privacyText: {
        fontFamily: theme.typography.body.fontFamily,
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontFamily: theme.typography.caption.fontFamily,
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        marginLeft: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontFamily: theme.typography.body.fontFamily,
        fontSize: 16,
        color: theme.colors.text,
    },
    settingValue: {
        fontFamily: theme.typography.body.fontFamily,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    dangerText: {
        color: theme.colors.error,
    },
    footer: {
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    footerText: {
        fontFamily: theme.typography.caption.fontFamily,
        fontSize: 12,
        color: theme.colors.textQuiet,
    },
});

export default SettingsScreen;
