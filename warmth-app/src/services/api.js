// API Service for Warmth Backend
import ENV from '../config/env';

class WarmthAPI {
  constructor() {
    this.baseUrl = ENV.API_URL;
    this.authToken = null;
  }

  // Token management
  setAuthToken(token) {
    this.authToken = token;
  }

  getAuthToken() {
    return this.authToken;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  // Generic request helper
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {}),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Chat endpoints
  async sendMessage(message, userId, listeningMode = false) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        user_id: userId,
        listening_mode: listeningMode,
      }),
    });
  }

  async streamMessage(message, userId, listeningMode = false) {
    return this.request('/chat/stream', {
      method: 'POST',
      body: JSON.stringify({
        message,
        user_id: userId,
        listening_mode: listeningMode,
      }),
    });
  }

  // Journal & Insights endpoints
  async getMoodLogs() {
    return this.request('/mood_logs');
  }

  async getRecap() {
    try {
      return await this.request('/recap');
    } catch (e) {
      if (e.message && (e.message.includes('404') || e.message.includes('NOT FOUND'))) {
        return { recap: null };
      }
      throw e;
    }
  }

  async getJournalEntries() {
    return this.request('/journal_entries');
  }

  async getMemories() {
    return this.request('/memories');
  }

  // Preferences endpoints
  async getPreferences() {
    return this.request('/preferences');
  }

  async toggleListeningMode(enabled) {
    return this.request('/listening-mode', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Auth endpoints
  async getAuthStatus() {
    return this.request('/auth/status');
  }

  async getAuthConfig() {
    return this.request('/auth/config');
  }

  async createDevUser(userId, displayName = 'Mobile User') {
    const response = await this.request('/auth/dev-user', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        display_name: displayName
      }),
    });

    // Store the auth token
    if (response.access_token) {
      this.setAuthToken(response.access_token);
    }

    return response;
  }

  async signIn(email, password) {
    const response = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.access_token) {
      this.setAuthToken(response.access_token);
    }
    return response;
  }

  async signUp(email, password, fullName) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName
      }),
    });
  }

  async signOut() {
    try {
      await this.request('/auth/signout', { method: 'POST' });
    } catch (error) {
      console.warn('Server signout failed:', error);
    }
    this.clearAuthToken();
  }

  async refreshToken(refreshToken) {
    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (response.access_token) {
        this.setAuthToken(response.access_token);
      }
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  async getUserProfile() {
    return this.request('/auth/user');
  }
}

export default new WarmthAPI();