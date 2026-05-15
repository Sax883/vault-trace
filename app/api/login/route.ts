import { NextRequest, NextResponse } from 'next/server';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    const client = await Client.findOne({ email });
    if (!client) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('Login error: missing JWT_SECRET');
      return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
    }

    const token = jwt.sign({ id: client._id, email: client.email }, jwtSecret, { expiresIn: '1h' });

    return NextResponse.json({ token, message: 'Login successful' }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Login failed. Please check database connection.' }, { status: 500 });
  }
}