/**
 * Command Validator
 * Validates and sanitizes terminal commands for security
 */

import type { ParsedCommand } from './command-parser'

export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    sanitized?: ParsedCommand
}

export interface SecurityResult {
    safe: boolean
    threats: string[]
    risk: 'low' | 'medium' | 'high'
}

export class CommandValidator {
    private allowedCommands: Set<string>
    private blockedCommands: Set<string>
    private dangerousPatterns: RegExp[]

    constructor() {
        // Whitelist of allowed commands
        this.allowedCommands = new Set([
            'help', 'ls', 'dir', 'cd', 'pwd', 'cat', 'type', 'echo',
            'mkdir', 'rmdir', 'del', 'rm', 'copy', 'cp', 'move', 'mv',
            'find', 'grep', 'tree', 'clear', 'cls', 'exit', 'node',
            'python', 'py', 'npm', 'git', 'touch', 'which', 'whoami'
        ])

        // Blacklist of dangerous commands
        this.blockedCommands = new Set([
            'format', 'fdisk', 'shutdown', 'reboot', 'halt',
            'rm -rf /', 'del /f /s /q', 'mkfs'
        ])

        // Dangerous patterns to detect
        this.dangerousPatterns = [
            /rm\s+-rf\s+\//,  // rm -rf /
            /del\s+\/[fs]/,    // del /f or /s
            /;\s*rm\s+-rf/,    // Command injection
            /\|\s*rm\s+-rf/,   // Pipe to rm
            /`.*`/,            // Command substitution
            /\$\(.*\)/,        // Command substitution
        ]
    }

    /**
     * Validate a parsed command
     */
    validate(command: ParsedCommand): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // Check if command is empty
        if (!command.command) {
            errors.push('Empty command')
            return { valid: false, errors, warnings }
        }

        // Check if command is allowed
        if (!this.allowedCommands.has(command.command.toLowerCase())) {
            errors.push(`Command not allowed: ${command.command}`)
            errors.push('Type "help" to see available commands')
            return { valid: false, errors, warnings }
        }

        // Check if command is blocked
        if (this.blockedCommands.has(command.rawInput.toLowerCase())) {
            errors.push(`Dangerous command blocked: ${command.command}`)
            return { valid: false, errors, warnings }
        }

        // Check for dangerous patterns
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(command.rawInput)) {
                errors.push('Command contains dangerous pattern and has been blocked')
                return { valid: false, errors, warnings }
            }
        }

        // Validate arguments
        const argValidation = this.validateArguments(command)
        errors.push(...argValidation.errors)
        warnings.push(...argValidation.warnings)

        // Sanitize command
        const sanitized = this.sanitize(command)

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            sanitized
        }
    }

    /**
     * Validate command arguments
     */
    private validateArguments(command: ParsedCommand): { errors: string[]; warnings: string[] } {
        const errors: string[] = []
        const warnings: string[] = []

        // Check for path traversal attempts
        for (const arg of command.args) {
            if (this.isPathTraversal(arg)) {
                errors.push(`Path traversal detected in argument: ${arg}`)
            }
        }

        // Validate file paths
        for (const arg of command.args) {
            if (this.looksLikePath(arg) && !this.isValidPath(arg)) {
                warnings.push(`Potentially invalid path: ${arg}`)
            }
        }

        return { errors, warnings }
    }

    /**
     * Sanitize command for safe execution
     */
    private sanitize(command: ParsedCommand): ParsedCommand {
        return {
            ...command,
            command: this.sanitizeString(command.command),
            args: command.args.map(arg => this.sanitizeString(arg)),
            rawInput: this.sanitizeString(command.rawInput)
        }
    }

    /**
     * Sanitize a string value
     */
    private sanitizeString(value: string): string {
        // Remove null bytes
        let sanitized = value.replace(/\0/g, '')

        // Remove control characters except newline and tab
        sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

        return sanitized
    }

    /**
     * Check for path traversal attempts
     */
    private isPathTraversal(path: string): boolean {
        const normalized = path.replace(/\\/g, '/')
        return normalized.includes('../') || normalized.includes('/..')
    }

    /**
     * Check if string looks like a file path
     */
    private looksLikePath(str: string): boolean {
        return str.includes('/') || str.includes('\\') || str.includes('.')
    }

    /**
     * Validate file path format
     */
    private isValidPath(path: string): boolean {
        // Check for invalid characters
        const invalidChars = /[<>"|?*\x00-\x1F]/
        if (invalidChars.test(path)) {
            return false
        }

        // Check for reserved names on Windows
        const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
        const parts = path.split(/[/\\]/)
        for (const part of parts) {
            if (reserved.test(part)) {
                return false
            }
        }

        return true
    }

    /**
     * Perform security check on command
     */
    checkSecurity(command: ParsedCommand): SecurityResult {
        const threats: string[] = []
        let risk: 'low' | 'medium' | 'high' = 'low'

        // Check for command injection
        if (command.rawInput.includes(';') || command.rawInput.includes('&&') || command.rawInput.includes('||')) {
            threats.push('Command chaining detected')
            risk = 'medium'
        }

        // Check for file deletion
        if (['rm', 'del', 'rmdir'].includes(command.command.toLowerCase())) {
            threats.push('File deletion command')
            risk = 'medium'
        }

        // Check for recursive operations
        if (command.flags.has('r') || command.flags.has('recursive')) {
            threats.push('Recursive operation')
            risk = 'high'
        }

        // Check for force flag
        if (command.flags.has('f') || command.flags.has('force')) {
            threats.push('Force flag detected')
            risk = risk === 'high' ? 'high' : 'medium'
        }

        return {
            safe: threats.length === 0,
            threats,
            risk
        }
    }

    /**
     * Add custom command to whitelist
     */
    allowCommand(command: string): void {
        this.allowedCommands.add(command.toLowerCase())
    }

    /**
     * Block a command
     */
    blockCommand(command: string): void {
        this.blockedCommands.add(command.toLowerCase())
    }
}

export default CommandValidator
