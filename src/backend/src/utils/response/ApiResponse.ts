import type { Response } from 'express';

/**
 * Standard success response interface
 */
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard pagination metadata
 */
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response interface
 */
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

/**
 * Helper class for standardized API responses
 */
export class ApiResponse {
  /**
   * Send a success response
   */
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      message,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send a paginated success response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination,
      message,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created<T>(res: Response, data: T, message?: string): void {
    this.success(res, data, message, 201);
  }

  /**
   * Send a no content response (204)
   */
  static noContent(res: Response): void {
    res.status(204).send();
  }
}
