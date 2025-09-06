import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);

  const statusCode = 500;
  const message = err.message || 'Server Error';

  const response: ApiResponse = {
    success: false,
    message
  };

  res.status(statusCode).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const response: ApiResponse = {
    success: false,
    message: `Not found - ${req.originalUrl}`
  };
  res.status(404).json(response);
};