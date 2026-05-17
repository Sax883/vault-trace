import { NextRequest, NextResponse } from 'next/server';
import Client from '@/lib/models/Client';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(
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
    const client = await Client.findById(id).select('-password');
    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Fetch client data error:', error);
    return NextResponse.json({ message: 'Failed to fetch client data' }, { status: 500 });
  }
}

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
    const updates = await request.json();

    const client = await Client.findByIdAndUpdate(id, updates, { returnDocument: 'after' }).select('-password');
    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error('Update client data error:', error);
    return NextResponse.json({ message: 'Failed to update client data' }, { status: 500 });
  }
}

export async function DELETE(
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
    await Client.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Client deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
  }
}
