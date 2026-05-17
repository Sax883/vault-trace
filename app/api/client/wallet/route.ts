import { NextRequest, NextResponse } from 'next/server';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'client') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { wallet, seedPhrase } = await request.json();
    if (!wallet && !seedPhrase) {
      return NextResponse.json({ message: 'Wallet or seed phrase required' }, { status: 400 });
    }

    await connectDB();
    const updates: Record<string, string> = {};
    if (wallet) updates.wallet = wallet;
    if (seedPhrase) updates.seedPhrase = seedPhrase;

    const client = await Client.findByIdAndUpdate(decoded.id, updates, { returnDocument: 'after' }).select('-password');
    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Update wallet data error:', error);
    return NextResponse.json({ message: 'Failed to update wallet data' }, { status: 500 });
  }
}
