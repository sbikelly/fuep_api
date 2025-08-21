import { z } from 'zod';

import { ApiResponse, BaseEntity, BaseEntitySchema } from './common';

// JAMB verification types
export interface JambVerification {
  jambRegNo: string;
  surname: string;
  firstname: string;
  session: string;
  isVerified: boolean;
}

export const JambVerificationSchema = z.object({
  jambRegNo: z.string().min(10).max(15),
  surname: z.string().min(1).max(100),
  firstname: z.string().min(1).max(100),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  isVerified: z.boolean(),
});

// JAMB verification request
export interface JambVerificationRequest {
  jambRegNo: string;
}

export const JambVerificationRequestSchema = z.object({
  jambRegNo: z.string().min(5).max(20),
});

// User authentication types
export interface User extends BaseEntity {
  jambRegNo: string;
  email: string;
  passwordHash: string;
  status: 'pending' | 'active' | 'suspended' | 'deleted';
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export const UserSchema = BaseEntitySchema.extend({
  jambRegNo: z.string().min(10).max(15),
  email: z.string().email(),
  passwordHash: z.string(),
  status: z.enum(['pending', 'active', 'suspended', 'deleted']),
  lastLoginAt: z.date().optional(),
  failedLoginAttempts: z.number().int().min(0),
  lockedUntil: z.date().optional(),
});

// JWT Authentication
export interface JwtPayload {
  sub: string; // candidate_id
  username: string; // jamb_reg_no
  email: string;
  iat: number; // issued at
  exp: number; // expiration
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
}

export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  username: z.string().min(1).max(20),
  email: z.string().email(),
  iat: z.number(),
  exp: z.number(),
  type: z.enum(['access', 'refresh']),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().positive(),
  tokenType: z.literal('Bearer'),
});

// Login request
export interface LoginRequest {
  username: string; // JAMB registration number
  password: string;
}

export const LoginRequestSchema = z.object({
  username: z.string().min(1).max(20).describe('JAMB registration number'),
  password: z.string().min(6).describe('Password (minimum 6 characters)'),
});

// Login response
export interface LoginResponse extends ApiResponse<AuthTokens> {
  user: {
    id: string;
    jambRegNo: string;
    email: string;
    phone: string;
    isActive: boolean;
    tempPasswordFlag: boolean;
  };
}

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  data: AuthTokensSchema,
  user: z.object({
    id: z.string().uuid(),
    jambRegNo: z.string(),
    email: z.string(),
    phone: z.string(),
    isActive: z.boolean(),
    tempPasswordFlag: z.boolean(),
  }),
  timestamp: z.date(),
});

// Password change request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6).describe('New password (minimum 6 characters)'),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation don't match",
    path: ['confirmPassword'],
  });

export interface ChangePasswordResponse extends ApiResponse<null> {
  message: string;
}

export const ChangePasswordResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  message: z.string(),
  timestamp: z.date(),
});

// Password reset request
export interface PasswordResetRequest {
  email: string;
}

export const PasswordResetRequestSchema = z.object({
  email: z.string().email(),
});

// Password reset confirmation
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const PasswordResetConfirmSchema = z
  .object({
    token: z.string(),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation don't match",
    path: ['confirmPassword'],
  });

// Refresh token request
export interface RefreshTokenRequest {
  refreshToken: string;
}

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export interface RefreshTokenResponse extends ApiResponse<AuthTokens> {}

export const RefreshTokenResponseSchema = z.object({
  success: z.boolean(),
  data: AuthTokensSchema,
  timestamp: z.date(),
});

// Logout request
export interface LogoutRequest {
  refreshToken: string;
}

export const LogoutRequestSchema = z.object({
  refreshToken: z.string(),
});

export interface LogoutResponse extends ApiResponse<null> {
  message: string;
}

export const LogoutResponseSchema = z.object({
  success: z.boolean(),
  data: z.null(),
  message: z.string(),
  timestamp: z.date(),
});
