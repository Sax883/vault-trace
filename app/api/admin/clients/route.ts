import { NextRequest, NextResponse } from 'next/server';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const clients = await Client.find({}).select('-password');

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error('Fetch clients error:', error);
    return NextResponse.json({ message: 'Failed to fetch clients' }, { status: 500 });
  }
}