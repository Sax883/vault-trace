import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import Client from '@/lib/models/Client';

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const conn = await connectDB();
    if (!conn && process.env.DEV_ALLOW_LOCAL === 'true') {
      // Return mock evidence list (point to public/uploads for local dev)
      return NextResponse.json([
        { id: 'e1', name: 'mock-evidence.pdf', sha256: 'abc123def456', url: `/uploads/${encodeURIComponent('mock-evidence.pdf')}` },
      ], { status: 200 });
    }

    // Real DB path
    const client = await Client.findById(decoded.id).select('evidence evidenceHash');
    if (!client) return NextResponse.json([], { status: 200 });

    const list = [];
    if (client.evidence) {
      list.push({ id: 'evidence-1', name: client.evidence, sha256: client.evidenceHash || '', url: `/uploads/${encodeURIComponent(client.evidence)}` });
    }

    return NextResponse.json(list, { status: 200 });
  } catch (error) {
    console.error('Fetch evidence error:', error);
    return NextResponse.json({ message: 'Failed to fetch evidence' }, { status: 500 });
  }
}
