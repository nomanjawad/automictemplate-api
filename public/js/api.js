/**
 * API Client Helper
 * Clean interface for making API requests to the backend
 */

const API_BASE = 'http://localhost:3000/api';

class APIClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  /**
   * Get authentication token from auth manager
   */
  getAuthToken() {
    if (typeof window.auth !== 'undefined' && window.auth.getToken) {
      return window.auth.getToken();
    }
    return null;
  }

  /**
   * Make an authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.error || data.message || `HTTP ${response.status}`,
          data
        };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('API Request Error:', error);

      if (error.status) {
        return { success: false, error: error.message, status: error.status, data: error.data };
      }

      return { success: false, error: error.message || 'Network error', status: 0 };
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // ===== Content Pages API =====

  /**
   * Get page by slug
   * @param {string} slug - Page slug (e.g., 'home')
   */
  async getPage(slug) {
    return this.get(`/content/pages/${slug}`);
  }

  /**
   * Create or update page
   * @param {string} slug - Page slug
   * @param {object} data - Page data { title, data, published, meta_data }
   */
  async upsertPage(slug, pageData) {
    return this.put(`/content/pages/${slug}`, pageData);
  }

  /**
   * Delete page
   * @param {string} slug - Page slug
   */
  async deletePage(slug) {
    return this.delete(`/content/pages/${slug}`);
  }

  /**
   * List all pages
   */
  async listPages() {
    return this.get('/content/pages');
  }

  // ===== Common Content API =====

  /**
   * Get common content by key
   * @param {string} key - Content key (e.g., 'site-settings')
   */
  async getCommonContent(key) {
    return this.get(`/content/common/${key}`);
  }

  /**
   * Create or update common content
   * @param {string} key - Content key
   * @param {object} data - Content data { title, data }
   */
  async upsertCommonContent(key, contentData) {
    return this.put(`/content/common/${key}`, contentData);
  }

  /**
   * Delete common content
   * @param {string} key - Content key
   */
  async deleteCommonContent(key) {
    return this.delete(`/content/common/${key}`);
  }

  /**
   * List all common content
   */
  async listCommonContent() {
    return this.get('/content/common');
  }

  // ===== Blog API =====

  /**
   * Get blog post by slug
   * @param {string} slug - Blog post slug
   */
  async getBlogPost(slug) {
    return this.get(`/blog/${slug}`);
  }

  /**
   * List all blog posts
   * @param {object} params - Query params { page, limit, search, category, tag }
   */
  async listBlogPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/blog?${queryString}` : '/blog';
    return this.get(endpoint);
  }

  /**
   * Create blog post
   * @param {object} data - Blog post data
   */
  async createBlogPost(postData) {
    return this.post('/blog', postData);
  }

  /**
   * Update blog post
   * @param {string} slug - Blog post slug
   * @param {object} data - Updated blog post data
   */
  async updateBlogPost(slug, postData) {
    return this.put(`/blog/${slug}`, postData);
  }

  /**
   * Delete blog post
   * @param {string} slug - Blog post slug
   */
  async deleteBlogPost(slug) {
    return this.delete(`/blog/${slug}`);
  }

  // ===== Upload API =====

  /**
   * Upload file
   * @param {File} file - File to upload
   * @param {string} folder - Target folder (optional)
   */
  async uploadFile(file, folder = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const token = this.getAuthToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, message: data.error || `HTTP ${response.status}`, data };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      console.error('Upload Error:', error);
      return { success: false, error: error.message || 'Upload failed', status: error.status || 0 };
    }
  }

  /**
   * Get file URL
   * @param {string} path - File path from upload response
   */
  getFileUrl(path) {
    return `${this.baseUrl}/upload/${path}`;
  }

  // ===== Auth API (delegated to auth.js, but included for completeness) =====

  /**
   * Login
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  /**
   * Register
   * @param {string} email
   * @param {string} password
   * @param {string} full_name
   */
  async register(email, password, full_name) {
    return this.post('/auth/register', { email, password, full_name });
  }

  /**
   * Logout
   */
  async logout() {
    return this.post('/auth/logout', {});
  }

  /**
   * Get user profile
   */
  async getProfile() {
    return this.get('/auth/profile');
  }

  /**
   * Verify JWT token with server
   * Uses Supabase's native JWT verification
   * @returns {Promise<{success: boolean, data: {authenticated: boolean, user?: object}}>}
   */
  async verifyAuth() {
    return this.get('/auth/verify');
  }

  // ===== Health Check =====

  /**
   * Check API health
   */
  async healthCheck() {
    return this.get('/health');
  }
}

// Create global API client instance
const api = new APIClient();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.api = api;
}
