// Warmth AI Design System - Final Polish
// Mature, warm, premium companion UI
import { Platform } from 'react-native';

// Color Palette - Refined & Softer
export const colors = {
    // Softer background gradient (Strictly Pink/Rose/Peach - NO YELLOW)
    background: '#FFF0F5',
    backgroundGradient: ['#FFF0F5', '#FFE4E1', '#FFDAB9'], // Lavender Blush -> Misty Rose -> Peach Puff
    headerGradient: ['#FFB7B2', '#FF9E9E'], // Rose -> Salmon

    // Surface
    surface: '#FFFFFF',
    surfaceWarm: '#FFF5EF',
    surfaceGlass: 'rgba(255, 255, 255, 0.5)',

    // Chat Bubbles - Reduced opacity for better readability
    userBubbleGradient: ['rgba(255, 223, 230, 0.6)', 'rgba(255, 244, 224, 0.6)'], // 0.8 → 0.6
    userBubbleBorder: 'rgba(196, 116, 84, 0.08)', // Much subtler

    aiBubbleGradient: ['rgba(255, 239, 229, 0.6)', 'rgba(255, 232, 240, 0.6)'], // 0.75 → 0.6
    aiBubbleBorder: 'rgba(196, 116, 84, 0.08)', // Much subtler

    // Input Bar - Reduced gradient intensity
    inputGradient: ['rgba(255, 228, 236, 0.55)', 'rgba(255, 244, 220, 0.55)'],
    inputBorder: 'rgba(255, 255, 255, 0.35)',

    // Accents
    primary: '#C97454', // Terracotta
    secondary: '#9A8D86', // Muted Warm Grey
    accent: '#C97454',

    // Text hierarchy - Better contrast (4.5:1 minimum)
    text: '#2B2B2B', // Darker for better contrast
    textSecondary: '#9A8D86',
    textQuiet: '#B6AAA4', // Darker placeholder
    textInverse: '#FFFFFF',

    // Emotion chips
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
    border: '#E9C6BE',
    borderLight: 'rgba(233, 198, 190, 0.4)',
};

// Typography - Inter font with 1.45 line-height
export const typography = {
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    lineHeight: 1.45,

    heading: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Serif for logo only
        fontSize: 24, // Reduced from 26
        fontWeight: '600',
        lineHeight: 32,
        letterSpacing: 0.3, // Reduced
        color: colors.text,
    },

    subheading: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 26.1, // 1.45 ratio
        letterSpacing: 0.2,
        color: colors.text,
    },

    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 23.2, // 1.45 ratio
        letterSpacing: 0.3,
        color: colors.text,
    },

    message: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 23.2, // 1.45 ratio
        letterSpacing: 0.3,
        color: colors.text,
    },

    caption: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        lineHeight: 17.4, // 1.45 ratio
        letterSpacing: 0.2,
        color: colors.textSecondary,
    },

    timestamp: {
        fontFamily: 'Inter_400Regular',
        fontSize: 11,
        lineHeight: 16, // 1.45 ratio
        color: colors.textSecondary,
        opacity: 0, // Hidden by default
    },

    button: {
        fontFamily: 'Inter_600SemiBold',
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

// Border radius
export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    bubble: 18,
    pill: 999,
};

// Refined shadows - Very subtle
export const shadows = {
    bubble: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, // Very subtle
        shadowRadius: 6,
        elevation: 2,
    },
    card: {
        shadowColor: '#C97454',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    icon: {
        shadowColor: '#C97454',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
};

// Animation configurations - Gentler
export const animations = {
    timing: {
        fast: 220, // Reduced from 200
        normal: 300,
        slow: 500,
    },
    spring: {
        damping: 20, // Less bouncy
        stiffness: 120, // Softer
    },
    easing: 'ease-out', // Gentler easing
};

// Breakpoints
export const breakpoints = {
    small: 320,
    medium: 375,
    large: 414,
    xlarge: 768,
    messageColumn: 820, // Max width for centered messages
};

// Helper function to get gradient colors
export const getGradient = (type) => {
    switch (type) {
        case 'background':
            return colors.backgroundGradient;
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
