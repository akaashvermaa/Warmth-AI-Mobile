import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { theme } from '../../theme';

const SuggestionChips = ({ suggestions, onSelect, disabled = false }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.chip}
                        onPress={() => !disabled && onSelect(suggestion.text)}
                        disabled={disabled}
                        activeOpacity={0.7}
                    >
                        {suggestion.emoji && (
                            <Text style={styles.emoji}>{suggestion.emoji}</Text>
                        )}
                        <Text style={styles.chipText}>{suggestion.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: theme.spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20', // 20% opacity
        gap: theme.spacing.xs,
        minHeight: 44, // Accessibility: minimum tap target
    },
    emoji: {
        fontSize: 16,
    },
    chipText: {
        fontSize: 14,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        fontWeight: '500',
    },
});

export default SuggestionChips;
