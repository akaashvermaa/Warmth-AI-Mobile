import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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

const InputBar = ({ value, onChangeText, onSend, placeholder = "Talk to Warmth…", disabled = false }) => {
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

    // Only show send button when there's text
    const showSendButton = value && value.trim().length > 0;

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 24 }]}>
            <LinearGradient
                colors={theme.colors.inputGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientContainer}
            >
                <BlurView intensity={6} tint="light" style={styles.blurContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor={theme.colors.textQuiet}
                        value={value}
                        onChangeText={handleTextChange}
                        multiline
                        maxLength={1000}
                        editable={!disabled}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
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
                </BlurView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
    },
    gradientContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.inputBorder,
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 18,
        paddingVertical: 14,
        minHeight: 56,
    },
    input: {
        flex: 1,
        fontFamily: theme.typography.body.fontFamily,
        fontSize: 16,
        color: theme.colors.text,
        maxHeight: 120,
        paddingTop: 0,
        paddingBottom: 0,
        marginRight: theme.spacing.sm,
        outlineStyle: 'none',
    },
    sendButtonWrapper: {
        marginBottom: 2,
    },
    sendButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default InputBar;
