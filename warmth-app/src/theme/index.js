// Ultra-Minimal Warmth AI Design System
// Cozy, warm palette with gradients and soft shadows
import { Platform } from 'react-native';

// Color Palette - Warm & Minimal
export const colors = {
    // Backgrounds - Warm cream
    background: '#FFF8F3',
    backgroundGradient: ['#FFF8F3', '#FFE8D6'],
    surface: '#FFFFFF',
    surfaceWarm: '#FFF0E6',

    // Chat Bubbles - Soft gradients
    userBubbleGradient: ['#FFE8E8', '#FFD6D6'],     // Soft blush
    aiBubbleGradient: ['#FFF0E6', '#FFE8D6'],       // Warm cream

    // Accents
    primary: '#CD2C58',
    warmAccent: '#FFC69D',
    iconGlow: '#FFC69D',

    // Text hierarchy
    text: '#2D2D2D',
    textSecondary: '#999999',
    textQuiet: '#CCCCCC',

    // Emotion chips (auto-detected)
    emotion: {
        happy: { bg: '#FFF9E6', text: '#B8860B' },
        sad: { bg: '#E6F2FF', text: '#4A90E2' },
        anxious: { bg: '#F0E6FF', text: '#8B6BA8' },
        calm: { bg: '#E6FFF9', text: '#4A9B8A' },
        tired: { bg: '#F5F5F5', text: '#666666' },
        proud: { bg: '#FFE6F0', text: '#CD2C58' },
        neutral: { bg: '#F5F5F5', text: '#666666' },
    },

    // Borders
    border: '#FFD9C4',
    borderLight: '#FFE8D6',
};

// Typography - Inter/SF Pro with improved spacing
export const typography = {
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
    letterSpacing: 0.3,
    lineHeight: 1.6,

    heading: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Inter',
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: 0.2,
    },

    subheading: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: 0.2,
    },

    body: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
        fontSize: 16,
        lineHeight: 26,  // Increased for readability
        letterSpacing: 0.3,
    },

    message: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: 0.3,
    },

    caption: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
        fontSize: 12,
        lineHeight: 18,
        letterSpacing: 0.2,
    },

    timestamp: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
        fontSize: 11,
        lineHeight: 14,
        color: '#CCCCCC',
        opacity: 0.6,
    },

    button: {
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Inter',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
};

// Spacing scale
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border radius - Soft, rounded
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    bubble: 20,  // Chat bubbles
    pill: 999,
};

// Soft shadows with warm tint
export const shadows = {
    bubble: {
        shadowColor: '#CD2C58',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    card: {
        shadowColor: '#CD2C58',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    icon: {
        shadowColor: '#FFC69D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
    },
};

// Animation configurations - Lightweight
export const animations = {
    timing: {
        fast: 200,
        normal: 300,
        slow: 500,
    },
    spring: {
        damping: 15,
        stiffness: 150,
    },
};

// Breakpoints for responsive design
export const breakpoints = {
    small: 320,
    medium: 375,
    large: 414,
    xlarge: 768,
};

// Helper function to get gradient colors
export const getGradient = (type) => {
    switch (type) {
        case 'background':
            return colors.backgroundGradient;
        case 'userBubble':
            return colors.userBubbleGradient;
        case 'aiBubble':
            return colors.aiBubbleGradient;
        default:
            return colors.backgroundGradient;
    }
};

export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
    breakpoints,
    getGradient,
};
