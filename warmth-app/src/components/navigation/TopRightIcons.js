import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const TopRightIcons = () => {
    const navigation = useNavigation();

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
                accessibilityLabel="Settings"
                accessibilityRole="button"
                accessibilityHint="Navigate to settings screen"
            >
                <Animated.View style={[styles.iconContainer, settingsAnimatedStyle]}>
                    <Ionicons
                        name="options-outline"
                        size={24}
                        color="#FF8A80"
                        style={styles.icon}
                    />
                </Animated.View>
            </TouchableOpacity>

            {/* Journals Icon */}
            <TouchableOpacity
                onPressIn={() => handlePressIn(journalsScale)}
                onPressOut={() => handlePressOut(journalsScale)}
                onPress={() => navigation.navigate('Journals')}
                activeOpacity={0.8}
                accessibilityLabel="Journals"
                accessibilityRole="button"
                accessibilityHint="Navigate to journals screen"
            >
                <Animated.View style={[styles.iconContainer, journalsAnimatedStyle]}>
                    <Ionicons
                        name="book-outline"
                        size={24}
                        color="#FF8A80"
                        style={styles.icon}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 20,
        gap: 16,
    },
    iconContainer: {
        position: 'relative',
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        zIndex: 1,
    },
});

export default TopRightIcons;
