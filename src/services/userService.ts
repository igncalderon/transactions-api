import { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { ErrorCodes } from '../types/errors';
import pool from '../config/database';

class UserService {
  async getUsers(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const id = this.generateId();
    const balance = userData.balance || 0;
    
    const result = await pool.query(
      'INSERT INTO users (id, name, email, balance) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, userData.name, userData.email, balance]
    );
    
    return result.rows[0];
  }

  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(updateData.name);
      paramCount++;
    }

    if (updateData.email !== undefined) {
      fields.push(`email = $${paramCount}`);
      values.push(updateData.email);
      paramCount++;
    }

    if (updateData.balance !== undefined) {
      fields.push(`balance = $${paramCount}`);
      values.push(updateData.balance);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async updateUserBalance(id: string, amount: number): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current balance
      const userResult = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [id]);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);
      const newBalance = currentBalance + amount;
      
      if (newBalance < 0) {
        await client.query('ROLLBACK');
        throw new Error(ErrorCodes.INSUFFICIENT_BALANCE);
      }

      // Update balance
      const updateResult = await client.query(
        'UPDATE users SET balance = $1 WHERE id = $2 RETURNING *',
        [newBalance, id]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const userService = new UserService();
