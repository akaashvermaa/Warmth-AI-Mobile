// Extended API with streaming support
// This wraps the existing api.js and adds streaming functionality
import ENV from '../config/env';
import api from './api';
import { streamChatMessage } from './streamingUtils';

// Create extended API object with all original methods plus streaming
const extendedApi = {
  // Spread all existing api methods
  ...api,
  
  // Add streaming method
  async sendMessageStream(message, onToken, onComplete, onError) {
    return streamChatMessage(
      ENV.API_URL,
      api.getAuthToken(),
      message,
      onToken,
      onComplete,
      onError
    );
  }
};

export default extendedApi;
