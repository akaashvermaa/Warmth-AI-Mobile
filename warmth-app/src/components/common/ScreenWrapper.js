import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '../../theme';

const ScreenWrapper = ({
    children,
    style,
    gradient = true,
    keyboardAvoiding = true
}) => {
    const Wrapper = gradient ? LinearGradient : View;
    const wrapperProps = gradient ? { colors: theme.colors.backgroundGradient } : { style: { backgroundColor: theme.colors.background } };

    return (
        <Wrapper style={styles.container} {...wrapperProps}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <SafeAreaView style={[styles.safeArea, style]} edges={['top', 'left', 'right', 'bottom']}>
                {keyboardAvoiding ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        {children}
                    </KeyboardAvoidingView>
                ) : (
                    children
                )}
            </SafeAreaView>
        </Wrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
});

export default ScreenWrapper;
