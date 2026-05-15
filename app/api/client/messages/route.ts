import { NextRequest, NextResponse } from 'next/server';
import Message from '@/lib/models/Message';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const messages = await Message.find({ clientId: decoded.id }).sort({ timestamp: 1 });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { content } = await request.json();

    const message = await Message.create({
      clientId: decoded.id,
      sender: 'client',
      content,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}