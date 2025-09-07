import { transactionService } from '../transactionService';
import { userService } from '../userService';
import { ErrorCodes } from '../../types/errors';

// Mock the database pool
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../userService', () => ({
  userService: {
    getUserById: jest.fn(),
    updateUserBalance: jest.fn(),
  },
}));

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockPool = require('../../config/database').default;

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock database client for transactions
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);
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

      // Mock database response for INSERT query
      const mockTransaction = {
        id: 'tx123',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '25000',
        status: 'confirmed',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({
        rows: [mockTransaction],
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 25000,
      };

      const result = await transactionService.createTransaction(transactionData);

      expect(result).toMatchObject({
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '25000',
        status: 'confirmed',
      });
      expect(result.id).toBeDefined();
      expect(result.date).toBeDefined();
      expect((result as any).created_at).toBeDefined();
      expect((result as any).updated_at).toBeDefined();

      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', -25000);
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user2', 25000);
    });

    it('should create a pending transaction for amounts > 50000', async () => {
      mockUserService.updateUserBalance.mockResolvedValue(mockFromUser);

      // Mock database response for INSERT query
      const mockTransaction = {
        id: 'tx456',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '75000',
        status: 'pending',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({
        rows: [mockTransaction],
      });

      const transactionData = {
        fromUserId: 'user1',
        toUserId: 'user2',
        amount: 75000,
      };

      const result = await transactionService.createTransaction(transactionData);

      expect(result).toMatchObject({
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '75000',
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
      mockPool.query.mockResolvedValue({ rows: [] });
      
      const result = await transactionService.getTransactionById('nonexistent');
      expect(result).toBeNull();
    });

    it('should return transaction when it exists', async () => {
      const mockTransaction = {
        id: 'tx123',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '25000',
        status: 'confirmed',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({
        rows: [mockTransaction],
      });

      const result = await transactionService.getTransactionById('tx123');

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getTransactions', () => {
    it('should return all transactions when no userId provided', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          from_user_id: 'user1',
          to_user_id: 'user2',
          amount: '25000',
          status: 'confirmed',
          date: '2024-01-15T10:00:00.000Z',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
        },
        {
          id: 'tx2',
          from_user_id: 'user1',
          to_user_id: 'user2',
          amount: '30000',
          status: 'confirmed',
          date: '2024-01-15T10:00:00.000Z',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockTransactions,
      });

      const result = await transactionService.getTransactions();
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockTransactions);
    });

    it('should return filtered transactions when userId provided', async () => {
      const mockTransactions = [
        {
          id: 'tx1',
          from_user_id: 'user1',
          to_user_id: 'user2',
          amount: '25000',
          status: 'confirmed',
          date: '2024-01-15T10:00:00.000Z',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
        },
      ];

      mockPool.query.mockResolvedValue({
        rows: mockTransactions,
      });

      const result = await transactionService.getTransactions('user1');
      expect(result).toHaveLength(1);
      expect((result[0] as any).from_user_id).toBe('user1');
    });

    it('should return empty array when no transactions for user', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await transactionService.getTransactions('nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('approveTransaction', () => {
    it('should return null for non-existent transaction', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // SELECT transaction
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await transactionService.approveTransaction('nonexistent');
      expect(result).toBeNull();
    });

    it('should approve pending transaction and credit destination', async () => {
      const mockTransaction = {
        id: 'tx123',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '75000',
        status: 'pending',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      const mockUpdatedTransaction = {
        ...mockTransaction,
        status: 'confirmed',
        updated_at: '2024-01-15T11:00:00.000Z',
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [mockTransaction] }) // SELECT transaction
          .mockResolvedValueOnce({ rows: [mockUpdatedTransaction] }) // UPDATE transaction
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user2',
        name: 'María',
        email: 'maria@example.com',
        balance: 125000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      });

      const result = await transactionService.approveTransaction('tx123');

      expect(result?.status).toBe('confirmed');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user2', 75000);
    });
  });

  describe('rejectTransaction', () => {
    it('should return null for non-existent transaction', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // SELECT transaction
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await transactionService.rejectTransaction('nonexistent');
      expect(result).toBeNull();
    });

    it('should reject pending transaction and return money to origin', async () => {
      const mockTransaction = {
        id: 'tx123',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '75000',
        status: 'pending',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      const mockUpdatedTransaction = {
        ...mockTransaction,
        status: 'rejected',
        updated_at: '2024-01-15T11:00:00.000Z',
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [mockTransaction] }) // SELECT transaction
          .mockResolvedValueOnce({ rows: [mockUpdatedTransaction] }) // UPDATE transaction
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 175000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      });

      const result = await transactionService.rejectTransaction('tx123');

      expect(result?.status).toBe('rejected');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', 75000);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should return null for non-existent transaction', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // SELECT transaction
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await transactionService.updateTransactionStatus('nonexistent', 'confirmed');
      expect(result).toBeNull();
    });

    it('should update status to confirmed and credit destination', async () => {
      const mockTransaction = {
        id: 'tx123',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '75000',
        status: 'pending',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      const mockUpdatedTransaction = {
        ...mockTransaction,
        status: 'confirmed',
        updated_at: '2024-01-15T11:00:00.000Z',
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [mockTransaction] }) // SELECT transaction
          .mockResolvedValueOnce({ rows: [mockUpdatedTransaction] }) // UPDATE transaction
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user2',
        name: 'María',
        email: 'maria@example.com',
        balance: 125000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      });

      const result = await transactionService.updateTransactionStatus('tx123', 'confirmed');

      expect(result?.status).toBe('confirmed');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user2', 75000);
    });

    it('should update status to rejected and return money to origin', async () => {
      const mockTransaction = {
        id: 'tx123',
        from_user_id: 'user1',
        to_user_id: 'user2',
        amount: '75000',
        status: 'pending',
        date: '2024-01-15T10:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
      };

      const mockUpdatedTransaction = {
        ...mockTransaction,
        status: 'rejected',
        updated_at: '2024-01-15T11:00:00.000Z',
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [mockTransaction] }) // SELECT transaction
          .mockResolvedValueOnce({ rows: [mockUpdatedTransaction] }) // UPDATE transaction
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      mockUserService.updateUserBalance.mockResolvedValue({
        id: 'user1',
        name: 'Juan',
        email: 'juan@example.com',
        balance: 175000,
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z',
      });

      const result = await transactionService.updateTransactionStatus('tx123', 'rejected');

      expect(result?.status).toBe('rejected');
      expect(mockUserService.updateUserBalance).toHaveBeenCalledWith('user1', 75000);
    });
  });
});
