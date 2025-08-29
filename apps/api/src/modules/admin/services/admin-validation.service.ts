export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AdminValidationService {
  // Candidate validation
  static validateCandidateStatus(status: string): ValidationResult {
    const validStatuses = [
      'pending',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'admitted',
    ];

    if (!validStatuses.includes(status)) {
      return {
        isValid: false,
        errors: [`Invalid application status. Must be one of: ${validStatuses.join(', ')}`],
      };
    }

    return { isValid: true, errors: [] };
  }

  static validatePaymentStatus(status: string): ValidationResult {
    const validStatuses = ['pending', 'paid', 'verified', 'refunded'];

    if (!validStatuses.includes(status)) {
      return {
        isValid: false,
        errors: [`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`],
      };
    }

    return { isValid: true, errors: [] };
  }

  // Document status validation removed - documents module no longer exists

  static validateAdmissionStatus(status: string): ValidationResult {
    const validStatuses = [
      'not_applied',
      'applied',
      'under_review',
      'provisionally_admitted',
      'fully_admitted',
      'rejected',
    ];

    if (!validStatuses.includes(status)) {
      return {
        isValid: false,
        errors: [`Invalid admission status. Must be one of: ${validStatuses.join(', ')}`],
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateAdmissionDecision(decision: string): ValidationResult {
    const validDecisions = ['pending', 'admitted', 'rejected'];

    if (!validDecisions.includes(decision)) {
      return {
        isValid: false,
        errors: [`Invalid admission decision. Must be one of: ${validDecisions.join(', ')}`],
      };
    }

    return { isValid: true, errors: [] };
  }

  // Payment validation
  static validatePaymentAmount(amount: number): ValidationResult {
    if (typeof amount !== 'number' || amount <= 0) {
      return {
        isValid: false,
        errors: ['Payment amount must be a positive number'],
      };
    }

    if (amount > 1000000) {
      // 1 million NGN limit
      return {
        isValid: false,
        errors: ['Payment amount cannot exceed 1,000,000 NGN'],
      };
    }

    return { isValid: true, errors: [] };
  }

  // Search and filter validation
  static validateSearchQuery(query: string): ValidationResult {
    if (typeof query !== 'string') {
      return {
        isValid: false,
        errors: ['Search query must be a string'],
      };
    }

    if (query.length < 2) {
      return {
        isValid: false,
        errors: ['Search query must be at least 2 characters long'],
      };
    }

    if (query.length > 100) {
      return {
        isValid: false,
        errors: ['Search query cannot exceed 100 characters'],
      };
    }

    return { isValid: true, errors: [] };
  }

  static validatePaginationParams(limit: number, offset: number): ValidationResult {
    const errors: string[] = [];

    if (typeof limit !== 'number' || limit <= 0) {
      errors.push('Limit must be a positive number');
    }

    if (limit > 1000) {
      errors.push('Limit cannot exceed 1000');
    }

    if (typeof offset !== 'number' || offset < 0) {
      errors.push('Offset must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Date validation
  static validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      return {
        isValid: false,
        errors: ['Start date and end date must be valid Date objects'],
      };
    }

    if (startDate >= endDate) {
      return {
        isValid: false,
        errors: ['Start date must be before end date'],
      };
    }

    const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      return {
        isValid: false,
        errors: ['Date range cannot exceed 1 year'],
      };
    }

    return { isValid: true, errors: [] };
  }

  // UUID validation
  static validateUUID(uuid: string): ValidationResult {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      return {
        isValid: false,
        errors: ['Invalid UUID format'],
      };
    }

    return { isValid: true, errors: [] };
  }

  // Email validation
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        errors: ['Invalid email format'],
      };
    }

    return { isValid: true, errors: [] };
  }

  // Phone number validation (Nigerian format)
  static validatePhoneNumber(phone: string): ValidationResult {
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;

    if (!phoneRegex.test(phone)) {
      return {
        isValid: false,
        errors: ['Invalid phone number format. Must be a valid Nigerian phone number'],
      };
    }

    return { isValid: true, errors: [] };
  }

  // JAMB registration number validation
  static validateJambRegNo(jambRegNo: string): ValidationResult {
    if (!jambRegNo || typeof jambRegNo !== 'string') {
      return {
        isValid: false,
        errors: ['JAMB registration number is required'],
      };
    }

    if (jambRegNo.length !== 10) {
      return {
        isValid: false,
        errors: ['JAMB registration number must be exactly 10 characters'],
      };
    }

    if (!/^\d{10}$/.test(jambRegNo)) {
      return {
        isValid: false,
        errors: ['JAMB registration number must contain only digits'],
      };
    }

    return { isValid: true, errors: [] };
  }

  // JAMB score validation
  static validateJambScore(score: number): ValidationResult {
    if (typeof score !== 'number') {
      return {
        isValid: false,
        errors: ['JAMB score must be a number'],
      };
    }

    if (score < 0 || score > 400) {
      return {
        isValid: false,
        errors: ['JAMB score must be between 0 and 400'],
      };
    }

    return { isValid: true, errors: [] };
  }
}
