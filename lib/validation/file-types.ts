/**
 * File Type Definitions and Validation System
 * Provides type-safe file handling with runtime validation
 */

// Supported file extensions
export const SUPPORTED_EXTENSIONS = {
    // Text/Code files
    TEXT: ['.txt', '.md', '.log'],
    CODE: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php'],
    WEB: ['.html', '.css', '.scss', '.less', '.sass'],
    CONFIG: ['.json', '.yaml', '.yml', '.toml', '.xml', '.env'],
    DATA: ['.csv', '.tsv'],

    // Binary files
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp'],
    DOCUMENT: ['.pdf'],
    ARCHIVE: ['.zip', '.tar', '.gz', '.rar', '.7z'],
} as const

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
    TEXT_FILE: 10 * 1024 * 1024,      // 10 MB
    CODE_FILE: 5 * 1024 * 1024,        // 5 MB
    CONFIG_FILE: 1 * 1024 * 1024,      // 1 MB
    DATA_FILE: 50 * 1024 * 1024,       // 50 MB
    IMAGE_FILE: 10 * 1024 * 1024,      // 10 MB
    BINARY_FILE: 100 * 1024 * 1024,    // 100 MB
} as const

// File type categories
export type FileCategory = 'text' | 'code' | 'web' | 'config' | 'data' | 'image' | 'binary' | 'unknown'

// Validated file interface
export interface ValidatedFile {
    name: string
    path: string
    content: string | ArrayBuffer
    size: number
    extension: string
    category: FileCategory
    mimeType: string
    encoding?: string
    metadata?: FileMetadata
    isValid: true
}

// File metadata
export interface FileMetadata {
    createdAt?: Date
    modifiedAt?: Date
    author?: string
    lineCount?: number
    charCount?: number
    hasUnicode?: boolean
}

// Validation error
export interface ValidationError {
    code: ValidationErrorCode
    message: string
    field?: string
    details?: unknown
}

export type ValidationErrorCode =
    | 'INVALID_EXTENSION'
    | 'FILE_TOO_LARGE'
    | 'INVALID_CONTENT'
    | 'INVALID_JSON'
    | 'INVALID_CSV'
    | 'INVALID_YAML'
    | 'UNSUPPORTED_TYPE'
    | 'EMPTY_FILE'
    | 'BINARY_AS_TEXT'

// Validation result
export type ValidationResult<T = ValidatedFile> =
    | { success: true; data: T }
    | { success: false; errors: ValidationError[] }

// Type guards
export function isValidatedFile(file: unknown): file is ValidatedFile {
    return (
        typeof file === 'object' &&
        file !== null &&
        'name' in file &&
        'content' in file &&
        'size' in file &&
        'category' in file &&
        'isValid' in file &&
        file.isValid === true
    )
}

export function isTextFile(category: FileCategory): boolean {
    return ['text', 'code', 'web', 'config', 'data'].includes(category)
}

export function isBinaryFile(category: FileCategory): boolean {
    return ['image', 'binary'].includes(category)
}

/**
 * Get file category from extension
 */
export function getFileCategory(extension: string): FileCategory {
    const ext = extension.toLowerCase() as any // Type assertion for dynamic check

    if ((SUPPORTED_EXTENSIONS.TEXT as readonly string[]).includes(ext)) return 'text'
    if ((SUPPORTED_EXTENSIONS.CODE as readonly string[]).includes(ext)) return 'code'
    if ((SUPPORTED_EXTENSIONS.WEB as readonly string[]).includes(ext)) return 'web'
    if ((SUPPORTED_EXTENSIONS.CONFIG as readonly string[]).includes(ext)) return 'config'
    if ((SUPPORTED_EXTENSIONS.DATA as readonly string[]).includes(ext)) return 'data'
    if ((SUPPORTED_EXTENSIONS.IMAGE as readonly string[]).includes(ext)) return 'image'
    if (([...(SUPPORTED_EXTENSIONS.DOCUMENT as readonly string[]), ...(SUPPORTED_EXTENSIONS.ARCHIVE as readonly string[])] as readonly string[]).includes(ext)) return 'binary'

    return 'unknown'
}

/**
 * Get appropriate size limit for file category
 */
export function getSizeLimit(category: FileCategory): number {
    switch (category) {
        case 'text':
            return FILE_SIZE_LIMITS.TEXT_FILE
        case 'code':
        case 'web':
            return FILE_SIZE_LIMITS.CODE_FILE
        case 'config':
            return FILE_SIZE_LIMITS.CONFIG_FILE
        case 'data':
            return FILE_SIZE_LIMITS.DATA_FILE
        case 'image':
            return FILE_SIZE_LIMITS.IMAGE_FILE
        case 'binary':
        default:
            return FILE_SIZE_LIMITS.BINARY_FILE
    }
}

/**
 * Get MIME type from extension
 */
export function getMimeType(extension: string): string {
    const mimeMap: Record<string, string> = {
        // Text
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.log': 'text/plain',

        // Code
        '.js': 'application/javascript',
        '.ts': 'application/typescript',
        '.jsx': 'application/javascript',
        '.tsx': 'application/typescript',
        '.py': 'text/x-python',
        '.java': 'text/x-java',
        '.cpp': 'text/x-c++src',
        '.c': 'text/x-csrc',
        '.go': 'text/x-go',
        '.rs': 'text/x-rustsrc',
        '.php': 'text/x-php',

        // Web
        '.html': 'text/html',
        '.css': 'text/css',
        '.scss': 'text/x-scss',
        '.less': 'text/x-less',

        // Config
        '.json': 'application/json',
        '.yaml': 'application/x-yaml',
        '.yml': 'application/x-yaml',
        '.xml': 'application/xml',
        '.env': 'text/plain',

        // Data
        '.csv': 'text/csv',
        '.tsv': 'text/tab-separated-values',

        // Images
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
    }

    return mimeMap[extension.toLowerCase()] || 'application/octet-stream'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Check if file extension is supported
 */
export function isSupportedExtension(extension: string): boolean {
    const ext = extension.toLowerCase()
    return getAllSupportedExtensions().includes(ext)
}

/**
 * Get all supported extensions as a flat array
 */
export function getAllSupportedExtensions(): string[] {
    return Object.values(SUPPORTED_EXTENSIONS).flat() as string[]
}
