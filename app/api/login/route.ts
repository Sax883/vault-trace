import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const conn = await connectDB();
    const { email, password } = await request.json();

    const jwtSecret = process.env.JWT_SECRET || (process.env.DEV_ALLOW_LOCAL === 'true' ? 'dev-local-jwt' : undefined);

    if (!conn && process.env.DEV_ALLOW_LOCAL === 'true') {
      if (!jwtSecret) {
        console.error('Login error: missing JWT_SECRET in dev fallback');
        return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
      }
      const id = new mongoose.Types.ObjectId().toHexString();
      const token = jwt.sign({ id, email, role: 'client' }, jwtSecret, { expiresIn: '1h' });
      const user = { id, email, name: email, role: 'client' };
      return NextResponse.json({ token, user, message: 'Login successful (dev fallback)' }, { status: 200 });
    }

    const client = await Client.findOne({ email });
    if (!client) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!jwtSecret) {
      console.error('Login error: missing JWT_SECRET');
      return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
    }

    const token = jwt.sign({ id: client._id, email: client.email, role: 'client' }, jwtSecret, { expiresIn: '1h' });

    const user = { id: client._id.toHexString(), email: client.email, name: client.name, role: 'client' };
    return NextResponse.json({ token, user, message: 'Login successful' }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Login failed. Please check database connection.' }, { status: 500 });
  }
}