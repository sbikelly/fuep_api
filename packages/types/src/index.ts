// FUEP Post-UTME Portal - Shared Types Package
// This package provides type definitions and validation schemas
// shared between the API and Web frontend applications.

// Re-export all type definitions
export * from './auth';
export * from './candidate';
export * from './common';
export * from './payment';
export * from './payment-providers';
export * from './validation';

// Package version for runtime checks
export const PACKAGE_VERSION = '1.0.0';
