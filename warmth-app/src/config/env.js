// Environment Configuration
// This file manages environment-specific settings

import { Platform } from "react-native";

// Default to 10.0.2.2 for Android Emulator, 127.0.0.1 for iOS Simulator
const DEFAULT_LOCAL_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://127.0.0.1:5001";

const ENV = {
  // Backend API URL
  // In production, this should be set via environment variables
  API_URL:
    process.env.REACT_APP_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'https://warmth-ai.onrender.com',

  // Environment type
  IS_DEV: process.env.NODE_ENV === "development",
  IS_PROD: process.env.NODE_ENV === "production",
};

console.log('🌍 ENV Configuration:', {
  Platform: Platform.OS,
  API_URL: ENV.API_URL,
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL
});

export default ENV;
