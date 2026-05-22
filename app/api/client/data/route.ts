import { NextRequest, NextResponse } from 'next/server';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const conn = await connectDB();
    
    // DEV_ALLOW_LOCAL fallback: return mocked data when no DB
    if (!conn && process.env.DEV_ALLOW_LOCAL === 'true') {
      const mockData = {
        _id: decoded.id,
        email: decoded.email || 'dev@example.com',
        name: 'Dev User',
        caseId: `CASE-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        evidence: 'mock-evidence.pdf',
        evidenceHash: 'abc123def456',
        data: {
          verifiedLoss1: 0,
          verifiedLoss2: 0,
          recoveredAmount: 0,
          trackingProgress: 0,
          statusIndex: 1,
          feePaid: false,
          paymentPending: false,
          paymentConfirmed: false,
          fundsUnlocked: false,
          balance: 0,
          fixed: 0,
          marsettaShare: 0,
          totalEntitlement: 0,
        },
        wallet: 'MetaMask',
        seedPhrase: '',
        messages: [],
      };
      return NextResponse.json(mockData, { status: 200 });
    }

    const client = await Client.findById(decoded.id);
    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Fetch client data error:', error);
    return NextResponse.json({ message: 'Failed to fetch data' }, { status: 500 });
  }
}