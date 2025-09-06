export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  status: TransactionStatus;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'rejected';

export interface CreateUserRequest {
  name: string;
  email: string;
  balance?: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  balance?: number;
}

export interface CreateTransactionRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface UpdateTransactionRequest {
  fromUserId?: string;
  toUserId?: string;
  amount?: number;
}

export interface UpdateTransactionStatusRequest {
  status: TransactionStatus;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  fromUserId?: string;
  toUserId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}
