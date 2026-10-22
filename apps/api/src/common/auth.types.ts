import type { Request } from 'express';
import type { Role } from '@football/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export type RequestWithUser = Request & { user?: AuthenticatedUser };

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
