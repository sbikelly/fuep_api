import { z } from 'zod';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.any().optional(),
});

// Validation result types
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

export const ValidationResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    errors: z.array(ValidationErrorSchema),
  });

// Common validation patterns
export const CommonValidationPatterns = {
  // Nigerian phone number (with or without country code)
  phoneNumber: /^(\+234|0)?[789][01]\d{8}$/,

  // Nigerian postal code
  postalCode: /^\d{6}$/,

  // JAMB registration number (10-15 characters, alphanumeric)
  jambRegNo: /^[A-Z0-9]{10,15}$/,

  // Academic session (e.g., 2023/2024)
  academicSession: /^\d{4}\/\d{4}$/,

  // CGPA (0.00 to 5.00)
  cgpa: /^([0-4](\.[0-9]{1,2})?|5\.00)$/,

  // Nigerian states
  nigerianStates: [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Federal Capital Territory',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
  ] as const,

  // File upload constraints
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxFiles: 5,
  },
} as const;

// Custom Zod validators
export const CustomValidators = {
  // Nigerian phone number validator
  nigerianPhone: z.string().regex(CommonValidationPatterns.phoneNumber, {
    message: 'Please enter a valid Nigerian phone number',
  }),

  // JAMB registration number validator
  jambRegNo: z.string().regex(CommonValidationPatterns.jambRegNo, {
    message: 'Please enter a valid JAMB registration number',
  }),

  // Academic session validator
  academicSession: z.string().regex(CommonValidationPatterns.academicSession, {
    message: 'Please enter a valid academic session (e.g., 2023/2024)',
  }),

  // CGPA validator
  cgpa: z.string().regex(CommonValidationPatterns.cgpa, {
    message: 'Please enter a valid CGPA between 0.00 and 5.00',
  }),

  // Nigerian state validator
  nigerianState: z.enum(CommonValidationPatterns.nigerianStates, {
    errorMap: () => ({ message: 'Please select a valid Nigerian state' }),
  }),

  // File size validator
  fileSize: (maxSize: number = CommonValidationPatterns.fileUpload.maxSize) =>
    z.number().max(maxSize, {
      message: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
    }),

  // File type validator
  fileType: (
    allowedTypes: readonly string[] = CommonValidationPatterns.fileUpload.allowedMimeTypes
  ) =>
    z.string().refine((type) => allowedTypes.includes(type), {
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }),
};

// Form validation helpers
export const FormValidationHelpers = {
  // Create a validation result from Zod parse result
  fromZodResult: <T>(result: z.SafeParseReturnType<T, T>): ValidationResult<T> => {
    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: [],
      };
    }

    return {
      success: false,
      errors: result.error.errors.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code || 'INVALID_VALUE',
        value: undefined,
      })),
    };
  },

  // Validate a single field
  validateField: <T>(schema: z.ZodType<T>, value: any, fieldName: string): ValidationResult<T> => {
    const result = schema.safeParse(value);
    return FormValidationHelpers.fromZodResult(result);
  },

  // Validate multiple fields
  validateFields: <T extends Record<string, any>>(
    schemas: Record<keyof T, z.ZodType<any>>,
    values: Partial<T>
  ): ValidationResult<T> => {
    const errors: ValidationError[] = [];
    const validatedData: Partial<T> = {};

    for (const [field, schema] of Object.entries(schemas)) {
      const value = values[field as keyof T];
      if (value !== undefined) {
        const result = schema.safeParse(value);
        if (!result.success) {
          errors.push(
            ...result.error.errors.map((err) => ({
              field: field,
              message: err.message,
              code: err.code || 'INVALID_VALUE',
              value: undefined,
            }))
          );
        } else {
          validatedData[field as keyof T] = result.data;
        }
      }
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? (validatedData as T) : undefined,
      errors,
    };
  },
};

// Error codes for consistent error handling
export const ValidationErrorCodes = {
  REQUIRED: 'REQUIRED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_RANGE: 'INVALID_RANGE',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_VALUE: 'INVALID_VALUE',
  DUPLICATE: 'DUPLICATE',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Error messages for consistent user experience
export const ValidationErrorMessages = {
  [ValidationErrorCodes.REQUIRED]: 'This field is required',
  [ValidationErrorCodes.INVALID_FORMAT]: 'Invalid format',
  [ValidationErrorCodes.INVALID_LENGTH]: 'Invalid length',
  [ValidationErrorCodes.INVALID_RANGE]: 'Value out of range',
  [ValidationErrorCodes.INVALID_TYPE]: 'Invalid type',
  [ValidationErrorCodes.INVALID_VALUE]: 'Invalid value',
  [ValidationErrorCodes.DUPLICATE]: 'Already exists',
  [ValidationErrorCodes.NOT_FOUND]: 'Not found',
  [ValidationErrorCodes.UNAUTHORIZED]: 'Unauthorized',
  [ValidationErrorCodes.FORBIDDEN]: 'Access denied',
  [ValidationErrorCodes.CONFLICT]: 'Conflict with existing data',
  [ValidationErrorCodes.RATE_LIMITED]: 'Too many requests',
  [ValidationErrorCodes.INTERNAL_ERROR]: 'Internal server error',
} as const;
