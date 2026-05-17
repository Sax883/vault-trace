import { NextRequest, NextResponse } from 'next/server';
import Message from '@/lib/models/Message';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const { reply } = await request.json();

    const message = await Message.findByIdAndUpdate(
      id,
      { adminReply: reply, adminReplyTime: new Date() },
      { new: true }
    );

    if (!message) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message, { status: 200 });
  } catch (error) {
    console.error('Reply to message error:', error);
    return NextResponse.json({ message: 'Failed to send reply' }, { status: 500 });
  }
}
