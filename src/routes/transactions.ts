import express, { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService';
import { validateTransaction } from '../middleware/validation';
import { ApiResponse, CreateTransactionRequest, UpdateTransactionStatusRequest } from '../types';

const router = express.Router();

// POST /api/v1/transactions - Create new transaction
router.post('/', validateTransaction, async (req: Request<{}, ApiResponse, CreateTransactionRequest>, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const transaction = await transactionService.createTransaction(req.body);
    
    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
});

// GET /api/v1/transactions - Get all transactions or filter by userId
router.get('/', async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { userId } = req.query as { userId?: string };
    const transactions = await transactionService.getTransactions(userId || undefined);
    
    const response: ApiResponse = {
      success: true,
      data: transactions
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// GET /api/v1/transactions/:id - Get transaction by ID
router.get('/:id', async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const transaction = await transactionService.getTransactionById(id);
    
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        message: 'Transaction not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: transaction
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/v1/transactions/:id/approve - Approve pending transaction
router.patch('/:id/approve', async (req: Request<{ id: string }, ApiResponse>, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.approveTransaction(id);
    
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        message: 'Transaction not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transaction approved and processed successfully'
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/v1/transactions/:id/reject - Reject pending transaction
router.patch('/:id/reject', async (req: Request<{ id: string }, ApiResponse>, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.rejectTransaction(id);
    
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        message: 'Transaction not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transaction rejected successfully'
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/v1/transactions/:id/status - Update transaction status
router.patch('/:id/status', async (req: Request<{ id: string }, ApiResponse, UpdateTransactionStatusRequest>, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'confirmed', 'rejected'].includes(status)) {
      const response: ApiResponse = {
        success: false,
        message: 'Invalid status. Must be one of: pending, confirmed, rejected'
      };
      return res.status(400).json(response);
    }
    
    const transaction = await transactionService.updateTransactionStatus(id, status);
    
    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        message: 'Transaction not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transaction status updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
