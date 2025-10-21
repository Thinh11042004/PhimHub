import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);

  // Default error response
  let statusCode = 500;
  let message = 'Đã xảy ra lỗi server';

  // Handle specific error types
  if (error.message.includes('validation')) {
    statusCode = 400;
    message = error.message;
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = error.message;
  } else if (error.message.includes('unauthorized') || error.message.includes('Invalid token')) {
    statusCode = 401;
    message = 'Không có quyền truy cập';
  } else if (error.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Bị cấm truy cập';
  } else if (error.message.includes('conflict') || error.message.includes('already exists')) {
    statusCode = 409;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
