/**
 * Drag and Drop Handler for IDE
 * Handles file uploads via drag and drop with validation
 */

import { toast } from "sonner"
import { validateFile, validateFiles } from "./validation/file-validator"
import type { ValidatedFile } from "./validation/file-types"
import { isTextFile } from "./validation/file-types"

export interface OpenFile {
    id: string
    name: string
    content: string
    language: string
    isDirty: boolean
}

export interface DroppedFile {
    name: string
    path: string
    content: string
    type: string
}

export class DragDropHandler {
    private dropZone: HTMLElement
    private onFilesAdded?: (files: OpenFile[]) => void

    constructor(dropZone: HTMLElement) {
        this.dropZone = dropZone
        this.setupListeners()
    }

    /**
     * Setup drag and drop event listeners
     */
    private setupListeners(): void {
        // Prevent default drag behaviors
        ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false)
            document.body.addEventListener(eventName, this.preventDefaults, false)
        })

            // Highlight drop zone when item is dragged over it
            ;["dragenter", "dragover"].forEach((eventName) => {
                this.dropZone.addEventListener(eventName, this.highlight.bind(this), false)
            })

            ;["dragleave", "drop"].forEach((eventName) => {
                this.dropZone.addEventListener(eventName, this.unhighlight.bind(this), false)
            })

        // Handle dropped files
        this.dropZone.addEventListener("drop", this.handleDrop.bind(this), false)
    }

    /**
     * Prevent default drag behaviors
     */
    private preventDefaults(e: Event): void {
        e.preventDefault()
        e.stopPropagation()
    }

    /**
     * Highlight drop zone
     */
    private highlight(): void {
        this.dropZone.classList.add("drag-over")
    }

    /**
     * Remove highlight
     */
    private unhighlight(): void {
        this.dropZone.classList.remove("drag-over")
    }

    /**
     * Handle file drop
     */
    private async handleDrop(e: DragEvent): Promise<void> {
        const dataTransfer = e.dataTransfer
        if (!dataTransfer) return

        const files = Array.from(dataTransfer.files)
        await this.processFiles(files)
    }

    /**
     * Process dropped files
     */
    private async processFiles(files: File[]): Promise<void> {
        if (files.length === 0) return

        toast.info(`Processing ${files.length} file${files.length > 1 ? 's' : ''}...`)

        // Validate all files first
        const validationResults = await validateFiles(files)

        let successCount = 0
        let errorCount = 0
        const addedOpenFiles: OpenFile[] = []

        for (let i = 0; i < files.length; i++) {
            const result = validationResults[i]
            const file = files[i]

            if (!result.success) {
                // Show validation errors
                errorCount++
                const errorMsg = result.errors.map(e => e.message).join(', ')
                toast.error(`${file.name}: ${errorMsg}`)
                continue
            }

            try {
                const validatedFile = result.data
                const openFile = await this.convertToOpenFile(validatedFile)
                addedOpenFiles.push(openFile)
                successCount++
            } catch (error) {
                errorCount++
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                toast.error(`${file.name}: ${errorMsg}`)
            }
        }

        if (this.onFilesAdded && addedOpenFiles.length > 0) {
            this.onFilesAdded(addedOpenFiles)
        }

        // Show summary
        if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} file${successCount > 1 ? 's' : ''}`)
        }
        if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} file${errorCount > 1 ? 's' : ''}`)
        }
    }

    /**
     * Convert validated file to OpenFile format
     */
    private async convertToOpenFile(validatedFile: ValidatedFile): Promise<OpenFile> {
        const language = this.detectLanguage(validatedFile.extension)

        // Convert content to string if text file
        let content: string
        if (isTextFile(validatedFile.category)) {
            content = validatedFile.content as string
        } else {
            // For binary files, convert to base64 or handle appropriately
            if (validatedFile.content instanceof ArrayBuffer) {
                const bytes = new Uint8Array(validatedFile.content)
                content = `Binary file (${validatedFile.size} bytes)\nType: ${validatedFile.mimeType}`
            } else {
                content = validatedFile.content as string // Assuming content is string for non-ArrayBuffer binary
            }
        }

        return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: validatedFile.name,
            content,
            language,
            isDirty: false,
        }
    }

    /**
     * Read file content
     */
    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === "string") {
                    resolve(result)
                } else {
                    reject(new Error("Failed to read file as text"))
                }
            }

            reader.onerror = () => reject(reader.error)

            // Check if file is binary
            if (this.isBinaryFile(file.name)) {
                reader.readAsDataURL(file)
            } else {
                reader.readAsText(file)
            }
        })
    }

    /**
     * Check if file is binary
     */
    private isBinaryFile(filename: string): boolean {
        const binaryExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".ico",
            ".pdf",
            ".zip",
            ".tar",
            ".gz",
            ".exe",
            ".dll",
            ".so",
            ".bin",
        ]

        return binaryExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
    }

    /**
     * Detect programming language from file extension
     */
    private detectLanguage(extension: string): string {
        const ext = extension.toLowerCase()
        const languageMap: Record<string, string> = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.txt': 'plaintext',
            '.csv': 'csv',
            '.sql': 'sql',
            '.sh': 'shell',
            '.bash': 'shell',
            '.env': 'properties',
        }

        return languageMap[ext] || 'plaintext'
    }

    /**
     * Register callback for files added
     */
    setOnFilesAdded(callback: (files: OpenFile[]) => void): void {
        this.onFilesAdded = callback
    }

    /**
     * Register callback for dropped files
     */
    onFilesDropped(callback: (files: DroppedFile[]) => void): () => void {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent<{ files: DroppedFile[] }>
            callback(customEvent.detail.files)
        }

        this.dropZone.addEventListener("filesDropped", handler)

        // Return unsubscribe function
        return () => {
            this.dropZone.removeEventListener("filesDropped", handler)
        }
    }

    /**
     * Cleanup listeners
     */
    destroy(): void {
        ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            this.dropZone.removeEventListener(eventName, this.preventDefaults, false)
            document.body.removeEventListener(eventName, this.preventDefaults, false)
        })
    }
}

export default DragDropHandler
