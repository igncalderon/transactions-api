import express, { Application, Response } from 'express';
import dotenv from 'dotenv';

import transactionRoutes from './routes/transactions';
import userRoutes from './routes/users';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupDatabase } from './utils/setup';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env['PORT'] || '3000', 10);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);

app.get('/ping', (_, res: Response) => {
  res.json({
    message: 'pong'
  });
});

app.use(notFound);
app.use(errorHandler);

// run server
async function startServer() {
  try {
    await setupDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/ping`);
      console.log(`👥 Users API: http://localhost:${PORT}/api/v1/users`);
      console.log(`💳 Transactions API: http://localhost:${PORT}/api/v1/transactions`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
