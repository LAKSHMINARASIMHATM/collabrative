/**
 * Secure Storage Utility
 * Encrypts sensitive data before storing in localStorage
 */

const STORAGE_PREFIX = 'codesync_secure_'
const ENCRYPTION_KEY = 'codesync_encryption_key_v1' // In production, use a proper key derivation

export class SecureStorage {
    /**
     * Simple XOR encryption (for demo purposes)
     * In production, use Web Crypto API with proper key management
     */
    private static encrypt(text: string, key: string): string {
        let result = ''
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            )
        }
        return btoa(result) // Base64 encode
    }

    /**
     * Simple XOR decryption
     */
    private static decrypt(encrypted: string, key: string): string {
        const decoded = atob(encrypted) // Base64 decode
        let result = ''
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(
                decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            )
        }
        return result
    }

    /**
     * Store encrypted value
     */
    static setItem(key: string, value: string): void {
        try {
            const encrypted = this.encrypt(value, ENCRYPTION_KEY)
            localStorage.setItem(STORAGE_PREFIX + key, encrypted)
        } catch (error) {
            console.error('Failed to store encrypted value:', error)
        }
    }

    /**
     * Retrieve and decrypt value
     */
    static getItem(key: string): string | null {
        try {
            const encrypted = localStorage.getItem(STORAGE_PREFIX + key)
            if (!encrypted) {
                return null
            }
            return this.decrypt(encrypted, ENCRYPTION_KEY)
        } catch (error) {
            console.error('Failed to retrieve encrypted value:', error)
            return null
        }
    }

    /**
     * Remove item
     */
    static removeItem(key: string): void {
        localStorage.removeItem(STORAGE_PREFIX + key)
    }

    /**
     * Clear all secure storage
     */
    static clear(): void {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                localStorage.removeItem(key)
            }
        })
    }

    /**
     * Check if item exists
     */
    static hasItem(key: string): boolean {
        return localStorage.getItem(STORAGE_PREFIX + key) !== null
    }
}

/**
 * GitHub Token Manager
 * Specialized storage for GitHub authentication tokens
 */
export class GitHubTokenManager {
    private static readonly TOKEN_KEY = 'github_token'
    private static readonly USER_KEY = 'github_user'

    /**
     * Save GitHub token
     */
    static saveToken(token: string): void {
        SecureStorage.setItem(this.TOKEN_KEY, token)
    }

    /**
     * Get GitHub token
     */
    static getToken(): string | null {
        return SecureStorage.getItem(this.TOKEN_KEY)
    }

    /**
     * Remove GitHub token
     */
    static removeToken(): void {
        SecureStorage.removeItem(this.TOKEN_KEY)
        SecureStorage.removeItem(this.USER_KEY)
    }

    /**
     * Check if token exists
     */
    static hasToken(): boolean {
        return SecureStorage.hasItem(this.TOKEN_KEY)
    }

    /**
     * Save user information
     */
    static saveUser(user: { login: string; name: string; email: string }): void {
        SecureStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }

    /**
     * Get user information
     */
    static getUser(): { login: string; name: string; email: string } | null {
        const userData = SecureStorage.getItem(this.USER_KEY)
        if (!userData) {
            return null
        }
        try {
            return JSON.parse(userData)
        } catch {
            return null
        }
    }
}

export default SecureStorage
