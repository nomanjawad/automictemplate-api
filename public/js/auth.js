/**
 * Authentication Helper
 * Manages JWT tokens in sessionStorage with 3-day expiration
 */

const AUTH_TOKEN_KEY = 'jwt_token';
const AUTH_EXPIRY_KEY = 'jwt_expiry';
const AUTH_USER_KEY = 'user_data';
const API_BASE = 'http://localhost:3000/api';
const TOKEN_EXPIRY_DAYS = 3;

class AuthManager {
  /**
   * Login with email and password
   * Stores JWT token in sessionStorage
   */
  async login(email, password) {
    try {
      console.log('[Auth] Attempting login for:', email);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      console.log('[Auth] Login successful');

      // Calculate expiry time (3 days from now)
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + TOKEN_EXPIRY_DAYS);

      // Store token, expiry, and user data in sessionStorage
      sessionStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
      sessionStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toISOString());
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      console.log('[Auth] Token saved to sessionStorage');
      console.log('[Auth] Expiry:', expiryTime.toISOString());

      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] Login failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated (client-side check)
   * Returns true if valid JWT token exists in sessionStorage
   * For server-side verification, use verifyWithServer()
   */
  isAuthenticated() {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const expiry = sessionStorage.getItem(AUTH_EXPIRY_KEY);

    console.log('[Auth] Checking authentication...');
    console.log('[Auth] Token exists:', !!token);
    console.log('[Auth] Expiry:', expiry);

    // No token = not authenticated
    if (!token || !expiry) {
      console.log('[Auth] No token or expiry found');
      return false;
    }

    // Check if token has expired
    const expiryDate = new Date(expiry);
    const now = new Date();

    if (expiryDate < now) {
      console.log('[Auth] Token expired, clearing session');
      this.clearSession();
      return false;
    }

    console.log('[Auth] Token valid');
    return true;
  }

  /**
   * Verify authentication with server using Supabase JWT validation
   * Makes GET request to /api/auth/verify
   * Supabase verifies the JWT token natively
   *
   * @returns {Promise<{authenticated: boolean, user?: object}>}
   */
  async verifyWithServer() {
    try {
      const token = this.getToken();

      if (!token) {
        console.log('[Auth] No token to verify');
        return { authenticated: false };
      }

      console.log('[Auth] Verifying token with server...');

      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.authenticated) {
        console.log('[Auth] Server verification successful');
        return { authenticated: true, user: data.user };
      } else {
        console.log('[Auth] Server verification failed:', data.message);
        this.clearSession();
        return { authenticated: false, message: data.message };
      }
    } catch (error) {
      console.error('[Auth] Server verification error:', error);
      return { authenticated: false, error: error.message };
    }
  }

  /**
   * Get JWT token
   */
  getToken() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  /**
   * Get current user data
   */
  getUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    const userData = sessionStorage.getItem(AUTH_USER_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('[Auth] Failed to parse user data:', e);
      return null;
    }
  }

  /**
   * Clear session data (logout)
   */
  clearSession() {
    console.log('[Auth] Clearing session');
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_EXPIRY_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.error('[Auth] Logout API call failed:', e);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Register new user
   */
  async register(email, password, full_name) {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();

      // Auto-login after registration
      if (data.session) {
        const expiryTime = new Date();
        expiryTime.setDate(expiryTime.getDate() + TOKEN_EXPIRY_DAYS);

        sessionStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
        sessionStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toISOString());
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const token = this.getToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    return fetch(url, { ...options, headers });
  }

  /**
   * Get redirect URL after login (from sessionStorage or default)
   */
  getRedirectUrl(defaultUrl = '/dashboard.html') {
    const redirect = sessionStorage.getItem('auth_redirect');
    if (redirect) {
      sessionStorage.removeItem('auth_redirect');
      return redirect;
    }
    return defaultUrl;
  }
}

// Create global auth instance
const auth = new AuthManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.auth = auth;
}
