# @fuep/types

Shared TypeScript types and validation schemas for the FUEP Post-UTME Portal.

## Overview

This package provides a centralized location for all shared types, interfaces, and validation schemas used across the FUEP Post-UTME Portal application. It ensures type safety and consistency between the API backend and React frontend.

## Features

- **Type Definitions**: Comprehensive TypeScript interfaces for all domain entities
- **Validation Schemas**: Zod schemas for runtime validation and type inference
- **Common Utilities**: Shared validation patterns, error handling, and helper functions
- **Nigerian Context**: Localized validation for Nigerian phone numbers, states, and academic patterns

## Package Structure

```
src/
├── index.ts          # Main exports
├── common.ts         # Base entities and common types
├── auth.ts           # Authentication and user types
├── candidate.ts      # Candidate profile and application types
├── payment.ts        # Payment and transaction types
└── validation.ts     # Validation utilities and patterns
```

## Installation

This package is part of the monorepo workspace and is automatically available to other packages.

## Usage

### Importing Types

```typescript
import { Candidate, CandidateSchema, PaymentTransaction, ValidationError } from '@fuep/types';
```

### Using Validation Schemas

```typescript
import { JambVerificationRequestSchema, FormValidationHelpers } from '@fuep/types';

// Validate request data
const validationResult = FormValidationHelpers.fromZodResult(
  JambVerificationRequestSchema.safeParse(requestBody)
);

if (validationResult.success) {
  // Data is valid and typed
  const data = validationResult.data;
} else {
  // Handle validation errors
  console.log(validationResult.errors);
}
```

### Custom Validators

```typescript
import { CustomValidators } from '@fuep/types';

const phoneSchema = CustomValidators.nigerianPhone;
const jambSchema = CustomValidators.jambRegNo;
const stateSchema = CustomValidators.nigerianState;
```

## Type Categories

### Common Types

- `BaseEntity`: Base interface for all database entities
- `ApiResponse<T>`: Standard API response wrapper
- `PaginationParams` & `PaginatedResponse<T>`: Pagination utilities
- `FileUpload`: File upload metadata

### Authentication Types

- `User`: User account information
- `JambVerification`: JAMB registration verification
- `LoginRequest` & `LoginResponse`: Authentication flows
- `JwtPayload`: JWT token contents

### Candidate Types

- `Candidate`: Candidate profile information
- `NextOfKin`: Emergency contact details
- `Sponsor`: Financial sponsor information
- `Education`: Educational background
- `Application`: Application lifecycle

### Payment Types

- `PaymentTransaction`: Payment transaction records
- `PaymentInitiationRequest` & `Response`: Payment flow
- `WebhookPayload`: Payment provider webhooks
- `RemitaPaymentData` & `FlutterwavePaymentData`: Provider-specific data

### Validation Types

- `ValidationError`: Structured validation errors
- `ValidationResult<T>`: Validation operation results
- `CommonValidationPatterns`: Regex patterns and constraints
- `CustomValidators`: Pre-built Zod validators

## Development

### Building

```bash
pnpm build:types
```

### Type Checking

```bash
pnpm --filter @fuep/types typecheck
```

### Watch Mode

```bash
pnpm --filter @fuep/types dev
```

## Dependencies

- **zod**: Runtime validation and schema definition
- **typescript**: Type definitions and compilation

## Contributing

When adding new types:

1. Follow the existing naming conventions
2. Include both TypeScript interfaces and Zod schemas
3. Add comprehensive JSDoc comments
4. Update this README if adding new categories
5. Ensure all exports are included in `src/index.ts`

## Version History

- **1.0.0**: Initial release with core types and validation schemas
