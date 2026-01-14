/**
 * File Watcher using File System Access API
 * Detects external changes to files in the workspace
 */

export type FileChangeType = "modified" | "created" | "deleted"

export interface FileChange {
    path: string
    type: FileChangeType
    timestamp: number
}

export class FileWatcher {
    private handle: FileSystemDirectoryHandle | null = null
    private fileTimestamps = new Map<string, number>()
    private watchInterval: NodeJS.Timeout | null = null
    private callbacks: Array<(changes: FileChange[]) => void> = []
    private isWatching = false

    /**
     * Start watching a directory
     */
    async watch(dirHandle: FileSystemDirectoryHandle, pollInterval = 2000): Promise<void> {
        this.handle = dirHandle
        this.isWatching = true

        // Initial scan to get timestamps
        await this.scanDirectory(dirHandle, "")

        // Poll for changes
        this.watchInterval = setInterval(async () => {
            if (this.isWatching) {
                const changes = await this.checkForChanges()
                if (changes.length > 0) {
                    this.notifyCallbacks(changes)
                }
            }
        }, pollInterval)
    }

    /**
     * Stop watching
     */
    stop(): void {
        this.isWatching = false
        if (this.watchInterval) {
            clearInterval(this.watchInterval)
            this.watchInterval = null
        }
    }

    /**
     * Register a callback for file changes
     */
    onChange(callback: (changes: FileChange[]) => void): () => void {
        this.callbacks.push(callback)

        // Return unsubscribe function
        return () => {
            const index = this.callbacks.indexOf(callback)
            if (index > -1) {
                this.callbacks.splice(index, 1)
            }
        }
    }

    /**
     * Scan directory recursively and record timestamps
     */
    private async scanDirectory(dirHandle: FileSystemDirectoryHandle, currentPath: string): Promise<void> {
        for await (const [name, handle] of dirHandle.entries()) {
            if (name.startsWith(".") || name === "node_modules") {
                continue
            }

            const itemPath = currentPath ? `${currentPath}/${name}` : name

            if (handle.kind === "file") {
                const file = await (handle as FileSystemFileHandle).getFile()
                this.fileTimestamps.set(itemPath, file.lastModified)
            } else {
                await this.scanDirectory(handle as FileSystemDirectoryHandle, itemPath)
            }
        }
    }

    /**
     * Check for changes since last scan
     */
    private async checkForChanges(): Promise<FileChange[]> {
        if (!this.handle) return []

        const changes: FileChange[] = []
        const currentFiles = new Map<string, number>()

        // Scan current state
        await this.scanDirectoryForChanges(this.handle, "", currentFiles, changes)

        // Check for deleted files
        for (const [path, _] of this.fileTimestamps) {
            if (!currentFiles.has(path)) {
                changes.push({
                    path,
                    type: "deleted",
                    timestamp: Date.now(),
                })
            }
        }

        // Update timestamps
        this.fileTimestamps = currentFiles

        return changes
    }

    /**
     * Scan and detect changes
     */
    private async scanDirectoryForChanges(
        dirHandle: FileSystemDirectoryHandle,
        currentPath: string,
        currentFiles: Map<string, number>,
        changes: FileChange[]
    ): Promise<void> {
        for await (const [name, handle] of dirHandle.entries()) {
            if (name.startsWith(".") || name === "node_modules") {
                continue
            }

            const itemPath = currentPath ? `${currentPath}/${name}` : name

            if (handle.kind === "file") {
                const file = await (handle as FileSystemFileHandle).getFile()
                const lastModified = file.lastModified
                currentFiles.set(itemPath, lastModified)

                const previousTimestamp = this.fileTimestamps.get(itemPath)

                if (previousTimestamp === undefined) {
                    // New file
                    changes.push({
                        path: itemPath,
                        type: "created",
                        timestamp: Date.now(),
                    })
                } else if (lastModified > previousTimestamp) {
                    // Modified file
                    changes.push({
                        path: itemPath,
                        type: "modified",
                        timestamp: Date.now(),
                    })
                }
            } else {
                await this.scanDirectoryForChanges(
                    handle as FileSystemDirectoryHandle,
                    itemPath,
                    currentFiles,
                    changes
                )
            }
        }
    }

    /**
     * Notify all callbacks of changes
     */
    private notifyCallbacks(changes: FileChange[]): void {
        this.callbacks.forEach((callback) => {
            try {
                callback(changes)
            } catch (error) {
                console.error("Error in file watcher callback:", error)
            }
        })
    }

    /**
     * Get all watched file paths
     */
    getWatchedFiles(): string[] {
        return Array.from(this.fileTimestamps.keys())
    }

    /**
     * Check if currently watching
     */
    isActive(): boolean {
        return this.isWatching
    }
}

export default FileWatcher
