import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    FadeOutDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../services/api";
import theme from "../theme";

const { width, height } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = width > 600;
const isLargeTablet = width > 900;
const LOGO_SIZE = isTablet ? (isLargeTablet ? 180 : 140) : 110;

const AuthScreen = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const insets = useSafeAreaInsets();

  // Refs for input focus management
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(1);
  const formTranslateY = useSharedValue(0);

  useEffect(() => {
    // Logo entrance animation - smooth and gentle
    logoScale.value = withSpring(1, { damping: 20, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  // Smooth transition when switching between Sign In and Sign Up
  useEffect(() => {
    // Fade out and slide down
    formOpacity.value = withTiming(0, { duration: 200 });
    formTranslateY.value = withTiming(20, { duration: 200 });
    
    // Fade in and slide up after a brief delay
    formOpacity.value = withDelay(250, withTiming(1, { duration: 400 }));
    formTranslateY.value = withDelay(250, withSpring(0, { damping: 20, stiffness: 90 }));
  }, [isLoginMode]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const response = await api.signIn(email, password);

      if (response?.access_token) {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        await AsyncStorage.setItem("auth_token", response.access_token);

        if (response.refresh_token) {
          await AsyncStorage.setItem("refresh_token", response.refresh_token);
        }

        if (onLogin) onLogin();
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.message && err.message.includes("verify your email")) {
        setError(
          "Please verify your email address before signing in. Check your inbox."
        );
      } else if (err.message && err.message.includes("Invalid email")) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const response = await api.signUp(email, password, name);

      if (response?.access_token) {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        await AsyncStorage.setItem("auth_token", response.access_token);

        if (response.refresh_token) {
          await AsyncStorage.setItem("refresh_token", response.refresh_token);
        }

        if (onLogin) onLogin();
      } else {
        setSuccessMessage(
          "Account created! Please check your email to verify your account, then sign in."
        );
        setIsLoginMode(true);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLoginMode) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF0E8', '#FFE5D9', '#FFD4C8']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Subtle vignette overlay */}
      <LinearGradient
        colors={['rgba(255, 240, 232, 0)', 'rgba(255, 212, 200, 0.3)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + (isTablet ? 60 : 140) }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.logoCard}>
              {/* Image removed to fix build error */}
              <View style={[styles.logo, { backgroundColor: '#FF8A80', borderRadius: LOGO_SIZE / 2 }]} />
            </View>
          </Animated.View>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.header}
          >
            <Text style={styles.title}>
              {isLoginMode ? "Welcome Back" : "Let's begin"}
            </Text>
            <Text style={styles.subtitle}>
              {isLoginMode ? "Sign in to continue your journey" : "Create your safe space"}
            </Text>
          </Animated.View>

          {/* Form - with smooth transition animation */}
          <Animated.View
            style={[styles.formContainer, formAnimatedStyle]}
          >
            {!isLoginMode && (
              <Animated.View 
                entering={FadeInDown.delay(100).springify()}
                exiting={FadeOutDown.duration(200)}
                style={styles.inputWrapper}
              >
                <TextInput
                  ref={nameInputRef}
                  style={styles.input}
                  placeholder="Your Name"
                  placeholderTextColor={theme.colors.textQuiet}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  accessibilityLabel="Name input"
                  accessibilityHint="Enter your full name"
                />
              </Animated.View>
            )}

            <Animated.View 
              entering={FadeInDown.delay(isLoginMode ? 100 : 200).springify()}
              style={styles.inputWrapper}
            >
              <TextInput
                ref={emailInputRef}
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textQuiet}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                accessibilityLabel="Email input"
                accessibilityHint="Enter your email address"
              />
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.delay(isLoginMode ? 200 : 300).springify()}
              style={styles.inputWrapper}
            >
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textQuiet}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType={isLoginMode ? "go" : "done"}
                onSubmitEditing={handleSubmit}
                accessibilityLabel="Password input"
                accessibilityHint="Enter your password, minimum 6 characters"
              />
            </Animated.View>

            {error && (
              <Animated.Text 
                entering={FadeIn.duration(300)} 
                exiting={FadeOut.duration(200)}
                style={styles.errorText}
              >
                {error}
              </Animated.Text>
            )}
            {successMessage && (
              <Animated.Text 
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(200)}
                style={styles.successText}
              >
                {successMessage}
              </Animated.Text>
            )}

            <Pressable
              onPress={() => {
                setIsLoginMode(!isLoginMode);
                setError(null);
                setSuccessMessage(null);
              }}
              style={styles.switchModeButton}
              accessibilityRole="button"
              accessibilityLabel={
                isLoginMode ? "Switch to sign up" : "Switch to sign in"
              }
            >
              <Text style={styles.switchModeText}>
                {isLoginMode
                  ? "New here? Create account"
                  : "Already have an account? Sign in"}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {/* CTA Button - smooth entrance */}
        <Animated.View 
          entering={FadeInDown.delay(600).springify()}
          style={[
            styles.ctaContainer,
            isTablet ? styles.ctaTablet : styles.ctaPhone,
            { paddingBottom: insets.bottom + (isTablet ? 20 : 16) }
          ]}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
              loading && styles.ctaButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isLoginMode ? "Sign in to your account" : "Create your account"
            }
          >
            <Text style={styles.ctaButtonText}>
              {loading ? "Please wait..." : isLoginMode ? "Sign In" : "Sign Up"}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: isTablet ? 60 : 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 48 : 32,
  },
  logoCard: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8A80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    padding: isTablet ? 24 : 18,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: isTablet ? 56 : 40,
    maxWidth: 400,
  },
  title: {
    fontFamily: theme.typography.headingFont,
    fontSize: isTablet ? 42 : 36,
    lineHeight: isTablet ? 52 : 44,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: theme.typography.bodyFont,
    fontSize: isTablet ? 18 : 16,
    lineHeight: isTablet ? 28 : 24,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputWrapper: {
    marginBottom: isTablet ? 24 : 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: isTablet ? 28 : 24,
    paddingHorizontal: isTablet ? 28 : 24,
    paddingVertical: isTablet ? 20 : 18,
    minHeight: isTablet ? 60 : 52,
    fontSize: isTablet ? 18 : 17,
    color: theme.colors.text,
    fontFamily: theme.typography.bodyFont,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 128, 0.15)',
    textAlign: 'center',
    shadowColor: '#FF8A80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: theme.typography.bodyFont,
    fontSize: isTablet ? 15 : 14,
  },
  successText: {
    color: theme.colors.success,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: theme.typography.bodyFont,
    fontSize: isTablet ? 15 : 14,
  },
  switchModeButton: {
    marginTop: isTablet ? 24 : 20,
    padding: 12,
  },
  switchModeText: {
    color: '#FF8A80',
    textAlign: 'center',
    fontFamily: theme.typography.bodyFontMedium,
    fontSize: isTablet ? 16 : 15,
  },
  ctaContainer: {
    paddingHorizontal: isTablet ? 60 : 24,
  },
  ctaPhone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 240, 232, 0.95)',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaTablet: {
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: '#FF8A80',
    borderRadius: isTablet ? 32 : 28,
    paddingVertical: isTablet ? 20 : 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: isTablet ? 400 : '100%',
    width: '100%',
    shadowColor: '#FF8A80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontFamily: theme.typography.bodyFontBold,
    fontSize: isTablet ? 19 : 17,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default AuthScreen;
