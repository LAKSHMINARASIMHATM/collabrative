import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { setupWSConnection } = require('y-websocket/bin/utils.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 3001;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/collab-editor';

console.log('Starting server with configuration:');
console.log(`- PORT: ${PORT}`);
console.log(`- MONGODB_URL: ${MONGODB_URL}`);

// Create HTTP server
const server = createServer((req, res) => {
  console.log(`HTTP Request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Collaboration server is running');
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// MongoDB connection
const mongoClient = new MongoClient(MONGODB_URL);

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB');

    // Start the HTTP server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

    // Handle WebSocket connections
    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`New WebSocket connection from ${clientIp}`);
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      setupWSConnection(ws, req, { gc: true });
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down server...');
      await mongoClient.close();
      server.close(() => {
        console.log('✅ Server has been shut down');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
