import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { theme } from '../../theme';

const InputBar = ({ onSend, placeholder = "Talk to Warmth…", disabled = false }) => {
    const [message, setMessage] = useState('');
    const sendButtonScale = useSharedValue(0.8);

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
            sendButtonScale.value = withSpring(0.8);
        }
    };

    const handleTextChange = (text) => {
        setMessage(text);
        // Animate send button when text is present
        if (text.trim()) {
            sendButtonScale.value = withSpring(1);
        } else {
            sendButtonScale.value = withSpring(0.8);
        }
    };

    const sendButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sendButtonScale.value }],
        opacity: sendButtonScale.value,
    }));

    const canSend = message.trim().length > 0 && !disabled;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.container}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={message}
                        onChangeText={handleTextChange}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        maxLength={1000}
                        editable={!disabled}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />

                    <Animated.View style={sendButtonStyle}>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                canSend ? styles.sendButtonActive : styles.sendButtonInactive,
                            ]}
                            onPress={handleSend}
                            disabled={!canSend}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="arrow-forward"
                                size={20}
                                color={canSend ? '#FFFFFF' : theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        minHeight: 48,
        maxHeight: 120,
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        color: theme.colors.text,
        fontFamily: theme.typography.body.fontFamily,
        paddingVertical: theme.spacing.sm,
        paddingRight: theme.spacing.sm,
        maxHeight: 100,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    sendButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    sendButtonInactive: {
        backgroundColor: 'transparent',
    },
});

export default InputBar;
