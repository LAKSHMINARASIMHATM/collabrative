/**
 * Advanced Sync Manager
 * 
 * Handles conflict resolution, version history, and document checkpoints
 * for collaborative editing with Yjs.
 */

import * as Y from 'yjs'

export interface DocumentVersion {
    id: string
    timestamp: Date
    state: Uint8Array
    description?: string
    userId?: string
    userName?: string
}

export interface Conflict {
    id: string
    timestamp: Date
    localChange: any
    remoteChange: any
    resolution?: 'local' | 'remote' | 'manual'
}

export type ConflictStrategy = 'local-wins' | 'remote-wins' | 'last-write-wins' | 'manual'

export class SyncManager {
    private doc: Y.Doc
    private versions: DocumentVersion[] = []
    private conflicts: Conflict[] = []
    private maxVersions = 50
    private checkpointInterval = 5 * 60 * 1000 // 5 minutes
    private checkpointTimer: NodeJS.Timeout | null = null
    private conflictStrategy: ConflictStrategy = 'last-write-wins'

    private onConflictCallback?: (conflict: Conflict) => void
    private onVersionSaved?: (version: DocumentVersion) => void

    constructor(doc: Y.Doc, strategy: ConflictStrategy = 'last-write-wins') {
        this.doc = doc
        this.conflictStrategy = strategy
        this.setupAutomaticCheckpoints()
    }

    /**
     * Setup automatic checkpoints
     */
    private setupAutomaticCheckpoints(): void {
        this.checkpointTimer = setInterval(() => {
            this.createCheckpoint('Auto-save checkpoint')
        }, this.checkpointInterval)
    }

    /**
     * Create a document checkpoint
     */
    createCheckpoint(description?: string, userId?: string, userName?: string): DocumentVersion {
        const state = Y.encodeStateAsUpdate(this.doc)

        const version: DocumentVersion = {
            id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            state,
            description,
            userId,
            userName,
        }

        this.versions.push(version)

        // Keep only recent versions
        if (this.versions.length > this.maxVersions) {
            this.versions.shift()
        }

        this.onVersionSaved?.(version)
        return version
    }

    /**
     * Restore document to a specific version
     */
    async restoreVersion(versionId: string): Promise<boolean> {
        const version = this.versions.find(v => v.id === versionId)
        if (!version) {
            console.error('Version not found:', versionId)
            return false
        }

        try {
            // Create checkpoint before restore (safety)
            this.createCheckpoint('Before version restore')

            // Apply the version state
            Y.applyUpdate(this.doc, version.state)
            return true
        } catch (error) {
            console.error('Failed to restore version:', error)
            return false
        }
    }

    /**
     * Get all versions
     */
    getVersions(): DocumentVersion[] {
        return [...this.versions].reverse() // Newest first
    }

    /**
     * Get version by ID
     */
    getVersion(versionId: string): DocumentVersion | undefined {
        return this.versions.find(v => v.id === versionId)
    }

    /**
     * Delete a version
     */
    deleteVersion(versionId: string): boolean {
        const index = this.versions.findIndex(v => v.id === versionId)
        if (index === -1) return false

        this.versions.splice(index, 1)
        return true
    }

    /**
     * Detect and handle conflicts
     */
    detectConflict(localChange: any, remoteChange: any): Conflict | null {
        // Simple conflict detection - overlapping changes
        const hasConflict = this.checkOverlap(localChange, remoteChange)

        if (!hasConflict) return null

        const conflict: Conflict = {
            id: `c_${Date.now()}`,
            timestamp: new Date(),
            localChange,
            remoteChange,
        }

        this.conflicts.push(conflict)
        this.onConflictCallback?.(conflict)

        // Auto-resolve based on strategy
        this.resolveConflict(conflict.id, this.getAutoResolution())

        return conflict
    }

    /**
     * Check if changes overlap
     */
    private checkOverlap(change1: any, change2: any): boolean {
        // Simplified overlap check
        // In production, use proper operational transformation logic
        return change1.position === change2.position
    }

    /**
     * Get auto-resolution strategy
     */
    private getAutoResolution(): 'local' | 'remote' {
        switch (this.conflictStrategy) {
            case 'local-wins':
                return 'local'
            case 'remote-wins':
                return 'remote'
            case 'last-write-wins':
            default:
                return 'remote' // Last write (remote) wins
        }
    }

    /**
     * Resolve a conflict
     */
    resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'manual'): void {
        const conflict = this.conflicts.find(c => c.id === conflictId)
        if (!conflict) return

        conflict.resolution = resolution

        if (resolution === 'local') {
            // Keep local change, discard remote
            // In Yjs, this happens automatically with proper ordering
        } else if (resolution === 'remote') {
            // Accept remote change
            // This is the default behavior
        }
        // 'manual' means user will handle it
    }

    /**
     * Get all conflicts
     */
    getConflicts(): Conflict[] {
        return [...this.conflicts]
    }

    /**
     * Get unresolved conflicts
     */
    getUnresolvedConflicts(): Conflict[] {
        return this.conflicts.filter(c => !c.resolution)
    }

    /**
     * Clear resolved conflicts
     */
    clearResolvedConflicts(): void {
        this.conflicts = this.conflicts.filter(c => !c.resolution)
    }

    /**
     * Set conflict strategy
     */
    setConflictStrategy(strategy: ConflictStrategy): void {
        this.conflictStrategy = strategy
    }

    /**
     * Listen for conflicts
     */
    onConflict(callback: (conflict: Conflict) => void): void {
        this.onConflictCallback = callback
    }

    /**
     * Listen for version saves
     */
    onVersion(callback: (version: DocumentVersion) => void): void {
        this.onVersionSaved = callback
    }

    /**
     * Export version history
     */
    exportHistory(): string {
        return JSON.stringify({
            versions: this.versions.map(v => ({
                ...v,
                state: Array.from(v.state),
                timestamp: v.timestamp.toISOString(),
            })),
            conflicts: this.conflicts.map(c => ({
                ...c,
                timestamp: c.timestamp.toISOString(),
            })),
        }, null, 2)
    }

    /**
     * Import version history
     */
    importHistory(json: string): boolean {
        try {
            const data = JSON.parse(json)

            this.versions = data.versions.map((v: any) => ({
                ...v,
                state: new Uint8Array(v.state),
                timestamp: new Date(v.timestamp),
            }))

            this.conflicts = data.conflicts.map((c: any) => ({
                ...c,
                timestamp: new Date(c.timestamp),
            }))

            return true
        } catch (error) {
            console.error('Failed to import history:', error)
            return false
        }
    }

    /**
     * Custom undo/redo with collaboration support
     */
    private undoStack: Uint8Array[] = []
    private redoStack: Uint8Array[] = []

    /**
     * Undo last change
     */
    undo(): boolean {
        if (this.undoStack.length === 0) return false

        const current = Y.encodeStateAsUpdate(this.doc)
        const previous = this.undoStack.pop()!

        this.redoStack.push(current)
        Y.applyUpdate(this.doc, previous)

        return true
    }

    /**
     * Redo last undone change
     */
    redo(): boolean {
        if (this.redoStack.length === 0) return false

        const current = Y.encodeStateAsUpdate(this.doc)
        const next = this.redoStack.pop()!

        this.undoStack.push(current)
        Y.applyUpdate(this.doc, next)

        return true
    }

    /**
     * Push current state to undo stack
     */
    pushUndoState(): void {
        const state = Y.encodeStateAsUpdate(this.doc)
        this.undoStack.push(state)
        this.redoStack = [] // Clear redo stack on new change
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.checkpointTimer) {
            clearInterval(this.checkpointTimer)
            this.checkpointTimer = null
        }
        this.versions = []
        this.conflicts = []
        this.undoStack = []
        this.redoStack = []
    }
}

export default SyncManager
