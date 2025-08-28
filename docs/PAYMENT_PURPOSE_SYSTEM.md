# Payment Purpose System Documentation

## Overview

The Payment Purpose System has been completely refactored to provide a simple, straightforward approach to managing payment configurations for different academic sessions and levels. This system replaces the previous complex, multi-table approach with a single, well-structured table.

## Architecture

### Database Schema

The system uses a single `payment_purposes` table with the following structure:

```sql
CREATE TABLE payment_purposes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 varchar(100) NOT NULL,
  purpose              varchar(50) NOT NULL,
  description          text,
  amount               numeric(14,2) NOT NULL,
  is_active            boolean NOT NULL DEFAULT true,
  session              varchar(16) NOT NULL,
  level                varchar(10) NOT NULL,
  created_by           uuid REFERENCES admin_users(id),
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
```

### Key Fields

- **`name`**: Human-readable name for the payment purpose (e.g., "Post-UTME Application Fee")
- **`purpose`**: Payment purpose code (e.g., "POST_UTME", "ACCEPTANCE", "SCHOOL_FEES")
- **`amount`**: Amount in Nigerian Naira (NGN)
- **`session`**: Academic session (e.g., "2024/2025")
- **`level`**: Academic level (e.g., "100", "200", "300", "400")
- **`is_active`**: Whether this payment purpose is currently active

### Constraints and Indexes

```sql
-- Unique constraint to prevent duplicate purposes per session and level
CREATE UNIQUE INDEX idx_payment_purposes_unique ON payment_purposes(session, purpose, level);

-- Performance indexes
CREATE INDEX idx_payment_purposes_session ON payment_purposes(session);
CREATE INDEX idx_payment_purposes_purpose ON payment_purposes(purpose);
CREATE INDEX idx_payment_purposes_active ON payment_purposes(is_active);
CREATE INDEX idx_payment_purposes_level ON payment_purposes(level);
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Get All Payment Purposes

```
GET /admin/payment/purposes
Query Parameters:
- session (optional): Filter by academic session
- purpose (optional): Filter by payment purpose
- level (optional): Filter by academic level
- isActive (optional): Filter by active status
```

#### Get Payment Purposes by Session

```
GET /admin/payment/purposes/session/:session
```

#### Get Payment Purposes by Level

```
GET /admin/payment/purposes/level/:level
```

#### Get Payment Purposes by Purpose Type

```
GET /admin/payment/purposes/purpose/:purpose
```

#### Get Payment Purpose by Key

```
GET /admin/payment/purposes/key/:session/:purpose/:level
```

#### Get Payment Purpose by ID

```
GET /admin/payment/purposes/:id
```

### Protected Endpoints (Require Authentication)

#### Create Payment Purpose

```
POST /admin/payment/purposes
Required Permissions: admin_payment_purposes:create

Body:
{
  "name": "Post-UTME Application Fee",
  "purpose": "POST_UTME",
  "description": "Application fee for Post-UTME examination",
  "amount": 2500.00,
  "session": "2024/2025",
  "level": "100"
}
```

#### Update Payment Purpose

```
PUT /admin/payment/purposes/:id
Required Permissions: admin_payment_purposes:update

Body:
{
  "name": "Updated Name",
  "description": "Updated description",
  "amount": 3000.00,
  "isActive": true,
  "level": "200"
}
```

#### Delete Payment Purpose

```
DELETE /admin/payment/purposes/:id
Required Permissions: admin_payment_purposes:delete
```

#### Toggle Payment Purpose Status

```
PATCH /admin/payment/purposes/:id/toggle
Required Permissions: admin_payment_purposes:update
```

#### Get Payment Purpose Statistics

```
GET /admin/payment/purposes/stats/statistics
Required Permissions: admin_payment_purposes:read
```

## Service Layer

### PaymentPurposeService

The `PaymentPurposeService` provides the business logic for managing payment purposes:

```typescript
export class PaymentPurposeService {
  // Create a new payment purpose
  async createPaymentPurpose(request: CreatePaymentPurposeRequest): Promise<PaymentPurposeConfig>;

  // Get payment purposes with optional filtering
  async getPaymentPurposes(filters: PaymentPurposeFilters = {}): Promise<PaymentPurposeConfig[]>;

  // Get payment purpose by ID
  async getPaymentPurposeById(id: string): Promise<PaymentPurposeConfig | null>;

  // Get payment purpose by session, purpose, and level
  async getPaymentPurposeByKey(
    session: string,
    purpose: PaymentPurpose,
    level: string
  ): Promise<PaymentPurposeConfig | null>;

  // Update payment purpose
  async updatePaymentPurpose(
    id: string,
    updates: UpdatePaymentPurposeRequest
  ): Promise<PaymentPurposeConfig>;

  // Delete payment purpose
  async deletePaymentPurpose(id: string): Promise<void>;

  // Get payment purposes for a specific session
  async getPaymentPurposesBySession(session: string): Promise<PaymentPurposeConfig[]>;

  // Get payment purposes by level
  async getPaymentPurposesByLevel(level: string): Promise<PaymentPurposeConfig[]>;

  // Get payment purposes by purpose type
  async getPaymentPurposesByPurpose(purpose: PaymentPurpose): Promise<PaymentPurposeConfig[]>;

  // Toggle payment purpose active status
  async togglePaymentPurposeStatus(id: string): Promise<PaymentPurposeConfig>;

  // Get payment purpose statistics
  async getPaymentPurposeStatistics(): Promise<any>;
}
```

## Integration with Payment System

### Payment Service Integration

The `PaymentService` now directly uses the simplified payment purposes:

```typescript
export class PaymentService {
  // Get payment purposes for a session using the new simplified structure
  async getPaymentPurposes(session: string): Promise<any[]> {
    const paymentPurposes = await db('payment_purposes')
      .where('session', session)
      .andWhere('is_active', true)
      .orderBy(['level', 'purpose']);

    return paymentPurposes.map((pp) => ({
      id: pp.id,
      name: pp.name,
      purpose: pp.purpose,
      description: pp.description,
      amount: pp.amount,
      session: pp.session,
      level: pp.level,
      isActive: pp.is_active,
    }));
  }

  // Validate payment purpose and get configured details
  private async validatePaymentPurpose(request: PaymentInitiationRequest): Promise<any> {
    const paymentPurposes = await this.getPaymentPurposes(request.session);
    const configuredPaymentPurpose = paymentPurposes.find((pt) => pt.purpose === request.purpose);

    if (!configuredPaymentPurpose) {
      throw new Error(
        `Payment purpose '${request.purpose}' not configured for session '${request.session}'`
      );
    }

    return configuredPaymentPurpose;
  }
}
```

### Remita Integration

The system now directly integrates with Remita payment gateway:

```typescript
export class RemitaService {
  // Generate RRR for payment
  async generateRRR(request: RemitaPaymentRequest): Promise<string>;

  // Check payment status
  async getPaymentStatus(rrr: string): Promise<PaymentStatus>;

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean;

  // Get payment URL
  getPaymentUrl(rrr: string): string;
}
```

## Migration Guide

### From Old System

1. **Backup existing data**: Export all payment purpose configurations
2. **Run migration**: Execute `infra/db/008_simplify_payment_purposes.sql`
3. **Update application code**: Use new service methods and types
4. **Test thoroughly**: Verify all payment flows work correctly

### Sample Data

The migration includes sample data for the 2024/2025 session:

```sql
INSERT INTO payment_purposes (name, purpose, description, amount, session, level) VALUES
('Post-UTME Application Fee', 'POST_UTME', 'Application fee for Post-UTME examination', 2500.00, '2024/2025', '100'),
('Acceptance Fee', 'ACCEPTANCE', 'Fee for accepting admission offer', 50000.00, '2024/2025', '100'),
('School Fees - 100 Level', 'SCHOOL_FEES', 'First year school fees', 150000.00, '2024/2025', '100'),
('School Fees - 200 Level', 'SCHOOL_FEES', 'Second year school fees', 150000.00, '2024/2025', '200'),
('School Fees - 300 Level', 'SCHOOL_FEES', 'Third year school fees', 150000.00, '2024/2025', '300'),
('School Fees - 400 Level', 'SCHOOL_FEES', 'Fourth year school fees', 150000.00, '2024/2025', '400'),
('Library Fee', 'LIBRARY_FEE', 'Annual library access fee', 5000.00, '2024/2025', '100'),
('Hostel Fee', 'HOSTEL_FEE', 'On-campus accommodation fee', 25000.00, '2024/2025', '100'),
('Medical Fee', 'MEDICAL_FEE', 'Health services fee', 3000.00, '2024/2025', '100'),
('Sports Fee', 'SPORTS_FEE', 'Sports and recreation fee', 2000.00, '2024/2025', '100');
```

## Benefits of New System

### 1. **Simplified Architecture**

- Single table instead of multiple related tables
- Clear, straightforward data model
- Easier to understand and maintain

### 2. **Improved Performance**

- Optimized indexes for common queries
- Reduced JOIN operations
- Faster data retrieval

### 3. **Better Maintainability**

- Centralized payment purpose logic
- Consistent API structure
- Easier to add new features

### 4. **Enhanced Flexibility**

- Easy to add new payment purposes
- Simple session and level management
- Quick status toggling

### 5. **Direct Remita Integration**

- No abstraction layer overhead
- Direct API calls to Remita
- Simplified webhook processing

## Security Considerations

### Authentication & Authorization

- All modification endpoints require authentication
- Role-based access control (RBAC) implementation
- Permission-based endpoint protection

### Rate Limiting

- Admin endpoints use `adminRateLimit`
- Payment endpoints use `paymentRateLimit`
- Prevents abuse and ensures system stability

### Input Validation

- All inputs are validated using Zod schemas
- SQL injection protection through Knex.js
- XSS protection through input sanitization

## Monitoring & Logging

### Structured Logging

- All operations are logged with context
- Error tracking and monitoring
- Performance metrics collection

### Health Checks

- Database connectivity monitoring
- Service health endpoints
- Payment gateway status checks

## Future Enhancements

### 1. **Bulk Operations**

- Import/export payment purposes via CSV
- Bulk status updates
- Batch creation of payment purposes

### 2. **Advanced Filtering**

- Date range filtering
- Amount range filtering
- Complex search queries

### 3. **Audit Trail**

- Track all changes to payment purposes
- User action logging
- Change history management

### 4. **Integration Features**

- Webhook notifications for changes
- API rate limiting per user
- Advanced caching strategies

## Troubleshooting

### Common Issues

1. **Payment Purpose Not Found**
   - Verify session, purpose, and level combination exists
   - Check if payment purpose is active
   - Ensure proper database connection

2. **Permission Denied**
   - Verify user has required permissions
   - Check authentication token validity
   - Ensure proper role assignment

3. **Database Errors**
   - Check database connectivity
   - Verify table structure
   - Review migration status

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## Support

For technical support or questions about the Payment Purpose System:

1. **Documentation**: Check this document first
2. **Code Review**: Review the service implementations
3. **Logs**: Check application logs for error details
4. **Database**: Verify data integrity and structure

---

_This documentation covers the new simplified Payment Purpose System. For legacy system information, refer to the previous documentation or contact the development team._
