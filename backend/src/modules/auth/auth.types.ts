import type { UserRole } from '../../models/User';

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions: string[];
  /** Landing route for this role (/customer, /partner, /admin). */
  home: string;
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  v: number;
}

export class HttpError extends Error {
  details?: { field: string; message: string }[];

  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}
