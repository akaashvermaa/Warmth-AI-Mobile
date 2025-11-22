// Environment Configuration
// This file manages environment-specific settings

import { Platform } from 'react-native';

// Default to 10.0.2.2 for Android Emulator, 127.0.0.1 for iOS Simulator
const DEFAULT_LOCAL_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://127.0.0.1:5001';

const ENV = {
    // Backend API URL
    // In production, this should be set via environment variables
    API_URL: process.env.REACT_APP_API_URL || process.env.EXPO_PUBLIC_API_URL || DEFAULT_LOCAL_URL,

    // Environment type
    IS_DEV: process.env.NODE_ENV === 'development',
    IS_PROD: process.env.NODE_ENV === 'production',
};

export default ENV;
