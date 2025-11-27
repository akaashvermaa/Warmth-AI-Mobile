// Warmth AI Design System - Phase 2 (Brand Identity)
// "A quiet room, a warm light, a cozy blanket."


// Color Palette - Warm, Soft, Human
// Based on: Peach, Soft Lavender, Pastel Blue, Beige, Warm Brown
export const colors = {
    // Backgrounds
    background: '#FFF5F1', // Very soft peach/beige
    backgroundGradient: ['#FFF5F1', '#FFF0F5', '#E6E6FA'], // Peach -> Lavender Mist -> Soft Lavender
    
    // Surface (Cards, Bubbles)
    surface: '#FFFFFF',
    surfaceWarm: '#FFF9F5',
    surfaceGlass: 'rgba(255, 255, 255, 0.7)',
    
    // Primary Brand Colors
    primary: '#8D6E63', // Warm Brown (Earth/Stable)
    primarySoft: '#D7CCC8', // Light Warm Brown
    accent: '#FFB7B2', // Soft Salmon/Peach (The "Spark")
    
    // Text - Never pure black
    text: '#4E342E', // Dark Brown (Softer than black)
    textSecondary: '#8D6E63', // Medium Brown
    textQuiet: '#BCAAA4', // Light Brown (Placeholder)
    textInverse: '#FFFFFF',

    // Chat Bubbles
    userBubble: '#FBE9E7', // Deep Nude/Peach
    userBubbleText: '#4E342E',
    
    aiBubble: '#FFFFFF',
    aiBubbleText: '#4E342E',
    aiBubbleBorder: 'rgba(141, 110, 99, 0.1)', // Very subtle brown border

    // Input
    inputBackground: '#FFFFFF',
    inputBorder: 'rgba(141, 110, 99, 0.15)',

    // Status/Emotions (Pastel, not neon)
    emotion: {
        happy: { bg: '#FFF3E0', text: '#EF6C00' }, // Soft Orange
        sad: { bg: '#E3F2FD', text: '#1565C0' },   // Soft Blue
        anxious: { bg: '#F3E5F5', text: '#7B1FA2' }, // Soft Purple
        calm: { bg: '#E0F2F1', text: '#00695C' },   // Soft Teal
        tired: { bg: '#FAFAFA', text: '#616161' },  // Soft Grey
        proud: { bg: '#FCE4EC', text: '#C2185B' },  // Soft Pink
        neutral: { bg: '#F5F5F5', text: '#757575' },
    },

    // UI Elements
    border: '#EFEBE9',
    borderLight: 'rgba(141, 110, 99, 0.1)',
    
    // Functional
    error: '#EF9A9A', // Soft Red
    success: '#A5D6A7', // Soft Green
};

// Typography - Warm, Premium Font Stack
export const typography = {
    // Font Families
    headingFont: 'Poppins_600SemiBold', // Logo + Navbar Title
    bodyFont: 'Nunito_400Regular', // Quote under navbar
    chatFont: 'Quicksand_400Regular', // Chat bubbles + input
    buttonFont: 'Poppins_500Medium', // Buttons (Sign Up, Send)
    bodyFontMedium: 'Nunito_600SemiBold',
    bodyFontBold: 'Nunito_700Bold',

    // Styles
    heading: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 32,
        lineHeight: 40,
        color: colors.text,
        letterSpacing: -0.5,
    },
    
    subheading: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 20,
        lineHeight: 28,
        color: colors.text,
        letterSpacing: 0.1,
    },

    body: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 17, // Slightly larger for readability
        lineHeight: 26,
        color: colors.text,
    },

    message: {
        fontFamily: 'Quicksand_400Regular', // Soft, cozy, emotional
        fontSize: 17,
        lineHeight: 26,
        color: colors.text,
    },

    caption: {
        fontFamily: 'Nunito_400Regular',
        fontSize: 13,
        lineHeight: 18,
        color: colors.textSecondary,
    },

    button: {
        fontFamily: 'Poppins_500Medium', // Clean & modern
        fontSize: 16,
        letterSpacing: 0.5,
        color: colors.textInverse,
    },
};

// Spacing - Generous, Breathable
export const spacing = {
    xs: 6,
    sm: 12,
    md: 20, // Increased from 16
    lg: 32,
    xl: 48,
    xxl: 64,
};

// Border Radius - Soft, Round
export const borderRadius = {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    bubble: 24, // Very round bubbles
    pill: 999,
};

// Shadows - Organic, Diffused
export const shadows = {
    soft: {
        shadowColor: '#8D6E63',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    float: {
        shadowColor: '#8D6E63',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 6,
    },
    none: {
        shadowOpacity: 0,
        elevation: 0,
    },
};

// Animation Configs - Slow, Gentle
export const animations = {
    timing: {
        fast: 300,
        normal: 500, // Slower default
        slow: 800,
    },
    spring: {
        damping: 30, // No bounce, just smooth arrival
        stiffness: 90, // Soft spring
        mass: 1,
    },
};

export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animations,
};
