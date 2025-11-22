import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import api from '../services/api';
import theme from '../theme';

const AuthScreen = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !fullName)) {
            setError('Please fill in all fields');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);
        setError(null);

        try {
            let response;
            if (isLogin) {
                response = await api.signIn(email, password);
            } else {
                response = await api.signUp(email, password, fullName);
                // Auto login after signup or show success message
                if (!api.getAuthToken()) {
                    // If signup didn't auto-login (e.g. email verification needed), 
                    // switch to login and show message
                    setIsLogin(true);
                    setError('Account created! Please sign in.');
                    setLoading(false);
                    return;
                }
            }

            // Persist token
            if (response?.access_token) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('auth_token', response.access_token);
            }

            // Call the parent callback to update App state
            if (onLogin) {
                onLogin();
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDevLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.createDevUser('dev_user_' + Math.floor(Math.random() * 1000));

            if (response?.access_token) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('auth_token', response.access_token);
                if (onLogin) onLogin();
            }
        } catch (err) {
            console.error('Dev login error:', err);
            setError('Dev login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.header}>
                            <Text style={styles.title}>Warmth</Text>
                            <Text style={styles.subtitle}>
                                {isLogin ? 'Welcome back' : 'Create your account'}
                            </Text>
                        </Animated.View>

                        {/* Form */}
                        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.form}>
                            {!isLogin && (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your name"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                    />
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="name@example.com"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {error && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleAuth}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {isLogin ? 'Sign In' : 'Sign Up'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                }}
                            >
                                <Text style={styles.switchText}>
                                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.devButton}
                                onPress={handleDevLogin}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.devButtonText}>
                                    Developer Login (Skip Auth)
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxl,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.primary,
        fontFamily: theme.typography.heading.fontFamily,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
    },
    form: {
        gap: theme.spacing.lg,
    },
    inputContainer: {
        gap: theme.spacing.xs,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        marginLeft: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        fontSize: 16,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    button: {
        backgroundColor: theme.colors.primary,
        borderRadius: 16,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        fontFamily: theme.typography.body.fontFamily,
    },
    switchButton: {
        alignItems: 'center',
        padding: theme.spacing.sm,
    },
    switchText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: theme.typography.body.fontFamily,
    },
    devButton: {
        alignItems: 'center',
        padding: theme.spacing.sm,
        marginTop: theme.spacing.xs,
    },
    devButtonText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontFamily: theme.typography.caption.fontFamily,
        textDecorationLine: 'underline',
        opacity: 0.7,
    },
});

export default AuthScreen;
