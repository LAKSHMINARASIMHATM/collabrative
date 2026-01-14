import { MongoClient, Db, Collection, Document } from 'mongodb';

interface Snapshot extends Document {
    documentId: string;
    data: any;
    version: number;
    createdAt: Date;
    description?: string;
}

export class SnapshotManager {
    private collection!: Collection<Snapshot>;
    private client: MongoClient;
    private db: Db | null = null;

    constructor(uri: string) {
        this.client = new MongoClient(uri);
    }

    async connect() {
        await this.client.connect();
        this.db = this.client.db();
        this.collection = this.db.collection<Snapshot>('snapshots');
        
        // Create indexes if they don't exist
        await this.collection.createIndex({ documentId: 1, version: -1 });
        await this.collection.createIndex({ documentId: 1, createdAt: -1 });
    }

    async createSnapshot(documentId: string, data: any, description?: string): Promise<Snapshot> {
        // Get the latest version for this document
        const latest = await this.collection.findOne(
            { documentId },
            { sort: { version: -1 } }
        );
        
        const version = latest ? latest.version + 1 : 1;
        
        const snapshot: Snapshot = {
            documentId,
            data,
            version,
            createdAt: new Date(),
            description
        };

        await this.collection.insertOne(snapshot);
        return snapshot;
    }

    async getLatestSnapshot(documentId: string): Promise<Snapshot | null> {
        return this.collection.findOne(
            { documentId },
            { sort: { version: -1 } }
        );
    }

    async getSnapshotByVersion(documentId: string, version: number): Promise<Snapshot | null> {
        return this.collection.findOne({ documentId, version });
    }

    async listSnapshots(documentId: string, limit: number = 10): Promise<Snapshot[]> {
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
