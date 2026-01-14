import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils.js';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 3001;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/collab-editor';

// Create HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Collaboration server is running');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// MongoDB connection
const mongoClient = new MongoClient(MONGODB_URL);

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    console.log('Connected to MongoDB');

    // Start the HTTP server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Handle WebSocket connections
    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection');
      setupWSConnection(ws, req, { gc: true });
    });

    // Handle server shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      await mongoClient.close();
      server.close(() => {
        console.log('Server has been shut down');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
