import { Transaction, CreateTransactionRequest, TransactionStatus } from '../types';
import { ErrorCodes } from '../types/errors';
import { userService } from './userService';

class TransactionService {
  private transactions: Transaction[] = [];
  private readonly MAX_AUTO_APPROVAL_AMOUNT = 50000;

  async createTransaction(transactionData: CreateTransactionRequest): Promise<Transaction> {
    const fromUser = await userService.getUserById(transactionData.fromUserId);
    const toUser = await userService.getUserById(transactionData.toUserId);

    if (!fromUser || !toUser) {
      throw new Error(ErrorCodes.USER_NOT_FOUND);
    }

    if (fromUser.balance < transactionData.amount) {
      throw new Error(ErrorCodes.INSUFFICIENT_BALANCE);
    }

    const status: TransactionStatus = transactionData.amount > this.MAX_AUTO_APPROVAL_AMOUNT 
      ? 'pending' 
      : 'confirmed';

    const transaction: Transaction = {
      id: this.generateId(),
      fromUserId: transactionData.fromUserId,
      toUserId: transactionData.toUserId,
      amount: transactionData.amount,
      status,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.transactions.push(transaction);

    await userService.updateUserBalance(transaction.fromUserId, -transaction.amount);

    if (status === 'confirmed') {
      await userService.updateUserBalance(transaction.toUserId, transaction.amount);
    }

    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.transactions.find(transaction => transaction.id === id) || null;
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    let filteredTransactions = [...this.transactions];

    if (userId) {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.fromUserId === userId || transaction.toUserId === userId
      );
    }

    filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filteredTransactions;
  }

  async approveTransaction(id: string): Promise<Transaction | null> {
    const transaction = await this.getTransactionById(id);
    if (!transaction) {
      return null;
    }

    if (transaction.status !== 'pending') {
      throw new Error(ErrorCodes.ONLY_PENDING_TRANSACTIONS_CAN_BE_APPROVED);
    }

    transaction.status = 'confirmed';
    transaction.updatedAt = new Date().toISOString();

    await userService.updateUserBalance(transaction.toUserId, transaction.amount);

    return transaction;
  }

  async rejectTransaction(id: string): Promise<Transaction | null> {
    const transaction = await this.getTransactionById(id);
    if (!transaction) {
      return null;
    }

    if (transaction.status !== 'pending') {
      throw new Error(ErrorCodes.ONLY_PENDING_TRANSACTIONS_CAN_BE_REJECTED);
    }

    transaction.status = 'rejected';
    transaction.updatedAt = new Date().toISOString();

    await userService.updateUserBalance(transaction.fromUserId, transaction.amount);

    return transaction;
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    const transaction = await this.getTransactionById(id);
    if (!transaction) {
      return null;
    }

    if (transaction.status !== 'pending') {
      throw new Error(ErrorCodes.ONLY_PENDING_TRANSACTIONS_CAN_BE_UPDATED);
    }

    transaction.status = status;
    transaction.updatedAt = new Date().toISOString();

    if (status === 'confirmed') {
      await userService.updateUserBalance(transaction.toUserId, transaction.amount);
    }
    
    if (status === 'rejected') {
      await userService.updateUserBalance(transaction.fromUserId, transaction.amount);
    }

    return transaction;
  }


  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const transactionService = new TransactionService();
