import { FileSystemManager, type FileNode as FSFileNode } from "./file-system"
import type { FileNode } from "@/components/ide/ide-workspace"

/**
 * Workspace Manager - handles workspace state and file system integration
 */
export class WorkspaceManager {
    private fileSystem: FileSystemManager
    private workspaceName: string | null = null

    constructor() {
        this.fileSystem = new FileSystemManager()
    }

    /**
     * Check if File System Access is supported
     */
    static isSupported(): boolean {
        return FileSystemManager.isSupported()
    }

    /**
     * Open a local directory as workspace
     */
    async openFolder(): Promise<{ name: string; files: FileNode[] } | null> {
        try {
            const root = await this.fileSystem.openDirectory()
            if (!root) return null

            this.workspaceName = root.name

            // Convert FileSystemManager FileNode to IDE FileNode format
            const files = this.convertToIDEFileNodes(root.children || [])

            // Save workspace to recent
            this.saveToRecent(root.name, root.path)

            return {
                name: root.name,
                files,
            }
        } catch (error) {
            // Handle File System Access API not supported
            if (error instanceof Error && error.message.includes("File System Access API is not supported")) {
                // Fallback: Create a mock workspace or show user instructions
                console.warn("File System Access API not supported, using fallback")
                throw new Error("Your browser doesn't support folder opening. Please use Chrome, Edge, or Opera, or drag & drop files instead.")
            }
            throw error
        }
    }

    /**
     * Read file content
     */
    async readFile(path: string): Promise<string> {
        return await this.fileSystem.readFile(path)
    }

    /**
     * Write file content
     */
    async writeFile(path: string, content: string): Promise<void> {
        await this.fileSystem.writeFile(path, content)
    }

    /**
     * Create new file
     */
    async createFile(dirPath: string, filename: string, content: string = ""): Promise<FileNode> {
        const fsNode = await this.fileSystem.createFile(dirPath, filename, content)
        return this.convertNodeToIDE(fsNode)
    }

    /**
     * Create new directory
     */
    async createDirectory(parentPath: string, dirname: string): Promise<FileNode> {
        const fsNode = await this.fileSystem.createDirectory(parentPath, dirname)
        return this.convertNodeToIDE(fsNode)
    }

    /**
     * Delete file or directory
     */
    async delete(path: string): Promise<void> {
        await this.fileSystem.delete(path)
    }

    /**
     * Rename file or directory
     */
    async rename(oldPath: string, newName: string): Promise<string> {
        return await this.fileSystem.rename(oldPath, newName)
    }

    /**
     * Check if workspace is open
     */
    isWorkspaceOpen(): boolean {
        return this.fileSystem.isDirectoryOpen()
    }

    /**
     * Get current workspace name
     */
    getWorkspaceName(): string | null {
        return this.workspaceName
    }

    /**
     * Convert FileSystemManager nodes to IDE FileNode format
     */
    private convertToIDEFileNodes(nodes: FSFileNode[]): FileNode[] {
        return nodes.map((node) => this.convertNodeToIDE(node))
    }

    /**
     * Convert single node
     */
    private convertNodeToIDE(node: FSFileNode): FileNode {
        const ideNode: FileNode = {
            id: node.path,
            name: node.name,
            type: node.type,
            language: node.language,
            content: node.content,
        }

        if (node.children) {
            ideNode.children = this.convertToIDEFileNodes(node.children)
        }

        return ideNode
    }

    /**
     * Save workspace to recent workspaces (localStorage)
     */
    private saveToRecent(name: string, path: string): void {
        const recent = this.getRecentWorkspaces()
        const newEntry = {
            name,
            path,
            lastOpened: new Date().toISOString(),
        }

        // Remove duplicate if exists
        const filtered = recent.filter((w) => w.path !== path)

        // Add to beginning and limit to 10
        const updated = [newEntry, ...filtered].slice(0, 10)

        localStorage.setItem("recentWorkspaces", JSON.stringify(updated))
    }

    /**
     * Get recent workspaces
     */
    getRecentWorkspaces(): Array<{ name: string; path: string; lastOpened: string }> {
        try {
            const json = localStorage.getItem("recentWorkspaces")
            return json ? JSON.parse(json) : []
        } catch {
            return []
        }
    }

    /**
     * Clear recent workspaces
     */
    clearRecentWorkspaces(): void {
        localStorage.removeItem("recentWorkspaces")
    }
}

export default WorkspaceManager
