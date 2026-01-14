/**
 * Terminal Command Executor
 * Central execution engine for terminal commands
 */

import type { ParsedCommand } from './command-parser'
import type { ValidationResult } from './command-validator'

export interface ExecutionContext {
    workingDirectory: string
    environment: Map<string, string>
    user: string
    terminal: {
        write: (text: string) => void
        writeln: (text: string) => void
    }
    onRunCode?: (filename: string) => Promise<void>
}

export interface ExecutionResult {
    success: boolean
    output: string
    error?: string
    exitCode: number
    executionTime: number
}

export type CommandHandler = (
    command: ParsedCommand,
    context: ExecutionContext
) => Promise<ExecutionResult>

export class TerminalExecutor {
    private handlers: Map<string, CommandHandler>
    private context: ExecutionContext

    constructor(context: ExecutionContext) {
        this.handlers = new Map()
        this.context = context
    }

    /**
     * Register a command handler
     */
    registerCommand(command: string, handler: CommandHandler): void {
        this.handlers.set(command.toLowerCase(), handler)
    }

    /**
     * Execute a validated command
     */
    async execute(command: ParsedCommand, validation: ValidationResult): Promise<ExecutionResult> {
        const startTime = performance.now()

        try {
            // Use sanitized command if available
            const cmdToExecute = validation.sanitized || command

            // Get command handler
            const handler = this.handlers.get(cmdToExecute.command.toLowerCase())

            if (!handler) {
                return {
                    success: false,
                    output: '',
                    error: `Command not implemented: ${cmdToExecute.command}`,
                    exitCode: 127,
                    executionTime: performance.now() - startTime
                }
            }

            // Execute command
            const result = await handler(cmdToExecute, this.context)

            return {
                ...result,
                executionTime: performance.now() - startTime
            }
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                exitCode: 1,
                executionTime: performance.now() - startTime
            }
        }
    }

    /**
     * Execute command with timeout
     */
    async executeWithTimeout(
        command: ParsedCommand,
        validation: ValidationResult,
        timeoutMs: number = 30000
    ): Promise<ExecutionResult> {
        const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
            setTimeout(() => reject(new Error('Command execution timed out')), timeoutMs)
        })

        const executionPromise = this.execute(command, validation)

        try {
            return await Promise.race([executionPromise, timeoutPromise])
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Execution timeout',
                exitCode: 124,
                executionTime: timeoutMs
            }
        }
    }

    /**
     * Update execution context
     */
    updateContext(updates: Partial<ExecutionContext>): void {
        this.context = { ...this.context, ...updates }
    }

    /**
     * Get current context
     */
    getContext(): ExecutionContext {
        return { ...this.context }
    }

    /**
     * Set environment variable
     */
    setEnv(key: string, value: string): void {
        this.context.environment.set(key, value)
    }

    /**
     * Get environment variable
     */
    getEnv(key: string): string | undefined {
        return this.context.environment.get(key)
    }

    /**
     * Change working directory
     */
    setWorkingDirectory(path: string): void {
        this.context.workingDirectory = path
    }

    /**
     * Get working directory
     */
    getWorkingDirectory(): string {
        return this.context.workingDirectory
    }
}

export default TerminalExecutor
