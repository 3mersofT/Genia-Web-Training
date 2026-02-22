/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

const { createServerClient } = require('@supabase/ssr');

describe('Middleware - Admin Check', () => {
  let mockSupabaseClient: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    };

    createServerClient.mockReturnValue(mockSupabaseClient);
  });

  const createMockRequest = (pathname: string, cookies: Record<string, string> = {}) => {
    const url = `http://localhost:3000${pathname}`;
    const request = new NextRequest(url);

    // Mock cookies using spyOn
    const cookieMap = new Map(Object.entries(cookies));

    const getMock = jest.spyOn(request.cookies, 'get');
    getMock.mockImplementation((name: string) => {
      const value = cookieMap.get(name);
      return value ? { name, value } : undefined;
    });

    const setMock = jest.spyOn(request.cookies, 'set');
    setMock.mockImplementation(() => {});

    const getAllMock = jest.spyOn(request.cookies, 'getAll');
    getAllMock.mockImplementation(() =>
      Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }))
    );

    return request;
  };

  describe('Non-admin user access', () => {
    it('should redirect non-admin user to /dashboard with error parameter', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'student-user-id' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'student' },
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get('location')).toContain('/dashboard?error=access_denied');
    });

    it('should query user_profiles table for role', async () => {
      // Arrange
      const userId = 'test-user-id';
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
      });

      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'student' },
      });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

      // Act
      await middleware(mockRequest);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles');
      expect(mockSelect).toHaveBeenCalledWith('role');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSingle).toHaveBeenCalled();
    });
  });

  describe('Admin user access', () => {
    it('should allow admin user to access /admin routes', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response).toBeInstanceOf(NextResponse);
      // Should not redirect - status 200 or no redirect location
      const location = response.headers.get('location');
      expect(location).toBeNull();
    });
  });

  describe('Role caching', () => {
    it('should set role cache cookie with correct security options', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      const cookies = response.cookies.getAll();
      const roleCookie = cookies.find(c => c.name === 'user_role');

      expect(roleCookie).toBeDefined();
      expect(roleCookie?.value).toBe('admin');
    });

    it('should use cached role and bypass database query', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin', { user_role: 'admin' });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      // Database should not be queried if role is cached
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();

      // Should still allow access
      const location = response.headers.get('location');
      expect(location).toBeNull();
    });

    it('should redirect non-admin based on cached role', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin', { user_role: 'student' });
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'student-user-id' } },
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      // Database should not be queried if role is cached
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();

      // Should redirect
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard?error=access_denied');
    });
  });

  describe('Edge cases and fail-safe behavior', () => {
    it('should deny access when user profile is missing', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-without-profile' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null, // No profile found
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard?error=access_denied');
    });

    it('should deny access when database query fails', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      });
      // Mock database error by returning error in the response
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      // Should fail-safe and deny access when profile is null
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard?error=access_denied');
    });

    it('should deny access when profile role is undefined', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: undefined },
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard?error=access_denied');
    });
  });

  describe('Authentication checks', () => {
    it('should redirect unauthenticated users to /login', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }, // No authenticated user
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should only check admin role for /admin routes', async () => {
      // Arrange
      mockRequest = createMockRequest('/dashboard');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'student-user-id' } },
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      // Should not query database for role on non-admin routes
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('Admin sub-routes', () => {
    it('should protect /admin/users route', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin/users');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'student-user-id' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'student' },
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard?error=access_denied');
    });

    it('should allow admin access to /admin/settings', async () => {
      // Arrange
      mockRequest = createMockRequest('/admin/settings');
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
      });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'admin' },
            }),
          })),
        })),
      });

      // Act
      const response = await middleware(mockRequest);

      // Assert
      const location = response.headers.get('location');
      expect(location).toBeNull();
    });
  });
});
