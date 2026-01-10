import type { Request } from 'express';
import { COOKIE_NAME } from '@shared/const';

export function getSessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}
