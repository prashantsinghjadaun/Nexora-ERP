import { Role } from '@prisma/client';

export interface UserPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
