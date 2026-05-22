import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const conn = await connectDB();
    const { name, email, password, description, evidence, amountLost } = await request.json();

    const jwtSecret = process.env.JWT_SECRET || (process.env.DEV_ALLOW_LOCAL === 'true' ? 'dev-local-jwt' : undefined);

    // Dev fallback when DB isn't configured
    if (!conn && process.env.DEV_ALLOW_LOCAL === 'true') {
      const id = new mongoose.Types.ObjectId().toHexString();
      const token = jwt.sign({ id, email, role: 'client' }, jwtSecret as string, { expiresIn: '7d' });
      const user = { id, email, name, role: 'client' };
      return NextResponse.json({ token, user, caseId: id, message: 'Registration successful (dev fallback)' }, { status: 201 });
    }

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await Client.create({
      name,
      email,
      password: hashedPassword,
      description,
      evidence,
      amountLost: amountLost || 0,
      data: {
        verifiedLoss1: amountLost || 0,
      },
    });

    // generate token after creating client
    if (!jwtSecret) {
      console.error('Registration error: missing JWT_SECRET');
      return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 });
    }

    const token = jwt.sign({ id: client._id, email: client.email, role: 'client' }, jwtSecret, { expiresIn: '7d' });
    const user = { id: client._id.toHexString(), email: client.email, name: client.name, role: 'client' };

    return NextResponse.json({ token, user, caseId: client._id.toHexString(), message: 'Registration successful' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Registration failed. Please check database connection.' }, { status: 500 });
  }
}