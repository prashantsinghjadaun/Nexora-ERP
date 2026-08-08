import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { UserPayload } from '../types/express';

export const generateToken = (payload: UserPayload): string => {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, config.JWT_SECRET as Secret, options);
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, config.JWT_SECRET as Secret) as UserPayload;
};
