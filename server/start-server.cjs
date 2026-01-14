const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { MongoClient } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');
const { setupWSConnection } = require('y-websocket/bin/utils');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Log environment variables for debugging
console.log('Environment variables loaded from:', envPath);
console.log('MONGODB_URL:', process.env.MONGODB_URL ? '***MongoDB URL is set***' : 'MongoDB URL is not set');

const PORT = process.env.PORT || 3001;
const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error('❌ Error: MONGODB_URL is not set in .env file');
  process.exit(1);
}

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
function logInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function logError(message) {
  console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// Show server banner
function showBanner() {
  console.clear();
  console.log(`${colors.cyan}${'='.repeat(60)}`);
  console.log(`${colors.bright}  Real-time Collaboration Server`.padEnd(58) + colors.reset);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  logInfo(`Starting server with configuration:`);
  logInfo(`- PORT: ${colors.bright}${PORT}${colors.reset}`);
  logInfo(`- MongoDB: ${colors.bright}${MONGODB_URL}${colors.reset}\n`);
}

// Create HTTP server
const server = createServer((req, res) => {
  logInfo(`HTTP ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Collaboration server is running');
});

// Handle server errors
server.on('error', (error) => {
  logError(`Server error: ${error.message}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server, clientTracking: true });
wss.on('error', (error) => {
  logError(`WebSocket error: ${error.message}`);
});

// MongoDB connection
const mongoClient = new MongoClient(MONGODB_URL);

// Terminal interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${colors.green}server> ${colors.reset}`
});

// Terminal commands
const commands = {
  help: () => {
    console.log(`
${colors.cyan}Available commands:${colors.reset}
  help     - Show this help
  status   - Show server status
  clients  - List connected WebSocket clients
  restart  - Restart the server (not implemented)
  exit     - Shut down the server
    `);
  },
  status: () => {
    console.log(`
${colors.cyan}Server Status:${colors.reset}
  - Port: ${colors.bright}${PORT}${colors.reset}
  - MongoDB: ${mongoClient.topology ? `${colors.green}Connected${colors.reset}` : `${colors.red}Disconnected${colors.reset}`}
  - WebSocket connections: ${colors.bright}${wss.clients.size}${colors.reset}
    `);
  },
  clients: () => {
    console.log(`\n${colors.cyan}Connected WebSocket Clients:${colors.reset}`);
    if (wss.clients.size === 0) {
      console.log('  No active connections');
    } else {
      Array.from(wss.clients).forEach((client, i) => {
        console.log(`  ${i + 1}. ${client._socket.remoteAddress || 'Unknown IP'}`);
      });
    }
  },
  exit: async () => {
    logInfo('Shutting down server...');
    await mongoClient.close();
    server.close(() => {
      logSuccess('Server has been shut down');
      process.exit(0);
    });
  }
};

// Handle terminal input
rl.on('line', (line) => {
  const [cmd, ...args] = line.trim().split(' ');
  if (commands[cmd]) {
    commands[cmd](...args);
  } else if (cmd) {
    logError(`Unknown command: ${cmd}. Type 'help' for available commands.`);
  }
  rl.prompt();
}).on('close', () => {
  logInfo('Exiting server...');
  process.exit(0);
});

async function startServer() {
  try {
    showBanner();

    // Connect to MongoDB
    logInfo('Connecting to MongoDB...');
    await mongoClient.connect();
    logSuccess('Connected to MongoDB');

    // Start the HTTP server
    server.listen(PORT, '0.0.0.0', () => {
      logSuccess(`Server is running on ${colors.bright}http://localhost:${PORT}${colors.reset}`);
      logInfo(`Press ${colors.bright}Ctrl+C${colors.reset} or type ${colors.bright}exit${colors.reset} to stop the server\n`);
      rl.prompt();
    });

    // Handle WebSocket connections
    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      const url = new URL(req.url, `http://${req.headers.host}`);
      const roomId = url.pathname.slice(1).split('?')[0]; // y-websocket passes room as pathname
      const password = url.searchParams.get('password');

      logInfo(`Connection attempt from ${clientIp} for room: ${roomId}`);

      // Basic room/password validation (could be expanded)
      // For now, if a password is provided in .env for a room, we check it
      const expectedPassword = process.env[`ROOM_PWD_${roomId}`] || process.env.DEFAULT_ROOM_PASSWORD;

      if (expectedPassword && password !== expectedPassword) {
        logWarning(`Authentication failed for ${clientIp} on room ${roomId}`);
        ws.close(4001, 'Invalid room password');
        return;
      }

      logSuccess(`New WebSocket connection from ${colors.bright}${clientIp}${colors.reset} authorized for room: ${roomId}`);

      ws.on('error', (error) => {
        logError(`WebSocket error from ${clientIp}: ${error.message}`);
      });

      ws.on('close', () => {
        logInfo(`Client disconnected: ${clientIp}`);
      });

      setupWSConnection(ws, req, { gc: true });
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
      console.log(''); // New line after ^C
      commands.exit();
    });

  } catch (error) {
    logError(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer();
