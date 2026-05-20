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

    const url = new URL(request.url);
    const clientId = url.searchParams.get('id');
    if (!clientId) {
      return NextResponse.json({ message: 'Client ID required' }, { status: 400 });
    }

    await connectDB();
    const client = await Client.findById(clientId).select('-password');
    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Fetch client data error:', error);
    return NextResponse.json({ message: 'Failed to fetch client data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('id');
    if (!clientId) {
      return NextResponse.json({ message: 'Client ID required' }, { status: 400 });
    }

    await connectDB();
    const updates = await request.json();

    // If data payload includes verified losses, normalize totalEntitlement
    if (updates.data) {
      const existing = await Client.findById(clientId);
      const merged = { ...(existing?.data || {}), ...updates.data };
      merged.totalEntitlement = (merged.verifiedLoss1 || 0) + (merged.verifiedLoss2 || 0);
      updates.data = merged;
    }

    const client = await Client.findByIdAndUpdate(clientId, updates, { returnDocument: 'after' }).select('-password');
    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Update client data error:', error);
    return NextResponse.json({ message: 'Failed to update client data' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('id');
    if (!clientId) {
      return NextResponse.json({ message: 'Client ID required' }, { status: 400 });
    }

    await connectDB();
    await Client.findByIdAndDelete(clientId);

    return NextResponse.json({ message: 'Client deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
  }
}