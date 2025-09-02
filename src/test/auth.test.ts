import { authApi, tokenUtils } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/client';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  })),
}));

describe('authApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };
      const mockUser = { id: '123', email: 'test@example.com', username: 'testuser', firstName: 'Test', lastName: 'User', avatar: null, createdAt: new Date(), updatedAt: new Date() };
      const mockToken = 'test-token';

      const fetch = require('node-fetch').default as jest.Mock;
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { user: mockUser, token: mockToken, refreshToken: 'refresh-token' } }),
      });

      const result = await authApi.register(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(fetch).toHaveBeenCalled();
    });

    it('should return an error if registration fails', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };
      const mockError = 'Registration failed';
        const fetch = require('node-fetch').default as jest.Mock;
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: mockError }),
      });

      const result = await authApi.register(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in a user successfully', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockUser = { id: '123', email: 'test@example.com', username: 'testuser', firstName: 'Test', lastName: 'User', avatar: null, createdAt: new Date(), updatedAt: new Date() };
      const mockToken = 'test-token';
        const fetch = require('node-fetch').default as jest.Mock;
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { user: mockUser, token: mockToken, refreshToken: 'refresh-token' } }),
      });


      const result = await authApi.login(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(fetch).toHaveBeenCalled();
    });

    it('should return an error if login fails', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockError = 'Login failed';
        const fetch = require('node-fetch').default as jest.Mock;
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: mockError }),
      });


      const result = await authApi.login(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should log out a user successfully', async () => {
        const fetch = require('node-fetch').default as jest.Mock;
      fetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({ success: true }),
      });

      const result = await authApi.logout();

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalled();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should handle logout errors', async () => {
        const fetch = require('node-fetch').default as jest.Mock;
      const mockError = 'Logout failed';
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: mockError }),
      });

      const result = await authApi.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});

describe('tokenUtils', () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe('setTokens', () => {
    it('should store authentication tokens in localStorage', () => {
      const mockToken = 'test-token';
      const mockRefreshToken = 'test-refresh-token';

      tokenUtils.setTokens(mockToken, mockRefreshToken);

      expect(localStorage.getItem('auth_token')).toBe(mockToken);
      expect(localStorage.getItem('refresh_token')).toBe(mockRefreshToken);
    });
  });

  describe('getToken', () => {
    it('should retrieve the authentication token from localStorage', () => {
      const mockToken = 'test-token';
      localStorage.setItem('auth_token', mockToken);

      const token = tokenUtils.getToken();

      expect(token).toBe(mockToken);
    });

    it('should return null if no authentication token is stored', () => {
      const token = tokenUtils.getToken();

      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve the refresh token from localStorage', () => {
      const mockRefreshToken = 'test-refresh-token';
      localStorage.setItem('refresh_token', mockRefreshToken);

      const refreshToken = tokenUtils.getRefreshToken();

      expect(refreshToken).toBe(mockRefreshToken);
    });

    it('should return null if no refresh token is stored', () => {
      const refreshToken = tokenUtils.getRefreshToken();

      expect(refreshToken).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove all tokens from localStorage', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
      localStorage.setItem('user', 'test-user');

      tokenUtils.clearTokens();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true if the token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.dX9e4oo6Wmj2eryczD8cbNJn8Yw7kC4F8PywYh3HQtY'; 

      const isExpired = tokenUtils.isTokenExpired(expiredToken);

      expect(isExpired).toBe(true);
    });

    it('should return false if the token is not expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const futureToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOj${now + (60 * 60)}fQ.signature`; 

      const isExpired = tokenUtils.isTokenExpired(futureToken);

      expect(isExpired).toBe(false);
    });

    it('should return true if the token cannot be parsed', () => {
      const invalidToken = 'invalid-token';

      const isExpired = tokenUtils.isTokenExpired(invalidToken);

      expect(isExpired).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return the expiration date if the token is valid', () => {
      const now = Math.floor(Date.now() / 1000);
      const futureToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOj${now + (60 * 60)}fQ.signature`; 

      const expirationDate = tokenUtils.getTokenExpiration(futureToken);

      expect(expirationDate).toBeInstanceOf(Date);
    });

    it('should return null if the token cannot be parsed', () => {
      const invalidToken = 'invalid-token';

      const expirationDate = tokenUtils.getTokenExpiration(invalidToken);

      expect(expirationDate).toBeNull();
    });
  });
});
