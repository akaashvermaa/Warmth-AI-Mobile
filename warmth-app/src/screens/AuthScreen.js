import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    LinearTransition,
    SlideInRight,
    SlideOutLeft
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../components/common/Button';
import ScreenWrapper from '../components/common/ScreenWrapper';
import api from '../services/api';
import theme from '../theme';

const { width } = Dimensions.get('window');

const OnboardingSlide = ({ title, subtitle, icon, isLast, children }) => (
    <View style={styles.slide}>
        <View style={styles.slideContent}>
            {icon && (
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.iconContainer}>
                    <Ionicons name={icon} size={48} color={theme.colors.primary} />
                </Animated.View>
            )}
            <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.title}>
                {title}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.subtitle}>
                {subtitle}
            </Animated.Text>
            {children}
        </View>
    </View>
);

const AuthScreen = ({ onLogin }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const insets = useSafeAreaInsets();

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleStart();
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleStart = async () => {
        if (!name.trim()) {
            setError('Please enter a name or nickname.');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);
        setError(null);

        try {
            // Generate a random guest account
            // In a real app, we might want to let them link an email later
            const randomId = Math.random().toString(36).substring(7);
            const email = `guest_${randomId}@warmth.ai`;
            const password = `pass_${Math.random().toString(36)}`;

            // Sign up as a new user
            const response = await api.signUp(email, password, name);

            if (response?.access_token) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem('auth_token', response.access_token);
                
                if (response.refresh_token) {
                    await AsyncStorage.setItem('refresh_token', response.refresh_token);
                }

                if (onLogin) onLogin();
            } else {
                // Fallback if auto-login after signup fails
                const loginResp = await api.signIn(email, password);
                if (loginResp?.access_token) {
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    await AsyncStorage.setItem('auth_token', loginResp.access_token);
                    if (onLogin) onLogin();
                }
            }
        } catch (err) {
            console.error('Onboarding error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <OnboardingSlide
                        key="step0"
                        title="Hey..."
                        subtitle="This is your quiet space."
                        icon="leaf-outline"
                    />
                );
            case 1:
                return (
                    <OnboardingSlide
                        key="step1"
                        title="I'm here to listen."
                        subtitle="No judgment. No pressure.\nJust share what's on your mind."
                        icon="ear-outline"
                    />
                );
            case 2:
                return (
                    <OnboardingSlide
                        key="step2"
                        title="Safe & Private"
                        subtitle="Your chats are private.\nYou control what I remember."
                        icon="shield-checkmark-outline"
                    />
                );
            case 3:
                return (
                    <OnboardingSlide
                        key="step3"
                        title="Let's begin"
                        subtitle="What should I call you?"
                        icon="person-outline"
                    >
                        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your name or nickname"
                                placeholderTextColor={theme.colors.textQuiet}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoFocus={true}
                            />
                            {error && <Text style={styles.errorText}>{error}</Text>}
                        </Animated.View>
                    </OnboardingSlide>
                );
            default:
                return null;
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.content}>
                    <Animated.View 
                        key={step}
                        entering={SlideInRight.springify().damping(20)}
                        exiting={SlideOutLeft.springify().damping(20)}
                        style={styles.slideWrapper}
                    >
                        {renderStep()}
                    </Animated.View>
                </View>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.dots}>
                        {[0, 1, 2, 3].map((i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: i === step ? theme.colors.primary : theme.colors.border,
                                        width: i === step ? 24 : 8,
                                    }
                                ]}
                                layout={LinearTransition.springify()}
                            />
                        ))}
                    </View>

                    <View style={styles.buttons}>
                        {step > 0 && (
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        )}
                        
                        <Button
                            title={step === 3 ? "Start Chatting" : "Continue"}
                            onPress={handleNext}
                            loading={loading}
                            style={styles.nextButton}
                            textStyle={styles.nextButtonText}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideWrapper: {
        width: width,
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    slide: {
        width: '100%',
        alignItems: 'center',
    },
    slideContent: {
        alignItems: 'center',
        width: '100%',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.surfaceWarm,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    title: {
        fontFamily: theme.typography.heading.fontFamily,
        fontSize: 36,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    subtitle: {
        fontFamily: theme.typography.body.fontFamily,
        fontSize: 18,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 28,
    },
    inputContainer: {
        width: '100%',
        marginTop: theme.spacing.xl,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.pill,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        fontSize: 18,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        borderWidth: 1,
        borderColor: theme.colors.border,
        textAlign: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    errorText: {
        color: theme.colors.error,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
        fontFamily: theme.typography.caption.fontFamily,
    },
    footer: {
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.xl,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
    },
    backButton: {
        padding: theme.spacing.sm,
    },
    backButtonText: {
        fontFamily: theme.typography.button.fontFamily,
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    nextButton: {
        flex: 1,
        marginLeft: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.pill,
    },
    nextButtonText: {
        fontFamily: theme.typography.button.fontFamily,
        fontSize: 16,
    },
});

export default AuthScreen;
