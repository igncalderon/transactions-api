import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CreateTransactionRequest, CreateUserRequest } from '../types';

export const validateTransaction = (
  req: Request<{}, ApiResponse, CreateTransactionRequest>,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { fromUserId, toUserId, amount } = req.body;
  const errors: string[] = [];

  if (!fromUserId || typeof fromUserId !== 'string') {
    errors.push('fromUserId is required and must be a string');
  }

  if (!toUserId || typeof toUserId !== 'string') {
    errors.push('toUserId is required and must be a string');
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push('amount is required and must be a positive number');
  }

  if (errors.length > 0) {
    const response: ApiResponse = {
      success: false,
      message: 'Validation error',
      errors: errors.map(error => ({ field: 'body', message: error }))
    };
    res.status(400).json(response);
    return;
  }

  next();
};

export const validateUser = (
  req: Request<{}, ApiResponse, CreateUserRequest>,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const { name, email, balance } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.length < 2) {
    errors.push('name is required and must be at least 2 characters long');
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push('email is required and must be a valid email');
  }

  if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
    errors.push('balance must be a number greater than or equal to 0');
  }

  if (errors.length > 0) {
    const response: ApiResponse = {
      success: false,
      message: 'Validation error',
      errors: errors.map(error => ({ field: 'body', message: error }))
    };
    res.status(400).json(response);
    return;
  }

  next();
};
