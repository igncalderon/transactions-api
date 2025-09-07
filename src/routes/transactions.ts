import express, { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService';
import { validateTransaction } from '../middleware/validation';
import { ApiResponse, CreateTransactionRequest, UpdateTransactionStatusRequest } from '../types';

const router = express.Router();

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
