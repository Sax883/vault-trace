import { NextRequest, NextResponse } from 'next/server';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, description, evidence, amountLost } = await request.json();

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Client.create({
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

    return NextResponse.json({ message: 'Registration successful' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}