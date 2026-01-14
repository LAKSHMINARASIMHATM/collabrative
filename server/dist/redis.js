import { createClient } from 'redis';
// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// Create publisher and subscriber clients
export const pub = createClient({ url: REDIS_URL });
export const sub = createClient({ url: REDIS_URL });
pub.on('error', (err) => console.error('Redis Pub Client Error', err));
sub.on('error', (err) => console.error('Redis Sub Client Error', err));
export async function connectRedis() {
    if (!pub.isOpen)
        await pub.connect();
    if (!sub.isOpen)
        await sub.connect();
    console.log('Connected to Redis at', REDIS_URL);
}
// Channel for broadcasting document updates
const CHANNELS = {
    DOCUMENT_UPDATE: 'doc:update',
    USER_PRESENCE: 'user:presence',
};
// Publish a document update
export async function publishUpdate(documentId, update) {
    // encoding the Uint8Array to base64 to send over Redis string channel
    const message = JSON.stringify({
        documentId,
        update: Buffer.from(update).toString('base64'),
        timestamp: Date.now(),
    });
    await pub.publish(CHANNELS.DOCUMENT_UPDATE, message);
}
// Subscribe to document updates
export async function subscribeToUpdates(callback) {
    await sub.subscribe(CHANNELS.DOCUMENT_UPDATE, (message) => {
        try {
            const { documentId, update } = JSON.parse(message);
            // Decode base64 back to Uint8Array
            const updateBuffer = new Uint8Array(Buffer.from(update, 'base64'));
            callback(documentId, updateBuffer);
        }
        catch (err) {
            console.error('Failed to parse Redis message', err);
        }
    });
}
