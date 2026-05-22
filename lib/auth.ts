import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const secret = process.env.JWT_SECRET || (process.env.DEV_ALLOW_LOCAL === 'true' ? 'dev-local-jwt' : undefined);
    if (!secret) return null;
    // Accept simple dev tokens (non-JWT) in DEV_ALLOW_LOCAL mode.
    if (process.env.DEV_ALLOW_LOCAL === 'true') {
      if (token.startsWith('dev-admin-token-')) {
        return { id: token.replace('dev-admin-token-', ''), email: 'dev-admin@example.com', role: 'admin' } as any;
      }
      if (token.startsWith('dev-token-')) {
        return { id: token.replace('dev-token-', ''), email: 'dev@example.com', role: 'client' } as any;
      }
    }
    const decoded = jwt.verify(token, secret as string) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}