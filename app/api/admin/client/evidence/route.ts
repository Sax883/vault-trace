import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import Client from '@/lib/models/Client';

export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const clientId = body.clientId || body.id;
    const { name, sha256, amount } = body;

    if (!clientId || !name) {
      return NextResponse.json({ message: 'clientId and name are required' }, { status: 400 });
    }

    await connectDB();
    const client = await Client.findById(clientId);
    if (!client) return NextResponse.json({ message: 'Client not found' }, { status: 404 });

    // Update evidence reference
    client.evidence = name;
    client.evidenceHash = sha256 || client.evidenceHash;

    // Update verifiedLoss2 if provided (add to existing)
    if (typeof amount === 'number') {
      client.data.verifiedLoss2 = (client.data.verifiedLoss2 || 0) + amount;
    }

    // Normalize total entitlement
    client.data.totalEntitlement = (client.data.verifiedLoss1 || 0) + (client.data.verifiedLoss2 || 0);

    await client.save();

    return NextResponse.json({ message: 'Evidence attached', data: client }, { status: 200 });
  } catch (error) {
    console.error('Admin attach evidence error:', error);
    return NextResponse.json({ message: 'Failed to attach evidence' }, { status: 500 });
  }
}
