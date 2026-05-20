import dns from 'dns';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Only throw if we're not in DEV_ALLOW_LOCAL mode
if (!MONGODB_URI && process.env.DEV_ALLOW_LOCAL !== 'true') {
  // In dev, log a warning but don't throw - DB errors will occur at runtime instead
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[mongodb.ts] MONGODB_URI not set. Running in local dev mode will fail DB operations.');
  } else {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function buildMongoUri(uri: string) {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  const url = new URL(uri);
  const srvHost = url.hostname;
  const resolver = new dns.Resolver();
  resolver.setServers(['8.8.8.8', '8.8.4.4']);
  const srvRecords = await new Promise<dns.SrvRecord[]>((resolve, reject) => {
    resolver.resolveSrv(`_mongodb._tcp.${srvHost}`, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });
  const hostString = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');

  const auth = url.username ? `${encodeURIComponent(url.username)}:${encodeURIComponent(url.password)}@` : '';
  const dbName = url.pathname || '';
  const params = new URLSearchParams(url.search);

  if (!params.has('tls') && !params.has('ssl')) {
    params.set('tls', 'true');
  }

  return `mongodb://${auth}${hostString}${dbName}?${params.toString()}`;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // If running in DEV_ALLOW_LOCAL mode and no MONGODB_URI is present, return a resolved null
    if (!MONGODB_URI && process.env.DEV_ALLOW_LOCAL === 'true') {
      cached.promise = Promise.resolve(null);
    } else {
      const opts = { bufferCommands: false };
      cached.promise = buildMongoUri(MONGODB_URI).then((uri) =>
        mongoose.connect(uri, opts).then((mongoose) => mongoose)
      );
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
