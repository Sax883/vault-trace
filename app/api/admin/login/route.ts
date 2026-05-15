import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminPassword = process.env.ADMIN_PASSWORD!;

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ email: adminEmail, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    return NextResponse.json({ token, message: 'Admin login successful' }, { status: 200 });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ message: 'Admin login failed' }, { status: 500 });
  }
}