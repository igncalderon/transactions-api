import { Transaction, CreateTransactionRequest, TransactionStatus } from '../types';
import { ErrorCodes } from '../types/errors';
import { userService } from './userService';
import pool from '../config/database';

class TransactionService {
  private readonly MAX_AUTO_APPROVAL_AMOUNT = 50000;

  async createTransaction(transactionData: CreateTransactionRequest): Promise<Transaction> {
    // Verificar que ambos usuarios existen
    const fromUser = await userService.getUserById(transactionData.fromUserId);
    const toUser = await userService.getUserById(transactionData.toUserId);

    if (!fromUser || !toUser) {
      throw new Error(ErrorCodes.USER_NOT_FOUND);
    }

    // Verificar que el usuario origen tiene saldo suficiente
    if (fromUser.balance < transactionData.amount) {
      throw new Error(ErrorCodes.INSUFFICIENT_BALANCE);
    }

    // Determinar el estado según el monto
    const status: TransactionStatus = transactionData.amount > this.MAX_AUTO_APPROVAL_AMOUNT 
      ? 'pending' 
      : 'confirmed';

    const id = this.generateId();
    const now = new Date().toISOString();

    // Crear la transacción en la base de datos
    const result = await pool.query(
      'INSERT INTO transactions (id, from_user_id, to_user_id, amount, status, date, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, transactionData.fromUserId, transactionData.toUserId, transactionData.amount, status, now, now, now]
    );

    const transaction = result.rows[0];

    // congelar el dinero del usuario origen
    await userService.updateUserBalance(transaction.from_user_id, -parseFloat(transaction.amount));

    // Si la transacción se confirma automáticamente, acreditar al destino
    if (status === 'confirmed') {
      await userService.updateUserBalance(transaction.to_user_id, parseFloat(transaction.amount));
    }

    return transaction;
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions';
    let params: string[] = [];

    if (userId) {
      query += ' WHERE from_user_id = $1 OR to_user_id = $1';
      params = [userId];
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async approveTransaction(id: string): Promise<Transaction | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que la transacción existe y está pendiente
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND status = $2 FOR UPDATE',
        [id, 'pending']
      );
      
      if (transactionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const transaction = transactionResult.rows[0];

      // Cambiar estado a confirmed
      const updateResult = await client.query(
        'UPDATE transactions SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        ['confirmed', new Date().toISOString(), id]
      );

      // Acreditar al destino (el origen ya tiene el dinero descontado)
      await userService.updateUserBalance(transaction.to_user_id, parseFloat(transaction.amount));

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectTransaction(id: string): Promise<Transaction | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que la transacción existe y está pendiente
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND status = $2 FOR UPDATE',
        [id, 'pending']
      );
      
      if (transactionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const transaction = transactionResult.rows[0];

      // Cambiar estado a rejected
      const updateResult = await client.query(
        'UPDATE transactions SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        ['rejected', new Date().toISOString(), id]
      );

      // Devolver el dinero congelado al usuario origen
      await userService.updateUserBalance(transaction.from_user_id, parseFloat(transaction.amount));

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<Transaction | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verificar que la transacción existe y está pendiente
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND status = $2 FOR UPDATE',
        [id, 'pending']
      );
      
      if (transactionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const transaction = transactionResult.rows[0];

      // Actualizar estado
      const updateResult = await client.query(
        'UPDATE transactions SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [status, new Date().toISOString(), id]
      );

      // Si se confirma, solo acreditar al destino
      if (status === 'confirmed') {
        await userService.updateUserBalance(transaction.to_user_id, parseFloat(transaction.amount));
      }
      
      // Si se rechaza, devolver el dinero al origen
      if (status === 'rejected') {
        await userService.updateUserBalance(transaction.from_user_id, parseFloat(transaction.amount));
      }

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const transactionService = new TransactionService();
