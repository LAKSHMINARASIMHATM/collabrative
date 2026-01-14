"use client"

/**
 * Judge0 Runtime
 * 
 * Server-side code execution via Judge0 API
 * Supports 60+ programming languages
 */

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage, RuntimeType } from '../types'
import { getLanguageConfig } from '../types'

interface Judge0Submission {
    token: string
}

interface Judge0Result {
    status: {
        id: number
        description: string
    }
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    message: string | null
    time: string
    memory: number
}

export class Judge0Runtime extends BaseRuntime {
    readonly language: SupportedLanguage = 'java' // Base, supports multiple
    readonly type: RuntimeType = 'server'

    private apiUrl = process.env.NEXT_PUBLIC_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
    private apiKey = process.env.NEXT_PUBLIC_JUDGE0_API_KEY || ''
    private apiHost = 'judge0-ce.p.rapidapi.com'

    /**
     * Initialize runtime
     */
    async initialize(): Promise<void> {
        if (this.ready) return

        // Check API connectivity
        if (!this.apiKey) {
            console.warn('Judge0 API key not configured. Server-side execution may not work.')
        }

        this.ready = true
    }

    /**
     * Execute code via Judge0
     */
    async executeInternal(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
        // Get language-specific Judge0 ID
        const config = getLanguageConfig(this.language)
        const languageId = config.judge0Id

        if (!languageId) {
            throw new Error(`Judge0 language ID not configured for ${config.name}`)
        }

        const startTime = Date.now()

        try {
            // Submit code
            const submission = await this.submitCode(code, languageId, options)

            // Poll for results
            const result = await this.pollResults(submission.token)

            const executionTime = Date.now() - startTime

            // Format result
            return this.formatJudge0Result(result, executionTime)
        } catch (error) {
            const executionTime = Date.now() - startTime
            return this.formatResult(
                '',
                error instanceof Error ? error.message : String(error),
                1,
                executionTime
            )
        }
    }

    /**
     * Submit code to Judge0
     */
    private async submitCode(
        code: string,
        languageId: number,
        options: ExecutionOptions
    ): Promise<Judge0Submission> {
        const response = await fetch(`${this.apiUrl}/submissions?wait=false`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': this.apiKey,
                'X-RapidAPI-Host': this.apiHost,
            },
            body: JSON.stringify({
                source_code: btoa(code), // Base64 encode
                language_id: languageId,
                stdin: options.input ? btoa(options.input) : '',
                cpu_time_limit: (options.timeout || 30000) / 1000, // Convert to seconds
                memory_limit: options.memoryLimit ? options.memoryLimit / 1024 : 128000, // Convert to KB
            }),
        })

        if (!response.ok) {
            throw new Error(`Judge0 submission failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * Poll for execution results
     */
    private async pollResults(token: string, maxAttempts = 30): Promise<Judge0Result> {
        for (let i = 0; i < maxAttempts; i++) {
            const response = await fetch(`${this.apiUrl}/submissions/${token}?base64_encoded=true&fields=*`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.apiKey,
                    'X-RapidAPI-Host': this.apiHost,
                },
            })

            if (!response.ok) {
                throw new Error(`Failed to get results: ${response.statusText}`)
            }

            const result: Judge0Result = await response.json()

            // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded, etc.
            const statusId = result.status.id

            if (statusId > 2) {
                // Execution complete
                return result
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        throw new Error('Execution timeout: Results not available')
    }

    /**
     * Format Judge0 result
     */
    private formatJudge0Result(result: Judge0Result, executionTime: number): ExecutionResult {
        const stdout = result.stdout ? atob(result.stdout) : ''
        const stderr = result.stderr ? atob(result.stderr) : ''
        const compileOutput = result.compile_output ? atob(result.compile_output) : ''
        const message = result.message || ''

        const hasError = result.status.id !== 3 // 3 = Accepted
        const errorOutput = stderr || compileOutput || message

        return this.formatResult(
            stdout,
            errorOutput,
            hasError ? 1 : 0,
            executionTime,
            result.memory * 1024 // Convert KB to bytes
        )
    }

    /**
     * Execute code for specific language
     */
    async executeForLanguage(
        code: string,
        language: SupportedLanguage,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
        // Temporarily set language for this execution
        const originalLang = this.language
            ; (this as any).language = language

        try {
            return await this.execute(code, options)
        } finally {
            ; (this as any).language = originalLang
        }
    }
}

export default Judge0Runtime
