import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import theme from '../../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Button = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, ghost, danger
    loading = false,
    disabled = false,
    icon,
    style,
    textStyle,
    accessibilityLabel,
    accessibilityHint,
}) => {
    const scale = useSharedValue(1);
    const [isDebouncing, setIsDebouncing] = useState(false);

    const handlePressIn = () => {
        if (loading || disabled) return;
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = useCallback(async () => {
        if (loading || disabled || isDebouncing) return;

        // Haptic feedback
        if (variant !== 'ghost') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        // Debounce
        setIsDebouncing(true);
        try {
            await onPress();
        } finally {
            // Small delay to prevent double-taps even if onPress is fast
            setTimeout(() => setIsDebouncing(false), 500);
        }
    }, [onPress, loading, disabled, isDebouncing, variant]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const getVariantStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondary;
            case 'ghost':
                return styles.ghost;
            case 'danger':
                return styles.danger;
            default:
                return styles.primary;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryText;
            case 'ghost':
                return styles.ghostText;
            case 'danger':
                return styles.dangerText;
            default:
                return styles.primaryText;
        }
    };

    return (
        <AnimatedTouchable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading || disabled}
            style={[
                styles.base,
                getVariantStyle(),
                (disabled || loading) && styles.disabled,
                style,
                animatedStyle
            ]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || title}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: disabled || loading, busy: loading }}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' || variant === 'danger' ? '#FFF' : theme.colors.primary}
                    size="small"
                />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text style={[styles.textBase, getTextStyle(), textStyle]}>
                        {title}
                    </Text>
                </View>
            )}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48, // Touch target size
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: theme.spacing.sm,
    },
    disabled: {
        opacity: 0.6,
    },
    // Variants
    primary: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    danger: {
        backgroundColor: '#FF4444',
    },
    // Text Styles
    textBase: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: theme.typography.button.fontFamily,
        letterSpacing: 0.5,
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: theme.colors.primary,
    },
    ghostText: {
        color: theme.colors.primary,
    },
    dangerText: {
        color: '#FFFFFF',
    },
});

export default Button;
