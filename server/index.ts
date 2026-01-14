import { WebSocketServer, WebSocket } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection, getYDoc } from 'y-websocket/bin/utils.js';
import { connectRedis, publishUpdate, subscribeToUpdates } from './redis.js';
import { SnapshotManager } from './snapshot.js';
import { MongoClient } from 'mongodb';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001');
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/collab-editor';

const wss = new WebSocketServer({ port: PORT });

// In-memory storage for documents
const docs = new Map<string, Y.Doc>();

// MongoDB Client
const mongoClient = new MongoClient(MONGODB_URL);
let db: any;
let docsCollection: any;

// Initialize Snapshot Manager
const snapshotManager = new SnapshotManager(MONGODB_URL);

// Basic HTTP server for snapshots and health check
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const documentId = url.searchParams.get('documentId') || 'default-room';

    try {
        // Create snapshot
        if (req.method === 'POST' && url.pathname === '/snapshot') {
            const doc = docs.get(documentId);
            if (!doc) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Document not found' }));
                return;
            }

            const chunks: Buffer[] = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const body = Buffer.concat(chunks).toString();
            const { description } = body ? JSON.parse(body) : {};

            const snapshot = await snapshotManager.createSnapshot(
                documentId,
                Y.encodeStateAsUpdateV2(doc),
                description
            );

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(snapshot));
            return;
        }

        // Get latest snapshot
        if (req.method === 'GET' && url.pathname === '/snapshot/latest') {
            const snapshot = await snapshotManager.getLatestSnapshot(documentId);
            if (!snapshot) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'No snapshots found' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(snapshot));
            return;
        }

        // List snapshots
        if (req.method === 'GET' && url.pathname === '/snapshots') {
            const limit = parseInt(url.searchParams.get('limit') || '10');
            const snapshots = await snapshotManager.listSnapshots(documentId, limit);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(snapshots));
            return;
        }

        // Default response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            endpoints: [
                'POST /snapshot - Create a new snapshot',
                'GET /snapshot/latest - Get latest snapshot',
                'GET /snapshots?limit=10 - List recent snapshots'
            ]
        }));
    } catch (error) {
        console.error('Error handling request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
});

// Initialize MongoDB connection and start the server
async function initialize() {
    try {
        await mongoClient.connect();
        db = mongoClient.db();
        docsCollection = db.collection('documents');

        // Initialize Snapshot Manager
        await snapshotManager.connect();

        // Start HTTP server
        server.listen(3002, () => {
            console.log(`HTTP server running on port 3002`);
        });

        // Connect to Redis
        await connectRedis();

    } catch (error) {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    }
}

initialize();

// Save document to MongoDB
async function saveDocument(docName: string, doc: Y.Doc) {
    const state = Y.encodeStateAsUpdateV2(doc);
    await docsCollection.updateOne(
        { _id: docName },
        {
            $set: {
                state: Buffer.from(state).toString('base64'),
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );
}

// Load document from MongoDB
async function loadDocument(docName: string): Promise<Y.Doc> {
    const doc = getYDoc(docName, true);
    if (!docs.has(docName)) {
        const docData = await docsCollection.findOne({ _id: docName });
        if (docData && docData.state) {
            Y.applyUpdate(doc, Buffer.from(docData.state, 'base64'));
        }

        doc.on('update', async (update: Uint8Array) => {
            await saveDocument(docName, doc);
            publishUpdate(docName, update);
        });
        docs.set(docName, doc);
    }
    return doc;
}

// Redis Subscription for horizontal scaling
subscribeToUpdates(async (documentId, update) => {
    let doc = docs.get(documentId);
    if (!doc) {
        doc = await loadDocument(documentId);
    }
    Y.applyUpdate(doc, update);
});

console.log(`WebSocket server running on port ${PORT}`);

wss.on('connection', async (ws: WebSocket, req: any) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const docName = url.searchParams.get('doc') || 'default-room';

    console.log(`New connection to document: ${docName}`);

    // Pre-load the document to ensure it's in the Map and synced with DB/Redis
    await loadDocument(docName);

    setupWSConnection(ws, req, { docName, gc: true });
});
