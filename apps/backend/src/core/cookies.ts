import type { Request } from 'express';
import { COOKIE_NAME } from '@stl2d/contracts';

export { COOKIE_NAME };

export function getSessionCookieOptions(_req: Request) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}
