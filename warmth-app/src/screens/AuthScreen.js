import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import Button from '../components/common/Button';
import ScreenWrapper from '../components/common/ScreenWrapper';
import api from '../services/api';
import theme from '../theme';

import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Create a redirect URI - this is critical for the mismatch error
    const redirectUri = makeRedirectUri({
        scheme: 'warmth'
    });

    console.log("---------------------------------------------------");
    console.log("GOOGLE AUTH REDIRECT URI:", redirectUri);
    console.log("Please add this URI to your Google Cloud Console > APIs & Services > Credentials > Web Client ID > Authorized redirect URIs");
    console.log("---------------------------------------------------");

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
                // Check if signup returned a token (auto-login)
                if (!response?.access_token) {
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

                if (response.refresh_token) {
                    await AsyncStorage.setItem('refresh_token', response.refresh_token);
                }
            }

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

    const [request, response, promptAsync] = Google.useAuthRequest({
        // Using the provided Web Client ID for all platforms for now (works for Expo Go/Web)
        androidClientId: '822449448774-sdn22et1o6pstrui46m060h472sbftn6.apps.googleusercontent.com',
        iosClientId: '822449448774-eir2p1c7hh0gf0dmcjjv2svkt45ub8fr.apps.googleusercontent.com',
        webClientId: '822449448774-eir2p1c7hh0gf0dmcjjv2svkt45ub8fr.apps.googleusercontent.com',
        redirectUri: redirectUri
    });

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            // Call backend with the ID token
            handleGoogleAuth(authentication.accessToken);
        }
    }, [response]);

    const handleGoogleAuth = async (token) => {
        setLoading(true);
        setError(null);
        try {
            // We need to implement this in api.js
            const response = await api.signInWithGoogle(token);

            if (response?.access_token) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('auth_token', response.access_token);
                if (response.refresh_token) {
                    await AsyncStorage.setItem('refresh_token', response.refresh_token);
                }
                if (onLogin) onLogin();
            }
        } catch (err) {
            console.error('Google Auth error:', err);
            setError('Google Sign In failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
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
                                accessibilityLabel="Full name input"
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
                            accessibilityLabel="Email address input"
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
                            accessibilityLabel="Password input"
                        />
                    </View>

                    {error && (
                        <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
                    )}

                    <Button
                        title={isLogin ? 'Sign In' : 'Sign Up'}
                        onPress={handleAuth}
                        loading={loading}
                        style={styles.mainButton}
                    />

                    <Button
                        title="Continue with Google"
                        variant="secondary"
                        icon={<Ionicons name="logo-google" size={20} color={theme.colors.primary} />}
                        onPress={() => {
                            promptAsync();
                        }}
                    />

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
                    >
                        <Text style={styles.devButtonText}>
                            Developer Login (Skip Auth)
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
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
        borderRadius: theme.borderRadius.md,
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
    mainButton: {
        marginTop: theme.spacing.md,
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
