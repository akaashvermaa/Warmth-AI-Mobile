import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import theme from '../../theme';

const Header = ({
    title,
    showBack = false,
    rightAction,
    rightIcon,
    onRightPress
}) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>

            <View style={styles.rightContainer}>
                {rightAction || (rightIcon && (
                    <TouchableOpacity
                        onPress={onRightPress}
                        style={styles.rightButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                    >
                        <Ionicons name={rightIcon} size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        height: 56,
    },
    leftContainer: {
        width: 40,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: theme.typography.heading.fontFamily,
    },
    backButton: {
        padding: 4,
    },
    rightButton: {
        padding: 4,
    },
});

export default Header;
