export interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  timestamp: Date;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  totalPages: number;
  currentPage: number;
}

export class AdminResponseService {
  static success<T>(data: T, message?: string, requestId?: string): AdminApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
      requestId,
    };
  }

  static error(
    error: string | Error,
    _statusCode: number = 500,
    requestId?: string,
    errors?: string[]
  ): AdminApiResponse {
    const errorMessage = error instanceof Error ? error.message : error;

    return {
      success: false,
      error: errorMessage,
      errors,
      timestamp: new Date(),
      requestId,
    };
  }

  static notFound(resource: string, resourceId?: string, requestId?: string): AdminApiResponse {
    const message = resourceId
      ? `${resource} with ID ${resourceId} not found`
      : `${resource} not found`;

    return {
      success: false,
      error: message,
      timestamp: new Date(),
      requestId,
    };
  }

  static validationError(errors: string[], requestId?: string): AdminApiResponse {
    return {
      success: false,
      error: 'Validation failed',
      errors,
      timestamp: new Date(),
      requestId,
    };
  }

  static unauthorized(
    message: string = 'Unauthorized access',
    requestId?: string
  ): AdminApiResponse {
    return {
      success: false,
      error: message,
      timestamp: new Date(),
      requestId,
    };
  }

  static forbidden(message: string = 'Access forbidden', requestId?: string): AdminApiResponse {
    return {
      success: false,
      error: message,
      timestamp: new Date(),
      requestId,
    };
  }

  static conflict(message: string, requestId?: string): AdminApiResponse {
    return {
      success: false,
      error: message,
      timestamp: new Date(),
      requestId,
    };
  }

  static paginated<T>(
    items: T[],
    total: number,
    limit: number,
    offset: number,
    message?: string,
    requestId?: string
  ): AdminApiResponse<PaginatedResponse<T>> {
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);
    const hasMore = offset + limit < total;

    return {
      success: true,
      data: {
        items,
        total,
        limit,
        offset,
        hasMore,
        totalPages,
        currentPage,
      },
      message,
      timestamp: new Date(),
      requestId,
    };
  }

  static created<T>(data: T, message?: string, requestId?: string): AdminApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource created successfully',
      timestamp: new Date(),
      requestId,
    };
  }

  static updated<T>(data: T, message?: string, requestId?: string): AdminApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Resource updated successfully',
      timestamp: new Date(),
      requestId,
    };
  }

  static deleted(message?: string, requestId?: string): AdminApiResponse {
    return {
      success: true,
      message: message || 'Resource deleted successfully',
      timestamp: new Date(),
      requestId,
    };
  }

  static noContent(message?: string, requestId?: string): AdminApiResponse {
    return {
      success: true,
      message: message || 'Operation completed successfully',
      timestamp: new Date(),
      requestId,
    };
  }
}
