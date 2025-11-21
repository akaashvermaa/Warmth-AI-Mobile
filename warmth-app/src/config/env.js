// Environment Configuration
// This file manages environment-specific settings

const ENV = {
    // Backend API URL
    // In production, this should be set via environment variables
    API_URL: process.env.REACT_APP_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5001',

    // Environment type
    IS_DEV: process.env.NODE_ENV === 'development',
    IS_PROD: process.env.NODE_ENV === 'production',
};

export default ENV;
