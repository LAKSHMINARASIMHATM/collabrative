"use client"

/**
 * Base Runtime Class
 * 
 * Abstract base class providing common functionality for all language runtimes
 */

import type { Runtime, ExecutionOptions, ExecutionResult, SupportedLanguage, RuntimeType } from './types'

export abstract class BaseRuntime implements Runtime {
    abstract readonly language: SupportedLanguage
    abstract readonly type: RuntimeType

    protected ready = false
    protected executing = false
    protected abortController: AbortController | null = null

    /**
     * Initialize the runtime
     */
    abstract initialize(): Promise<void>

    /**
     * Execute code with the runtime
     */
    abstract executeInternal(code: string, options: ExecutionOptions): Promise<ExecutionResult>

    /**
     * Execute code with timeout and error handling
     */
    async execute(code: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
        if (!this.ready) {
            await this.initialize()
        }

        if (this.executing) {
            return {
                status: 'error',
                stdout: '',
                stderr: 'Runtime is already executing code',
                output: 'Runtime is already executing code',
                exitCode: 1,
                executionTime: 0,
                error: 'Runtime is already executing code',
            }
        }

        this.executing = true
        this.abortController = new AbortController()

        const startTime = Date.now()
        const timeout = options.timeout || 30000

        try {
            // Set up timeout
            const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Execution timeout'))
                }, timeout)
            })

            // Race between execution and timeout
            const result = await Promise.race([
                this.executeInternal(code, options),
                timeoutPromise,
            ])

            const executionTime = Date.now() - startTime
            return {
                ...result,
                executionTime,
            }
        } catch (error) {
            const executionTime = Date.now() - startTime
            const isTimeout = error instanceof Error && error.message === 'Execution timeout'

            return {
                status: isTimeout ? 'timeout' : 'error',
                stdout: '',
                stderr: error instanceof Error ? error.message : String(error),
                output: error instanceof Error ? error.message : String(error),
                exitCode: 1,
                executionTime,
                error: error instanceof Error ? error.message : String(error),
            }
        } finally {
            this.executing = false
            this.abortController = null
        }
    }

    /**
     * Stop current execution
     */
    stop(): void {
        if (this.abortController) {
            this.abortController.abort()
        }
        this.executing = false
    }

    /**
     * Check if runtime is ready
     */
    isReady(): boolean {
        return this.ready
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.stop()
        this.ready = false
    }

    /**
     * Format execution result
     */
    protected formatResult(
        stdout: string,
        stderr: string,
        exitCode: number,
        executionTime: number,
        memory?: number
    ): ExecutionResult {
        const hasError = exitCode !== 0 || stderr.length > 0
        const output = stdout + (stderr ? `\n${stderr}` : '')

        return {
            status: hasError ? 'error' : 'success',
            stdout,
            stderr,
            output,
            exitCode,
            executionTime,
            memory,
            error: hasError ? stderr || 'Execution failed' : undefined,
        }
    }
}

export default BaseRuntime
