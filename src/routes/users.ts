import express, { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { validateUser } from '../middleware/validation';
import { ApiResponse, CreateUserRequest } from '../types';

const router = express.Router();

router.post('/', validateUser, async (req: Request<{}, ApiResponse, CreateUserRequest>, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body);
    
    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'User created successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
});


router.get('/', async (_: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const users = await userService.getUsers();
    
    const response: ApiResponse = {
      success: true,
      data: users
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const user = await userService.getUserById(id);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        message: 'User not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse = {
      success: true,
      data: user
    };
    
    res.json(response);
  } catch (error) {
    return next(error);
  }
});

export default router;
