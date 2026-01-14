/**
 * JDoodle API Runtime
 * Alternative code execution using JDoodle API
 * https://www.jdoodle.com/compiler-api
 */

"use client"

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage } from '../types'

export class JDoodleRuntime extends BaseRuntime {
    readonly language: SupportedLanguage
    readonly type = 'server' as const
    private apiUrl = 'https://api.jdoodle.com/v1/execute'
    private clientId = process.env.NEXT_PUBLIC_JDOODLE_CLIENT_ID || ''
    private clientSecret = process.env.NEXT_PUBLIC_JDOODLE_CLIENT_SECRET || ''

    constructor(language: SupportedLanguage) {
        super()
        this.language = language
    }

    async initialize(): Promise<void> {
        if (!this.clientId || !this.clientSecret) {
            console.warn('JDoodle API credentials not configured')
        }
        this.ready = true
    }

    async executeInternal(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
        const startTime = Date.now()

        if (!this.clientId || !this.clientSecret) {
            return {
                status: 'error',
                stdout: '',
                stderr: 'JDoodle API credentials not configured. Set NEXT_PUBLIC_JDOODLE_CLIENT_ID and NEXT_PUBLIC_JDOODLE_CLIENT_SECRET',
                output: 'API credentials missing',
                exitCode: 1,
                executionTime: 0,
                error: 'API credentials not configured',
            }
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    script: code,
                    language: this.mapLanguage(this.language),
                    versionIndex: this.getVersionIndex(this.language),
                    stdin: options.input || '',
                }),
            })

            if (!response.ok) {
                throw new Error(`JDoodle API error: ${response.statusText}`)
            }

            const result = await response.json()
            const executionTime = Date.now() - startTime

            // JDoodle returns output and error in different fields
            const stdout = result.output || ''
            const stderr = result.error || ''
            const statusCode = result.statusCode || 0

            return this.formatResult(
                stdout,
                stderr,
                statusCode === 200 ? 0 : 1,
                executionTime
            )
        } catch (error) {
            return {
                status: 'error',
                stdout: '',
                stderr: error instanceof Error ? error.message : 'Unknown error',
                output: error instanceof Error ? error.message : 'Unknown error',
                exitCode: 1,
                executionTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }

    private mapLanguage(lang: SupportedLanguage): string {
        const mapping: Record<string, string> = {
            javascript: 'nodejs',
            typescript: 'nodejs',
            python: 'python3',
            java: 'java',
            cpp: 'cpp17',
            c: 'c',
            csharp: 'csharp',
            go: 'go',
            rust: 'rust',
            php: 'php',
            ruby: 'ruby',
            swift: 'swift',
            kotlin: 'kotlin',
            scala: 'scala',
        }
        return mapping[lang] || 'nodejs'
    }

    private getVersionIndex(lang: SupportedLanguage): string {
        // Version indices for JDoodle (these may need updating)
        const versions: Record<string, string> = {
            javascript: '4',
            typescript: '4',
            python: '4',
            java: '4',
            cpp: '5',
            c: '5',
            csharp: '4',
            go: '4',
            rust: '4',
            php: '4',
            ruby: '4',
            swift: '4',
            kotlin: '4',
            scala: '4',
        }
        return versions[lang] || '4'
    }
}

export default JDoodleRuntime
