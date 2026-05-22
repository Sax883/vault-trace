import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    const conn = await connectDB();

    // If connectDB returns null (dev fallback), reflect that to the client
    if (!conn) {
      const devFallback = process.env.DEV_ALLOW_LOCAL === 'true';
      return NextResponse.json({ ok: true, connected: false, devFallback }, { status: 200 });
    }

    const ready = mongoose.connection.readyState === 1;
    return NextResponse.json({ ok: true, connected: ready }, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ ok: false, connected: false, error: String(error) }, { status: 500 });
  }
}
