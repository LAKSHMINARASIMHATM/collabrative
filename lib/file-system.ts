/**
 * File System Manager using File System Access API
 * Enables reading/writing local files in supported browsers (Chrome, Edge)
 */

export interface FileNode {
    id: string
    name: string
    type: "file" | "folder"
    path: string
    handle?: FileSystemHandle
    children?: FileNode[]
    content?: string
    language?: string
}

// File System Access API types (for browsers that support it)
declare global {
    interface Window {
        showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>
    }
}

interface DirectoryPickerOptions {
    mode?: 'read' | 'readwrite'
}

interface FileSystemDirectoryHandle {
    name: string
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    kind: 'directory'
}

interface FileSystemFileHandle {
    name: string
    getFile(): Promise<File>
    createWritable(): Promise<FileSystemWritableFileStream>
    kind: 'file'
}

interface FileSystemWritableFileStream {
    write(content: string | ArrayBuffer | Blob): Promise<void>
    close(): Promise<void>
}

interface FileSystemHandle {
    name: string
    kind: 'file' | 'directory'
}

export class FileSystemManager {
    private rootHandle: FileSystemDirectoryHandle | null = null
    private fileHandles: Map<string, FileSystemFileHandle> = new Map()
    private dirHandles: Map<string, FileSystemDirectoryHandle> = new Map()

    /**
     * Check if File System Access API is supported
     */
    static isSupported(): boolean {
        return "showDirectoryPicker" in window
    }

    /**
     * Open a local directory and scan its contents
     */
    async openDirectory(): Promise<FileNode | null> {
        try {
            // Check if File System Access API is available
            if (!window.showDirectoryPicker) {
                throw new Error("File System Access API is not supported in this browser. Please use a modern browser like Chrome, Edge, or Opera.")
            }

            // Request directory access from user
            this.rootHandle = await window.showDirectoryPicker({
                mode: "readwrite",
            })

            // Scan and return directory structure
            return await this.scanDirectory(this.rootHandle, "")
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                // User cancelled
                return null
            }
            throw error
        }
    }

    /**
     * Recursively scan directory structure
     */
    private async scanDirectory(
        dirHandle: FileSystemDirectoryHandle,
        currentPath: string,
    ): Promise<FileNode> {
        const path = currentPath ? `${currentPath}/${dirHandle.name}` : dirHandle.name
        this.dirHandles.set(path, dirHandle)

        const children: FileNode[] = []

        for await (const [name, handle] of dirHandle.entries()) {
            // Skip hidden files and node_modules
            if (name.startsWith(".") || name === "node_modules") {
                continue
            }

            const itemPath = `${path}/${name}`

            if (handle.kind === "file") {
                this.fileHandles.set(itemPath, handle as FileSystemFileHandle)
                children.push({
                    id: itemPath,
                    name,
                    type: "file",
                    path: itemPath,
                    handle,
                    language: this.getLanguageFromFilename(name),
                })
            } else {
                // Recursively scan subdirectory
                const subDir = await this.scanDirectory(handle as FileSystemDirectoryHandle, path)
                children.push(subDir)
            }
        }

        return {
            id: path,
            name: dirHandle.name,
            type: "folder",
            path,
            handle: dirHandle,
            children: children.sort((a, b) => {
                // Sort: folders first, then alphabetically
                if (a.type !== b.type) {
                    return a.type === "folder" ? -1 : 1
                }
                return a.name.localeCompare(b.name)
            }),
        }
    }

    /**
     * Read file contents
     */
    async readFile(path: string): Promise<string> {
        const handle = this.fileHandles.get(path)
        if (!handle) {
            throw new Error(`File not found: ${path}`)
        }

        const file = await handle.getFile()
        return await file.text()
    }

    /**
     * Write file contents
     */
    async writeFile(path: string, content: string): Promise<void> {
        const handle = this.fileHandles.get(path)
        if (!handle) {
            throw new Error(`File not found: ${path}`)
        }

        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()
    }

    /**
     * Create a new file
     */
    async createFile(dirPath: string, filename: string, content: string = ""): Promise<FileNode> {
        const dirHandle = this.dirHandles.get(dirPath)
        if (!dirHandle) {
            throw new Error(`Directory not found: ${dirPath}`)
        }

        const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
        const filePath = `${dirPath}/${filename}`
        this.fileHandles.set(filePath, fileHandle)

        // Write initial content
        const writable = await fileHandle.createWritable()
        await writable.write(content)
        await writable.close()

        return {
            id: filePath,
            name: filename,
            type: "file",
            path: filePath,
            handle: fileHandle,
            content,
            language: this.getLanguageFromFilename(filename),
        }
    }

    /**
     * Create a new directory
     */
    async createDirectory(parentPath: string, dirname: string): Promise<FileNode> {
        const parentHandle = this.dirHandles.get(parentPath)
        if (!parentHandle) {
            throw new Error(`Directory not found: ${parentPath}`)
        }

        const dirHandle = await parentHandle.getDirectoryHandle(dirname, { create: true })
        const dirPath = `${parentPath}/${dirname}`
        this.dirHandles.set(dirPath, dirHandle)

        return {
            id: dirPath,
            name: dirname,
            type: "folder",
            path: dirPath,
            handle: dirHandle,
            children: [],
        }
    }

    /**
     * Delete a file or directory
     */
    async delete(path: string): Promise<void> {
        const parentPath = path.substring(0, path.lastIndexOf("/"))
        const name = path.substring(path.lastIndexOf("/") + 1)
        const parentHandle = this.dirHandles.get(parentPath)

        if (!parentHandle) {
            throw new Error(`Parent directory not found: ${parentPath}`)
        }

        await parentHandle.removeEntry(name, { recursive: true })

        // Clean up handles
        this.fileHandles.delete(path)
        this.dirHandles.delete(path)
    }

    /**
     * Rename a file or directory
     */
    async rename(oldPath: string, newName: string): Promise<string> {
        // File System Access API doesn't support rename directly
        // We need to create new file/dir and copy contents
        const parentPath = oldPath.substring(0, oldPath.lastIndexOf("/"))
        const handle = this.fileHandles.get(oldPath) || this.dirHandles.get(oldPath)

        if (!handle) {
            throw new Error(`File/directory not found: ${oldPath}`)
        }

        const newPath = `${parentPath}/${newName}`

        if (handle.kind === "file") {
            const content = await this.readFile(oldPath)
            await this.createFile(parentPath, newName, content)
            await this.delete(oldPath)
        } else {
            // Directory rename is more complex - would need to recursively copy
            throw new Error("Directory rename not yet implemented")
        }

        return newPath
    }

    /**
     * Get language from filename extension
     */
    private getLanguageFromFilename(filename: string): string {
        const ext = filename.split(".").pop()?.toLowerCase()
        const languageMap: Record<string, string> = {
            ts: "typescript",
            tsx: "typescript",
            js: "javascript",
            jsx: "javascript",
            json: "json",
            html: "html",
            css: "css",
            scss: "scss",
            sass: "sass",
            less: "less",
            md: "markdown",
            py: "python",
            java: "java",
            cpp: "cpp",
            c: "c",
            cs: "csharp",
            go: "go",
            rs: "rust",
            rb: "ruby",
            php: "php",
            sql: "sql",
            sh: "shell",
            xml: "xml",
            yaml: "yaml",
            yml: "yaml",
        }
        return languageMap[ext || ""] || "plaintext"
    }

    /**
     * Get root directory handle
     */
    getRootHandle(): FileSystemDirectoryHandle | null {
        return this.rootHandle
    }

    /**
     * Check if a directory is currently open
     */
    isDirectoryOpen(): boolean {
        return this.rootHandle !== null
    }
}

export default FileSystemManager
