import dns from 'dns';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
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
    const opts = {
      bufferCommands: false,
    };

    cached.promise = buildMongoUri(MONGODB_URI).then((uri) =>
      mongoose.connect(uri, opts).then((mongoose) => mongoose)
    );
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
