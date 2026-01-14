/// <reference types="jest" />
/**
 * File Validation Tests
 * Unit tests for file type checking and validation
 */

// import { describe, it, expect, beforeEach } from '@jest/globals'
import {
    validateFile,
    validateFiles,
    getValidationSummary,
} from '../file-validator'
import {
    getFileCategory,
    getSizeLimit,
    isSupportedExtension,
    isTextFile,
    isBinaryFile,
    formatFileSize,
} from '../file-types'

// Mock File class for testing
class MockFile extends File {
    constructor(
        bits: BlobPart[],
        name: string,
        options?: FilePropertyBag
    ) {
        super(bits, name, options)
    }
}

describe('File Type System', () => {
    describe('getFileCategory', () => {
        it('should correctly categorize text files', () => {
            expect(getFileCategory('.txt')).toBe('text')
            expect(getFileCategory('.md')).toBe('text')
            expect(getFileCategory('.log')).toBe('text')
        })

        it('should correctly categorize code files', () => {
            expect(getFileCategory('.js')).toBe('code')
            expect(getFileCategory('.ts')).toBe('code')
            expect(getFileCategory('.py')).toBe('code')
            expect(getFileCategory('.java')).toBe('code')
        })

        it('should correctly categorize config files', () => {
            expect(getFileCategory('.json')).toBe('config')
            expect(getFileCategory('.yaml')).toBe('config')
            expect(getFileCategory('.env')).toBe('config')
        })

        it('should return unknown for unsupported extensions', () => {
            expect(getFileCategory('.xyz')).toBe('unknown')
            expect(getFileCategory('.random')).toBe('unknown')
        })
    })

    describe('isSupportedExtension', () => {
        it('should return true for supported extensions', () => {
            expect(isSupportedExtension('.js')).toBe(true)
            expect(isSupportedExtension('.ts')).toBe(true)
            expect(isSupportedExtension('.json')).toBe(true)
            expect(isSupportedExtension('.csv')).toBe(true)
        })

        it('should return false for unsupported extensions', () => {
            expect(isSupportedExtension('.xyz')).toBe(false)
            expect(isSupportedExtension('.unknown')).toBe(false)
        })

        it('should be case-insensitive', () => {
            expect(isSupportedExtension('.JS')).toBe(true)
            expect(isSupportedExtension('.Json')).toBe(true)
        })
    })

    describe('getSizeLimit', () => {
        it('should return correct size limits for categories', () => {
            expect(getSizeLimit('code')).toBe(5 * 1024 * 1024) // 5 MB
            expect(getSizeLimit('config')).toBe(1 * 1024 * 1024) // 1 MB
            expect(getSizeLimit('data')).toBe(50 * 1024 * 1024) // 50 MB
        })
    })

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1.00 KB')
            expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
            expect(formatFileSize(1536)).toBe('1.50 KB')
        })
    })
})

describe('File Validation', () => {
    describe('validateFile - Success Cases', () => {
        it('should validate a valid JavaScript file', async () => {
            const file = new MockFile(
                ['console.log("Hello World")'],
                'test.js',
                { type: 'application/javascript' }
            )

            const result = await validateFile(file)

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('test.js')
                expect(result.data.extension).toBe('.js')
                expect(result.data.category).toBe('code')
                expect(result.data.isValid).toBe(true)
            }
        })

        it('should validate a valid JSON file', async () => {
            const jsonContent = JSON.stringify({ name: 'test', value: 123 })
            const file = new MockFile([jsonContent], 'test.json', { type: 'application/json' })

            const result = await validateFile(file)

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.category).toBe('config')
                expect(result.data.metadata?.lineCount).toBeGreaterThan(0)
            }
        })

        it('should validate a valid CSV file', async () => {
            const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA'
            const file = new MockFile([csvContent], 'test.csv', { type: 'text/csv' })

            const result = await validateFile(file)

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.category).toBe('data')
            }
        })

        it('should include metadata for text files', async () => {
            const content = 'Line 1\nLine 2\nLine 3'
            const file = new MockFile([content], 'test.txt', { type: 'text/plain' })

            const result = await validateFile(file)

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.metadata?.lineCount).toBe(3)
                expect(result.data.metadata?.charCount).toBe(content.length)
            }
        })
    })

    describe('validateFile - Failure Cases', () => {
        it('should reject files with unsupported extensions', async () => {
            const file = new MockFile(['content'], 'test.xyz', { type: 'text/plain' })

            const result = await validateFile(file)

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors).toHaveLength(1)
                expect(result.errors[0].code).toBe('INVALID_EXTENSION')
            }
        })

        it('should reject files that exceed size limit', async () => {
            // Create a file larger than the limit for config files (1 MB)
            const largeContent = 'x'.repeat(2 * 1024 * 1024) // 2 MB
            const file = new MockFile([largeContent], 'test.json', { type: 'application/json' })

            const result = await validateFile(file)

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors.some(e => e.code === 'FILE_TOO_LARGE')).toBe(true)
            }
        })

        it('should reject empty files', async () => {
            const file = new MockFile([], 'test.js', { type: 'application/javascript' })

            const result = await validateFile(file)

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors.some(e => e.code === 'EMPTY_FILE')).toBe(true)
            }
        })

        it('should reject invalid JSON', async () => {
            const invalidJson = '{ invalid json }'
            const file = new MockFile([invalidJson], 'test.json', { type: 'application/json' })

            const result = await validateFile(file)

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors.some(e => e.code === 'INVALID_JSON')).toBe(true)
            }
        })

        it('should reject CSV with inconsistent columns', async () => {
            const invalidCsv = 'name,age,city\nJohn,30\nJane,25,LA,Extra'
            const file = new MockFile([invalidCsv], 'test.csv', { type: 'text/csv' })

            const result = await validateFile(file)

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors.some(e => e.code === 'INVALID_CSV')).toBe(true)
            }
        })

        it('should reject YAML with tabs', async () => {
            const invalidYaml = 'key:\n\tvalue' // Contains tab
            const file = new MockFile([invalidYaml], 'test.yaml', { type: 'application/x-yaml' })

            const result = await validateFile(file)

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors.some(e => e.code === 'INVALID_YAML')).toBe(true)
            }
        })
    })

    describe('validateFiles - Batch Processing', () => {
        it('should validate multiple files', async () => {
            const files = [
                new MockFile(['console.log("test")'], 'test1.js', { type: 'application/javascript' }),
                new MockFile(['{"valid": "json"}'], 'test2.json', { type: 'application/json' }),
                new MockFile(['content'], 'test3.xyz', { type: 'text/plain' }), // Invalid
            ]

            const results = await validateFiles(files)

            expect(results).toHaveLength(3)
            expect(results[0].success).toBe(true)
            expect(results[1].success).toBe(true)
            expect(results[2].success).toBe(false)
        })
    })

    describe('getValidationSummary', () => {
        it('should generate correct summary', async () => {
            const files = [
                new MockFile(['valid'], 'test1.js', { type: 'application/javascript' }),
                new MockFile(['valid'], 'test2.ts', { type: 'application/typescript' }),
                new MockFile(['content'], 'test3.xyz', { type: 'text/plain' }), // Invalid
            ]

            const results = await validateFiles(files)
            const summary = getValidationSummary(results)

            expect(summary.total).toBe(3)
            expect(summary.valid).toBe(2)
            expect(summary.invalid).toBe(1)
            expect(summary.errors.size).toBe(1)
        })
    })
})

describe('Type Guards', () => {
    it('should identify text files correctly', () => {
        expect(isTextFile('text')).toBe(true)
        expect(isTextFile('code')).toBe(true)
        expect(isTextFile('config')).toBe(true)
        expect(isTextFile('binary')).toBe(false)
        expect(isTextFile('image')).toBe(false)
    })

    it('should identify binary files correctly', () => {
        expect(isBinaryFile('binary')).toBe(true)
        expect(isBinaryFile('image')).toBe(true)
        expect(isBinaryFile('text')).toBe(false)
        expect(isBinaryFile('code')).toBe(false)
    })
})
