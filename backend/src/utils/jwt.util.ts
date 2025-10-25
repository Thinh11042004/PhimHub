import jwt from 'jsonwebtoken';
import { UserResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'phimhub-super-secret-jwt-key-2024';

export const generateToken = (user: UserResponse): string => {
  const payload = { 
    id: user.id, 
    email: user.email, 
    username: user.username,
    role: user.role 
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
