import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET || (process.env.DEV_ALLOW_LOCAL === 'true' ? 'dev-local-jwt' : undefined);

    if ((!adminEmail || !adminPassword) && process.env.DEV_ALLOW_LOCAL === 'true') {
      if (!jwtSecret) {
        console.error('Admin login error: missing JWT_SECRET in dev fallback');
        return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
      }
      const token = jwt.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '1h' });
      const user = { email, role: 'admin' };
      return NextResponse.json({ token, user, message: 'Admin login successful (dev fallback)' }, { status: 200 });
    }

    if (!adminEmail || !adminPassword || !jwtSecret) {
      console.error('Admin login error: missing environment variables');
      return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ email: adminEmail, role: 'admin' }, jwtSecret, { expiresIn: '1h' });

    const user = { email: adminEmail, role: 'admin' };

    return NextResponse.json({ token, user, message: 'Admin login successful' }, { status: 200 });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ message: 'Admin login failed' }, { status: 500 });
  }
}