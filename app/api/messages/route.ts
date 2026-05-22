import { NextRequest, NextResponse } from 'next/server';
import Message from '@/lib/models/Message';
import Client from '@/lib/models/Client';
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
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientEmail = url.searchParams.get('clientEmail');

    const conn = await connectDB();
    
    // DEV_ALLOW_LOCAL fallback: return mocked messages when no DB
    if (!conn && process.env.DEV_ALLOW_LOCAL === 'true') {
      const mockMessages = [
        {
          id: 'msg-1',
          from: 'admin',
          message: 'Your case has been assigned to our neural-AI correlation engine.',
          time: new Date().toISOString(),
          clientEmail: decoded.email || 'dev@example.com',
        },
        {
          id: 'msg-2',
          from: 'admin',
          message: 'Please provide additional documentation to proceed with verification.',
          time: new Date().toISOString(),
          clientEmail: decoded.email || 'dev@example.com',
        },
      ];
      return NextResponse.json(mockMessages, { status: 200 });
    }

    let messages;
    if (clientEmail) {
      // Admin fetching messages for a specific client by email
      const client = await Client.findOne({ email: clientEmail });
      if (!client) {
        return NextResponse.json({ message: 'Client not found' }, { status: 404 });
      }
      messages = await Message.find({ clientId: client._id }).sort({ timestamp: 1 });
    } else {
      // Client fetching their own messages
      messages = await Message.find({ clientId: decoded.id }).sort({ timestamp: 1 });
    }

    return NextResponse.json(messages.map(formatMessage), { status: 200 });
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
    const { message } = await request.json();

    const newMessage = await Message.create({
      clientId: decoded.id,
      sender: decoded.role === 'admin' ? 'admin' : 'client',
      content: message,
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ message: 'Failed to send message' }, { status: 500 });
  }
}
