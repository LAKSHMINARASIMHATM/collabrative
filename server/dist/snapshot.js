import { MongoClient } from 'mongodb';
export class SnapshotManager {
    constructor(uri) {
        this.db = null;
        this.client = new MongoClient(uri);
    }
    async connect() {
        await this.client.connect();
        this.db = this.client.db();
        this.collection = this.db.collection('snapshots');
        // Create indexes if they don't exist
        await this.collection.createIndex({ documentId: 1, version: -1 });
        await this.collection.createIndex({ documentId: 1, createdAt: -1 });
    }
    async createSnapshot(documentId, data, description) {
        // Get the latest version for this document
        const latest = await this.collection.findOne({ documentId }, { sort: { version: -1 } });
        const version = latest ? latest.version + 1 : 1;
        const snapshot = {
            documentId,
            data,
            version,
            createdAt: new Date(),
            description
        };
        await this.collection.insertOne(snapshot);
        return snapshot;
    }
    async getLatestSnapshot(documentId) {
        return this.collection.findOne({ documentId }, { sort: { version: -1 } });
    }
    async getSnapshotByVersion(documentId, version) {
        return this.collection.findOne({ documentId, version });
    }
    async listSnapshots(documentId, limit = 10) {
        return this.collection
            .find({ documentId })
            .sort({ version: -1 })
            .limit(limit)
            .toArray();
    }
    async close() {
        await this.client.close();
    }
}
export default SnapshotManager;
