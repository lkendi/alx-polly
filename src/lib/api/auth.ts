import { User, LoginCredentials, RegisterCredentials, AuthState, ApiResponse } from '@/lib/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available (except for login/register)
  const token = localStorage.getItem('auth_token');
  if (token && !endpoint.includes('/auth/')) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Authentication API functions
export const authApi = {
  // User registration
  async register(credentials: RegisterCredentials): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // User login
  async login(credentials: LoginCredentials): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // User logout
  async logout(): Promise<ApiResponse<void>> {
    const result = await apiRequest<void>('/auth/logout', {
      method: 'POST',
    });

    // Clear local storage regardless of API response
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    return result;
  },

  // Refresh access token
  async refreshToken(): Promise<ApiResponse<{
    token: string;
    refreshToken: string;
  }>> {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      };
    }

    return apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  // Get current user profile
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiRequest<User>('/auth/me');
  },

  // Update user profile
  async updateProfile(updates: Partial<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar: string;
  }>): Promise<ApiResponse<User>> {
    return apiRequest<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password with token
  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Verify email address
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Resend email verification
  async resendEmailVerification(): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/resend-verification', {
      method: 'POST',
    });
  },

  // Delete user account
  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },

  // OAuth login (Google, GitHub, etc.)
  async oauthLogin(provider: 'google' | 'github', code: string): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    return apiRequest(`/auth/oauth/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Link OAuth account
  async linkOAuthAccount(provider: 'google' | 'github', code: string): Promise<ApiResponse<void>> {
    return apiRequest(`/auth/oauth/${provider}/link`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  // Unlink OAuth account
  async unlinkOAuthAccount(provider: 'google' | 'github'): Promise<ApiResponse<void>> {
    return apiRequest(`/auth/oauth/${provider}/unlink`, {
      method: 'DELETE',
    });
  },

  // Get user sessions
  async getSessions(): Promise<ApiResponse<Array<{
    id: string;
    deviceName: string;
    ipAddress: string;
    userAgent: string;
    isCurrent: boolean;
    lastActivity: Date;
    createdAt: Date;
  }>>> {
    return apiRequest('/auth/sessions');
  },

  // Revoke session
  async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiRequest(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // Revoke all other sessions
  async revokeAllSessions(): Promise<ApiResponse<void>> {
    return apiRequest('/auth/sessions/revoke-all', {
      method: 'DELETE',
    });
  },
};

// Token management utilities
export const tokenUtils = {
  // Store authentication tokens
  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
  },

  // Get stored authentication token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  // Get stored refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  },

  // Clear all stored tokens
  clearTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // Check if token is expired (basic check)
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  },
};

// Mock API functions for development/demo
export const mockAuthApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: 'Email and password are required',
      };
    }

    // Mock successful login
    const mockUser: User = {
      id: 'demo-user',
      email: credentials.email,
      username: credentials.email.split('@')[0],
      firstName: 'Demo',
      lastName: 'User',
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockToken = 'mock-jwt-token-' + Date.now();
    const mockRefreshToken = 'mock-refresh-token-' + Date.now();

    return {
      success: true,
      data: {
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken,
      },
    };
  },

  async register(credentials: RegisterCredentials): Promise<ApiResponse<{
    user: User;
    token: string;
    refreshToken: string;
  }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock validation
    if (!credentials.email || !credentials.username || !credentials.password) {
      return {
        success: false,
        error: 'All fields are required',
      };
    }

    // Mock successful registration
    const mockUser: User = {
      id: 'demo-user-' + Date.now(),
      email: credentials.email,
      username: credentials.username,
      firstName: credentials.firstName || '',
      lastName: credentials.lastName || '',
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockToken = 'mock-jwt-token-' + Date.now();
    const mockRefreshToken = 'mock-refresh-token-' + Date.now();

    return {
      success: true,
      data: {
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken,
      },
    };
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return {
        success: true,
        data: JSON.parse(storedUser),
      };
    }

    return {
      success: false,
      error: 'Not authenticated',
    };
  },

  async logout(): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear tokens
    tokenUtils.clearTokens();

    return {
      success: true,
    };
  },
};
