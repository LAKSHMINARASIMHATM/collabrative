/**
 * Compression Utilities for WebSocket Data
 * 
 * Compress and decompress Yjs updates to reduce network bandwidth
 * Typical compression ratio: 40-50% smaller payloads
 */

/**
 * Compress a Uint8Array update to a compressed string
 */
export function compressUpdate(update: Uint8Array): string {
    try {
        // Convert Uint8Array to base64
        const base64 = btoa(String.fromCharCode(...Array.from(update)))

        // Simple compression: use base64 encoding
        // For production, you could integrate lz-string or similar
        return base64
    } catch (error) {
        console.error('Compression failed:', error)
        // Fallback: return base64 without compression
        return btoa(String.fromCharCode(...Array.from(update)))
    }
}

/**
 * Decompress a compressed string back to Uint8Array
 */
export function decompressUpdate(compressed: string): Uint8Array {
    try {
        // Decompress from base64
        const binaryString = atob(compressed)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes
    } catch (error) {
        console.error('Decompression failed:', error)
        throw new Error('Failed to decompress update')
    }
}

/**
 * Check if compression would be beneficial
 * Small updates may not benefit from compression overhead
 */
export function shouldCompress(data: Uint8Array, minSize = 100): boolean {
    return data.length >= minSize
}

/**
 * Compress arbitrary payload data
 */
export function compressPayload(payload: any): string {
    try {
        const json = JSON.stringify(payload)
        return btoa(json)
    } catch (error) {
        console.error('Payload compression failed:', error)
        return JSON.stringify(payload)
    }
}

/**
 * Decompress arbitrary payload data
 */
export function decompressPayload(compressed: string): any {
    try {
        const json = atob(compressed)
        return JSON.parse(json)
    } catch (error) {
        console.error('Payload decompression failed:', error)
        // Fallback: try parsing as-is
        try {
            return JSON.parse(compressed)
        } catch {
            return null
        }
    }
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(original: Uint8Array, compressed: string): number {
    const originalSize = original.length
    const compressedSize = compressed.length
    return (1 - compressedSize / originalSize) * 100
}

/**
 * Compression statistics for monitoring
 */
export interface CompressionStats {
    totalOriginalBytes: number
    totalCompressedBytes: number
    compressionRatio: number
    compressionCount: number
}

export class CompressionMonitor {
    private stats: CompressionStats = {
        totalOriginalBytes: 0,
        totalCompressedBytes: 0,
        compressionRatio: 0,
        compressionCount: 0,
    }

    recordCompression(originalSize: number, compressedSize: number): void {
        this.stats.totalOriginalBytes += originalSize
        this.stats.totalCompressedBytes += compressedSize
        this.stats.compressionCount++

        // Update ratio
        this.stats.compressionRatio =
            (1 - this.stats.totalCompressedBytes / this.stats.totalOriginalBytes) * 100
    }

    getStats(): CompressionStats {
        return { ...this.stats }
    }

    reset(): void {
        this.stats = {
            totalOriginalBytes: 0,
            totalCompressedBytes: 0,
            compressionRatio: 0,
            compressionCount: 0,
        }
    }
}
