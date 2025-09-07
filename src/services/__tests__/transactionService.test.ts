import { transactionService } from '../transactionService';
import { userService } from '../userService';
import { ErrorCodes } from '../../types/errors';

jest.mock('../userService', () => ({
  userService: {
    getUserById: jest.fn(),
    updateUserBalance: jest.fn(),
  },
}));

const mockUserService = userService as jest.Mocked<typeof userService>;

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (transactionService as any).transactions = [];
  });

  describe('createTransaction', () => {
    const mockFromUser = {
      id: 'user1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      balance: 100000,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    };

    const mockToUser = {
      id: 'user2',
      name: 'María García',
      email: 'maria@example.com',
      balance: 50000,
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    };

    beforeEach(() => {
      mockUserService.getUserById.mockImplementation((id: string) => {
        if (id === 'user1') return Promise.resolve(mockFromUser);
        if (id === 'user2') return Promise.resolve(mockToUser);
        return Promise.resolve(null);
      });
    });

    it('should create a confirmed transaction for amounts <= 50000', async () => {
      mockUserService.updateUserBalance.mockResolvedValue(mockFromUser);

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
      };

      const result = await transactionService.createTransaction(transactionData);

      expect(result).toMatchObject({
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
        status: 'confirmed',
      });
      expect(result.id).toBeDefined();
      expect(result.date).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', -25000);
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user2', 25000);
    });

    it('should create a pending transaction for amounts > 50000', async () => {
      mockUserService.updateUserBalance.mockResolvedValue(mockFromUser);

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
      };

      const result = await transactionService.createTransaction(transactionData);

      expect(result).toMatchObject({
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
        status: 'pending',
      });

      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', -75000);
      expect(mockUserService.updateUserBalance).not.toHaveBeenCalledWith('user2', 75000);
    });

    it('should throw error when from user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const transactionData = {
        fromUserId: 'nonexistent',
        toUserId: 'user2',
        amount: 25000,
      };

      await expect(transactionService.createTransaction(transactionData))
        .rejects.toThrow(ErrorCodes.USER_NOT_FOUND);
    });

    it('should throw error when to user not found', async () => {
      mockUserService.getUserById.mockImplementation((id: string) => {
        if (id === 'user1') return Promise.resolve(mockFromUser);
        return Promise.resolve(null);
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'nonexistent',
        amount: 25000,
      };

      await expect(transactionService.createTransaction(transactionData))
        .rejects.toThrow(ErrorCodes.USER_NOT_FOUND);
    });

    it('should throw error when insufficient balance', async () => {
      const poorUser = { ...mockFromUser, balance: 10000 };

      mockUserService.getUserById.mockImplementation((id: string) => {
        if (id === 'user1') return Promise.resolve(poorUser);
        if (id === 'user2') return Promise.resolve(mockToUser);
        return Promise.resolve(null);
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
      };

      await expect(transactionService.createTransaction(transactionData))
        .rejects.toThrow(ErrorCodes.INSUFFICIENT_BALANCE);
    });
  });

  describe('getTransactionById', () => {
    it('should return null for non-existent transaction', async () => {
      const result = await transactionService.getTransactionById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return transaction when it exists', async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 75000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
      };

      const createdTransaction = await transactionService.createTransaction(transactionData);
      const result = await transactionService.getTransactionById(createdTransaction.id);

      expect(result).toEqual(createdTransaction);
    });
  });

  describe('getTransactions', () => {
    beforeEach(async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 75000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      await transactionService.createTransaction({
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
      });

      await transactionService.createTransaction({
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 30000,
      });
    });

    it('should return all transactions when no userId provided', async () => {
      const result = await transactionService.getTransactions();
      expect(result).toHaveLength(2);
    });

    it('should return filtered transactions when userId provided', async () => {
      const result = await transactionService.getTransactions('user1');
      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.fromUserId === 'user1' || t.toUserId === 'user1')).toBe(true);
    });

    it('should return empty array when no transactions for user', async () => {
      const result = await transactionService.getTransactions('nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('approveTransaction', () => {
    it('should return null for non-existent transaction', async () => {
      const result = await transactionService.approveTransaction('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error when trying to approve non-pending transaction', async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 75000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
      };

      const createdTransaction = await transactionService.createTransaction(transactionData);

      await expect(transactionService.approveTransaction(createdTransaction.id))
        .rejects.toThrow(ErrorCodes.ONLY_PENDING_TRANSACTIONS_CAN_BE_APPROVED);
    });

    it('should approve pending transaction and credit destination', async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 25000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
      };

      const createdTransaction = await transactionService.createTransaction(transactionData);
      const result = await transactionService.approveTransaction(createdTransaction.id);

      expect(result?.status).toBe('confirmed');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user2', 75000);
    });
  });

  describe('rejectTransaction', () => {
    it('should return null for non-existent transaction', async () => {
      const result = await transactionService.rejectTransaction('nonexistent');
      expect(result).toBeNull();
    });

    it('should reject pending transaction and return money to origin', async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 25000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
      };

      const createdTransaction = await transactionService.createTransaction(transactionData);
      const result = await transactionService.rejectTransaction(createdTransaction.id);

      expect(result?.status).toBe('rejected');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', 75000);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should return null for non-existent transaction', async () => {
      const result = await transactionService.updateTransactionStatus('nonexistent', 'confirmed');
      expect(result).toBeNull();
    });

    it('should update status to confirmed and credit destination', async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 25000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
      };

      const createdTransaction = await transactionService.createTransaction(transactionData);
      const result = await transactionService.updateTransactionStatus(createdTransaction.id, 'confirmed');

      expect(result?.status).toBe('confirmed');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user2', 75000);
    });

    it('should update status to rejected and return money to origin', async () => {
      mockUserService.getUserById.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 100000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 25000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
      };

      const createdTransaction = await transactionService.createTransaction(transactionData);
      const result = await transactionService.updateTransactionStatus(createdTransaction.id, 'rejected');

      expect(result?.status).toBe('rejected');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', 75000);
    });
  });
});
