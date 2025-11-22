import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import theme from '../../theme';

const TopRightIcons = () => {
    const navigation = useNavigation();

    // Glow animation for icons
    const glowOpacity = useSharedValue(0.3);

    React.useEffect(() => {
        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 2000 }),
                withTiming(0.3, { duration: 2000 })
            ),
            -1,
            false
        );
    }, []);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    // Scale animation on press
    const settingsScale = useSharedValue(1);
    const journalsScale = useSharedValue(1);

    const settingsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: settingsScale.value }],
    }));

    const journalsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: journalsScale.value }],
    }));

    const handlePressIn = (scaleValue) => {
        scaleValue.value = withSpring(0.95, {
            damping: 15,
            stiffness: 200,
        });
    };

    const handlePressOut = (scaleValue) => {
        scaleValue.value = withSpring(1, {
            damping: 15,
            stiffness: 200,
        });
    };

    return (
        <View style={styles.container}>
            {/* Settings Icon */}
            <TouchableOpacity
                onPressIn={() => handlePressIn(settingsScale)}
                onPressOut={() => handlePressOut(settingsScale)}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.8}
            >
                <Animated.View style={[styles.iconContainer, settingsAnimatedStyle]}>
                    <Animated.View style={[styles.glow, glowStyle, theme.shadows.icon]} />
                    <View style={styles.icon}>
                        <SettingsIcon />
                    </View>
                </Animated.View>
            </TouchableOpacity>

            {/* Journals Icon */}
            <TouchableOpacity
                onPressIn={() => handlePressIn(journalsScale)}
                onPressOut={() => handlePressOut(journalsScale)}
                onPress={() => navigation.navigate('Journals')}
                activeOpacity={0.8}
            >
                <Animated.View style={[styles.iconContainer, journalsAnimatedStyle]}>
                    <Animated.View style={[styles.glow, glowStyle, theme.shadows.icon]} />
                    <View style={styles.icon}>
                        <JournalsIcon />
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

// Simple SVG-like icons using View components
const SettingsIcon = () => (
    <View style={styles.settingsIcon}>
        <View style={styles.settingsCircle} />
        <View style={[styles.settingsLine, { top: 8, left: 4 }]} />
        <View style={[styles.settingsLine, { top: 14, left: 4 }]} />
        <View style={[styles.settingsLine, { top: 20, left: 4 }]} />
    </View>
);

const JournalsIcon = () => (
    <View style={styles.journalsIcon}>
        <View style={styles.journalsPage} />
        <View style={[styles.journalsLine, { top: 8 }]} />
        <View style={[styles.journalsLine, { top: 12 }]} />
        <View style={[styles.journalsLine, { top: 16 }]} />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 20, // Moved inward
    },
    iconContainer: {
        position: 'relative',
        width: 28, // Reduced from 32
        height: 28, // Reduced from 32
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16, // Replaced gap with marginLeft
    },
    glow: {
        position: 'absolute',
        width: 28, // Reduced from 32
        height: 28, // Reduced from 32
        borderRadius: 14, // Reduced from 16
        backgroundColor: theme.colors.iconGlow,
    },
    icon: {
        width: 22, // Reduced from 24
        height: 22, // Reduced from 24
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },

    // Settings icon
    settingsIcon: {
        width: 22, // Reduced from 24
        height: 22, // Reduced from 24
        position: 'relative',
    },
    settingsCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        top: 8,
        left: 8,
    },
    settingsLine: {
        width: 16,
        height: 2,
        backgroundColor: theme.colors.primary,
        borderRadius: 1,
        position: 'absolute',
    },

    // Journals icon
    journalsIcon: {
        width: 22, // Reduced from 24
        height: 22, // Reduced from 24
        position: 'relative',
    },
    journalsPage: {
        width: 18,
        height: 22,
        borderRadius: 2,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        position: 'absolute',
        top: 1,
        left: 3,
    },
    journalsLine: {
        width: 10,
        height: 1.5,
        backgroundColor: theme.colors.primary,
        borderRadius: 1,
        position: 'absolute',
        left: 7,
    },
});

export default TopRightIcons;
