import { prisma } from '../lib/prisma';
import { LoginInput } from '../validators/auth.validator';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { InvalidCredentialsError, UnauthorizedError, NotFoundError } from '../errors/AppError';
import { Role } from '@prisma/client';

export interface UserSafeProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface LoginResponseData {
  token: string;
  user: UserSafeProfile;
}

export class AuthService {
  public async login(input: LoginInput): Promise<LoginResponseData> {
    const emailNormalized = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new InvalidCredentialsError('Invalid email address or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive. Access denied.');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError('Invalid email address or password.');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userProfile: UserSafeProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };

    return {
      token,
      user: userProfile,
    };
  }

  public async getCurrentUser(userId: string): Promise<UserSafeProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('User account not found or is inactive.');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}

export const authService = new AuthService();
