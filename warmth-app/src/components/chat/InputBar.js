import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme';

const InputBar = ({ value, onChangeText, onSend, placeholder = "Share whatever's on your mind…", disabled = false }) => {
    const sendButtonScale = useSharedValue(0.8);
    const inputGlow = useSharedValue(0.08); // Glow intensity
    const insets = useSafeAreaInsets();

    // Debug logging for mount/unmount
    React.useEffect(() => {
        console.log('[InputBar] Mounted');
        return () => console.log('[InputBar] Unmounted');
    }, []);

    const handleSend = () => {
        if (value && value.trim() && !disabled) {
            onSend();
            sendButtonScale.value = withSpring(0.8);
        }
    };

    const handleTextChange = (text) => {
        onChangeText(text);
        if (text.trim()) {
            sendButtonScale.value = withSpring(1);
            inputGlow.value = withTiming(0.15, { duration: 300 }); // Gentle glow when typing
        } else {
            sendButtonScale.value = withSpring(0.8);
            inputGlow.value = withTiming(0.08, { duration: 300 }); // Return to normal
        }
    };

    const sendButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sendButtonScale.value }],
        opacity: sendButtonScale.value,
    }));

    const inputContainerStyle = useAnimatedStyle(() => ({
        shadowOpacity: inputGlow.value,
    }));

    const showSendButton = value && value.trim().length > 0;

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 24 }]}>
            <Animated.View style={[styles.inputContainer, inputContainerStyle]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textQuiet}
                    value={value}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                    returnKeyType="default"
                    blurOnSubmit={false}
                />

                {showSendButton && (
                    <Animated.View style={[styles.sendButtonWrapper, sendButtonStyle]}>
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!value.trim() || disabled}
                            style={styles.sendButton}
                        >
                            <Ionicons
                                name="arrow-up-circle"
                                size={24}
                                color="#FFF"
                            />
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: theme.borderRadius.pill,
        paddingHorizontal: 20,
        paddingVertical: 12,
        minHeight: 56,
        borderWidth: 0,
        borderColor: 'transparent', // Ensure no border color
        shadowColor: '#FF8A80',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, // Will be animated
        shadowRadius: 12,
        elevation: 3,
        // Android-specific: remove outline
        ...(Platform.OS === 'android' && {
            overflow: 'hidden',
        }),
    },
    input: {
        flex: 1,
        fontFamily: theme.typography.chatFont,
        fontSize: 16,
        color: theme.colors.text,
        maxHeight: 120,
        paddingTop: Platform.OS === 'ios' ? 6 : 0,
        paddingBottom: Platform.OS === 'ios' ? 6 : 0,
        marginRight: theme.spacing.sm,
        // Remove any default outlines
        outlineStyle: 'none',
        borderWidth: 0,
    },
    sendButtonWrapper: {
        marginBottom: 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF8A80',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF8A80',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default InputBar;
