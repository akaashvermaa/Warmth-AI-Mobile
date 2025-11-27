import { Ionicons } from '@expo/vector-icons';
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
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../../theme';

const InputBar = ({ value, onChangeText, onSend, placeholder = "Share whatever’s on your mind…", disabled = false }) => {
    const sendButtonScale = useSharedValue(0.8);
    const insets = useSafeAreaInsets();

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
        } else {
            sendButtonScale.value = withSpring(0.8);
        }
    };

    const sendButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: sendButtonScale.value }],
        opacity: sendButtonScale.value,
    }));

    const showSendButton = value && value.trim().length > 0;

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 24 }]}>
            <View style={[styles.inputContainer, theme.shadows.soft]}>
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textQuiet}
                    value={value}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={1000}
                    editable={!disabled}
                    returnKeyType="default" // "send" often closes keyboard on iOS, default keeps it open for multiline
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
                                name="arrow-up"
                                size={20}
                                color="#FFF"
                            />
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
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
        backgroundColor: theme.colors.inputBackground,
        borderRadius: theme.borderRadius.pill,
        paddingHorizontal: 20,
        paddingVertical: 12,
        minHeight: 56,
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
    },
    input: {
        flex: 1,
        fontFamily: theme.typography.body.fontFamily,
        fontSize: 16,
        color: theme.colors.text,
        maxHeight: 120,
        paddingTop: Platform.OS === 'ios' ? 6 : 0,
        paddingBottom: Platform.OS === 'ios' ? 6 : 0,
        marginRight: theme.spacing.sm,
    },
    sendButtonWrapper: {
        marginBottom: 4,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default InputBar;
