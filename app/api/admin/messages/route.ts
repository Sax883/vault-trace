import { NextRequest, NextResponse } from 'next/server';
import Message from '@/lib/models/Message';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

const formatMessage = (msg: any) => ({
  ...msg.toJSON(),
  from: msg.from || msg.sender || '',
  message: msg.message || msg.content || '',
  time: msg.time || msg.timestamp?.toISOString?.() || msg.createdAt?.toISOString?.() || '',
});

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ message: 'Client ID required' }, { status: 400 });
    }

    await connectDB();
    const messages = await Message.find({ clientId }).sort({ timestamp: 1 });

    return NextResponse.json(messages.map(formatMessage), { status: 200 });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { clientId, content } = await request.json();

    const message = await Message.create({
      clientId,
      sender: 'admin',
      content,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}