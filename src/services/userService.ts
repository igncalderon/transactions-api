import { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { ErrorCodes } from '../types/errors';

class UserService {
  private users: User[] = [];

  async getUsers(): Promise<User[]> {
    return [...this.users];
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const user: User = {
      id: this.generateId(),
      name: userData.name,
      email: userData.email,
      balance: userData.balance || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.push(user);
    return user;
  }

  async updateUser(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index === -1) {
      return null;
    }

    this.users[index] = {
      ...this.users[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    } as User;

    return this.users[index];
  }

  async updateUserBalance(id: string, amount: number): Promise<User | null> {
    const user = await this.getUserById(id);
    if (!user) {
      return null;
    }

    const newBalance = user.balance + amount;
    if (newBalance < 0) {
      throw new Error(ErrorCodes.INSUFFICIENT_BALANCE);
    }

    return this.updateUser(id, { balance: newBalance });
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    
    if (index === -1) {
      return false;
    }

    this.users.splice(index, 1);
    return true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const userService = new UserService();
