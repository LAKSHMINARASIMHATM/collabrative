/**
 * File Validation Module
 * Runtime validation for imported files
 */

import {
    type ValidatedFile,
    type ValidationResult,
    type ValidationError,
    type FileCategory,
    type FileMetadata,
    getFileCategory,
    getSizeLimit,
    getMimeType,
    isSupportedExtension,
    isTextFile,
} from './file-types'

/**
 * Validate a file before import
 */
export async function validateFile(file: File): Promise<ValidationResult<ValidatedFile>> {
    const errors: ValidationError[] = []

    // Extract file info
    const extension = getFileExtension(file.name)
    const category = getFileCategory(extension)

    // 1. Validate extension
    if (!isSupportedExtension(extension)) {
        errors.push({
            code: 'INVALID_EXTENSION',
            message: `Unsupported file extension: ${extension}`,
            field: 'extension',
            details: { extension, name: file.name }
        })
    }

    // 2. Validate file size
    const sizeLimit = getSizeLimit(category)
    if (file.size > sizeLimit) {
        errors.push({
            code: 'FILE_TOO_LARGE',
            message: `File exceeds size limit of ${formatBytes(sizeLimit)}`,
            field: 'size',
            details: { size: file.size, limit: sizeLimit }
        })
    }

    // 3. Check for empty file
    if (file.size === 0) {
        errors.push({
            code: 'EMPTY_FILE',
            message: 'File is empty',
            field: 'size'
        })
    }

    // If basic validation fails, return early
    if (errors.length > 0) {
        return { success: false, errors }
    }

    try {
        // Read file content
        const content = isTextFile(category)
            ? await readAsText(file)
            : await readAsArrayBuffer(file)

        // 4. Validate content structure
        const contentValidation = await validateContent(content, category, extension)
        if (!contentValidation.success) {
            errors.push(...contentValidation.errors)
        }

        if (errors.length > 0) {
            return { success: false, errors }
        }

        // Generate metadata
        const metadata = generateMetadata(content, category)

        // Create validated file object
        const validatedFile: ValidatedFile = {
            name: file.name,
            path: file.webkitRelativePath || file.name,
            content,
            size: file.size,
            extension,
            category,
            mimeType: getMimeType(extension),
            encoding: isTextFile(category) ? 'utf-8' : undefined,
            metadata,
            isValid: true
        }

        return { success: true, data: validatedFile }

    } catch (error) {
        errors.push({
            code: 'INVALID_CONTENT',
            message: error instanceof Error ? error.message : 'Failed to read file',
            details: error
        })
        return { success: false, errors }
    }
}

/**
 * Validate content structure based on file type
 */
async function validateContent(
    content: string | ArrayBuffer,
    category: FileCategory,
    extension: string
): Promise<{ success: true } | { success: false; errors: ValidationError[] }> {
    const errors: ValidationError[] = []

    // Only validate text content
    if (typeof content !== 'string') {
        return { success: true }
    }

    // Validate JSON structure
    if (extension === '.json') {
        try {
            JSON.parse(content)
        } catch (error) {
            errors.push({
                code: 'INVALID_JSON',
                message: 'Invalid JSON structure',
                field: 'content',
                details: error instanceof Error ? error.message : 'Parse error'
            })
        }
    }

    // Validate CSV structure
    if (extension === '.csv' || extension === '.tsv') {
        const delimiter = extension === '.csv' ? ',' : '\t'
        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length === 0) {
            errors.push({
                code: 'INVALID_CSV',
                message: 'CSV file is empty',
                field: 'content'
            })
        } else {
            // Check that all rows have same number of columns
            const headerCols = lines[0].split(delimiter).length
            const invalidRows = lines.slice(1).filter(line => {
                return line.split(delimiter).length !== headerCols
            })

            if (invalidRows.length > 0) {
                errors.push({
                    code: 'INVALID_CSV',
                    message: 'CSV rows have inconsistent column counts',
                    field: 'content',
                    details: { invalidRowCount: invalidRows.length }
                })
            }
        }
    }

    // Validate YAML structure (basic check)
    if (extension === '.yaml' || extension === '.yml') {
        // Basic YAML syntax check
        if (content.includes('\t')) {
            errors.push({
                code: 'INVALID_YAML',
                message: 'YAML files should not contain tabs (use spaces for indentation)',
                field: 'content'
            })
        }
    }

    // Check for binary content in text files
    if (isTextFile(category)) {
        if (containsBinaryData(content)) {
            errors.push({
                code: 'BINARY_AS_TEXT',
                message: 'File appears to contain binary data but has a text extension',
                field: 'content'
            })
        }
    }

    return errors.length > 0 ? { success: false, errors } : { success: true }
}

/**
 * Generate file metadata
 */
function generateMetadata(content: string | ArrayBuffer, category: FileCategory): FileMetadata {
    const metadata: FileMetadata = {}

    if (typeof content === 'string') {
        metadata.lineCount = content.split('\n').length
        metadata.charCount = content.length
        metadata.hasUnicode = /[^\x00-\x7F]/.test(content)
    }

    return metadata
}

/**
 * Read file as text
 */
function readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
    })
}

/**
 * Read file as ArrayBuffer
 */
function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = () => reject(reader.error)
        reader.readAsArrayBuffer(file)
    })
}

/**
 * Get file extension including the dot
 */
function getFileExtension(filename: string): string {
    const match = filename.match(/\.[^.]+$/)
    return match ? match[0].toLowerCase() : ''
}

/**
 * Check if content contains binary data
 */
function containsBinaryData(content: string): boolean {
    // Check for null bytes or other control characters (except common ones)
    for (let i = 0; i < Math.min(content.length, 8000); i++) {
        const code = content.charCodeAt(i)
        // Allow common control chars: tab (9), line feed (10), carriage return (13)
        if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
            return true
        }
    }
    return false
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
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
 * Batch validate multiple files
 */
export async function validateFiles(files: File[]): Promise<ValidationResult<ValidatedFile>[]> {
    return Promise.all(files.map(file => validateFile(file)))
}

/**
 * Get validation summary for multiple files
 */
export interface ValidationSummary {
    total: number
    valid: number
    invalid: number
    errors: Map<string, ValidationError[]>
}

export function getValidationSummary(
    results: ValidationResult<ValidatedFile>[]
): ValidationSummary {
    const summary: ValidationSummary = {
        total: results.length,
        valid: 0,
        invalid: 0,
        errors: new Map()
    }

    results.forEach((result, index) => {
        if (result.success) {
            summary.valid++
        } else {
            summary.invalid++
            summary.errors.set(`file_${index}`, result.errors)
        }
    })

    return summary
}
