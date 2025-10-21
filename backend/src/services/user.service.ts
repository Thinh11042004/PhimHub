import bcrypt from 'bcryptjs';
import { UserRepository } from '../models/UserRepository';
import { User, UserWithRole, CreateUserRequest, UpdateUserRequest, UserQuery } from '../types/database';
import { UserResponse, LoginRequest, RegisterRequest } from '../types';

export class UserService {
  private static get userRepository(): UserRepository {
    return new UserRepository();
  }
  static async findByEmailOrUsername(identifier: string): Promise<UserWithRole | null> {
    return await this.userRepository.findByEmailOrUsername(identifier);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  static async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findByUsername(username);
  }

  static async findById(id: number): Promise<UserWithRole | null> {
    return await this.userRepository.findById(id);
  }

  static async create(userData: RegisterRequest): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email đã được sử dụng');
    }

    // Check if username already exists
    const existingUsername = await this.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Tên người dùng đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user data for database
    const createUserData: CreateUserRequest = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      fullname: userData.fullname,
      phone: userData.phone,
      // allow admin creation with specific role
      role_id: (userData as any).role_id ?? null
    };

    return await this.userRepository.create(createUserData);
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static toUserResponse(user: User | UserWithRole): UserResponse {
    const roleCode = (user as UserWithRole).role_code || 'user';
    return {
      id: user.id.toString(),
      email: user.email,
      username: user.username,
      fullname: user.fullname || '',
      phone: user.phone || '',
      role: roleCode as 'admin' | 'user',
      avatar: user.avatar || '',
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at
    };
  }

  static async getAllUsers(query: UserQuery = {}): Promise<UserWithRole[]> {
    return await this.userRepository.findAll(query);
  }

  static async updateUser(id: number, updateData: UpdateUserRequest): Promise<User | null> {
    return await this.userRepository.update(id, updateData);
  }

  static async update(id: number, updateData: UpdateUserRequest): Promise<User | null> {
    return await this.userRepository.update(id, updateData);
  }

  static async deleteUser(id: number): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  static async updatePassword(email: string, newPassword: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await this.userRepository.updatePassword(user.id, hashedPassword);
  }

  static async updatePasswordById(userId: number, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await this.userRepository.updatePassword(userId, hashedPassword);
  }

  static async createFromSocial(socialData: {
    email: string;
    username: string;
    avatar?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    // Check if user already exists
    let existingUser = await this.findByEmail(socialData.email);
    if (existingUser) {
      return existingUser;
    }

    // Generate unique username if needed
    let finalUsername = socialData.username;
    let counter = 1;
    while (await this.findByUsername(finalUsername)) {
      finalUsername = `${socialData.username}${counter}`;
      counter++;
    }

    // Create new user without password (social login)
    const createUserData: CreateUserRequest = {
      username: finalUsername,
      email: socialData.email,
      password: '', // No password for social login
      fullname: socialData.username,
      avatar: socialData.avatar
    };

    return await this.userRepository.create(createUserData);
  }

  static async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await this.userRepository.updatePassword(user.id, hashedPassword);
  }

  static async updateLastLogin(id: number): Promise<void> {
    await this.userRepository.updateLastLogin(id);
  }
}
