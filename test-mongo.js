const mongoose = require('mongoose');
const fs = require('fs');

let uri = process.env.MONGODB_URI;
if (!uri) {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const line = env.split('\n').find(l => l.startsWith('MONGODB_URI='));
    uri = line && line.split('=')[1];
  } catch (e) {
    console.error('Could not read .env:', e.message);
  }
}

if (!uri) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}

console.log('Testing Mongo connection to:', uri);

mongoose.connect(uri, { maxPoolSize: 5 })
  .then(() => {
    console.log('Mongo connected successfully');
    return mongoose.connection.close().then(() => process.exit(0));
  })
  .catch(err => {
    console.error('Mongo connection error:');
    console.error(err);
    process.exit(1);
  });
