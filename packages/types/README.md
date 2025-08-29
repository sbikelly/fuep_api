# @fuep/types

Shared TypeScript types and validation schemas for the FUEP Post-UTME Portal.

## Overview

This package provides a centralized location for all shared types, interfaces, and validation schemas used across the FUEP Post-UTME Portal application. It ensures type safety and consistency between the API backend and React frontend.

## Features

- **Type Definitions**: Comprehensive TypeScript interfaces for all domain entities
- **Validation Schemas**: Zod schemas for runtime validation and type inference
- **Common Utilities**: Shared validation patterns, error handling, and helper functions
- **Nigerian Context**: Localized validation for Nigerian phone numbers, states, and academic patterns
- **Simplified Architecture**: Clean, focused interfaces that eliminate complexity and improve maintainability

## Package Structure

```
src/
├── index.ts          # Main exports
├── common.ts         # Base entities and common types
├── auth.ts           # Authentication and user types
├── candidate.ts      # Simplified candidate profile and application types
├── payment.ts        # Payment and transaction types
├── academic.ts       # Academic structure types
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

### Candidate Types (Simplified)

- `Candidate`: Core candidate profile with registration progress flags
- `Application`: Application lifecycle and payment status
- `EducationRecord`: Educational background (UTME/DE support)
- `NextOfKin`: Emergency contact details
- `Sponsor`: Financial sponsor information
- `Upload`: Document upload management
- `ProfileCompletionStatus`: Registration progress tracking
- `NextStepInfo`: Progressive registration flow guidance

### Payment Types

- `PaymentTransaction`: Payment transaction records
- `PaymentPurpose`: Simplified payment purpose management
- `PaymentInitiationRequest` & `Response`: Payment flow
- `WebhookPayload`: Payment provider webhooks
- `RemitaPaymentData`: Provider-specific data

### Academic Types

- `Faculty`: Academic faculty structure
- `Department`: Department within faculties
- `Program`: Specific degree programs
- `ProgramDepartmentLink`: Flexible program-department relationships

### Validation Types

- `ValidationError`: Structured validation errors
- `ValidationResult<T>`: Validation operation results
- `CommonValidationPatterns`: Regex patterns and constraints
- `CustomValidators`: Pre-built Zod validators

## Simplified Candidate System

### **Key Improvements**

- **Eliminated Complexity**: Removed 35+ redundant fields and complex interfaces
- **Progressive Registration**: Multi-phase registration flow with clear progress tracking
- **Unified Data Model**: Single source of truth for candidate information
- **Better Performance**: Optimized database schema with proper indexing
- **Cleaner Code**: Simplified operations and easier maintenance

### **Registration Flow**

1. **JAMB Verification**: Check JAMB registration and initiate registration
2. **Contact Information**: Complete basic contact details
3. **Biodata**: Personal information and demographics
4. **Education**: Academic background and qualifications
5. **Next of Kin**: Emergency contact information
6. **Sponsor**: Financial sponsor details
7. **Application Submission**: Final application review and submission

### **Database Schema**

- **candidates**: Core profile with progress flags
- **applications**: Application lifecycle and payment status
- **education_records**: Educational background (UTME/DE)
- **next_of_kin**: Emergency contacts
- **sponsors**: Financial sponsors
- **uploads**: Removed - documents module no longer exists

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
6. Maintain simplicity and avoid unnecessary complexity

## Version History

- **2.0.0**: Major simplification and refactoring of candidate system
- **1.0.0**: Initial release with core types and validation schemas
