/**
 * Piston API Runtime
 * Alternative code execution using Piston API (open source)
 * https://github.com/engineer-man/piston
 */

"use client"

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage } from '../types'

export class PistonRuntime extends BaseRuntime {
    readonly language: SupportedLanguage
    readonly type = 'server' as const
    private apiUrl = 'https://emkc.org/api/v2/piston'

    constructor(language: SupportedLanguage) {
        super()
        this.language = language
    }

    async initialize(): Promise<void> {
        this.ready = true
    }

    async executeInternal(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
        const startTime = Date.now()

        try {
            // Map our language to Piston language
            const pistonLanguage = this.mapLanguage(this.language)

            // Get runtime version
            const runtimes = await this.getRuntimes()
            const runtime = runtimes.find((r: any) => r.language === pistonLanguage)

            if (!runtime) {
                throw new Error(`Language ${pistonLanguage} not supported by Piston`)
            }

            // Execute code
            const response = await fetch(`${this.apiUrl}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: pistonLanguage,
                    version: runtime.version,
                    files: [{
                        name: this.getFileName(this.language),
                        content: code,
                    }],
                    stdin: options.input || '',
                    args: options.args || [],
                    compile_timeout: 10000,
                    run_timeout: options.timeout || 3000,
                    compile_memory_limit: -1,
                    run_memory_limit: -1,
                }),
            })

            if (!response.ok) {
                throw new Error(`Piston API error: ${response.statusText}`)
            }

            const result = await response.json()
            const executionTime = Date.now() - startTime

            // Check for compilation errors
            if (result.compile && result.compile.code !== 0) {
                return this.formatResult(
                    result.compile.stdout || '',
                    result.compile.stderr || 'Compilation failed',
                    result.compile.code,
                    executionTime
                )
            }

            // Return execution result
            return this.formatResult(
                result.run.stdout || '',
                result.run.stderr || '',
                result.run.code || 0,
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

    private async getRuntimes(): Promise<any[]> {
        try {
            const response = await fetch(`${this.apiUrl}/runtimes`)
            return await response.json()
        } catch (error) {
            console.error('Failed to fetch Piston runtimes:', error)
            return []
        }
    }

    private mapLanguage(lang: SupportedLanguage): string {
        const mapping: Record<string, string> = {
            javascript: 'javascript',
            typescript: 'typescript',
            python: 'python',
            java: 'java',
            cpp: 'c++',
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
        return mapping[lang] || lang
    }

    private getFileName(lang: SupportedLanguage): string {
        const extensions: Record<string, string> = {
            javascript: 'main.js',
            typescript: 'main.ts',
            python: 'main.py',
            java: 'Main.java',
            cpp: 'main.cpp',
            c: 'main.c',
            csharp: 'Main.cs',
            go: 'main.go',
            rust: 'main.rs',
            php: 'main.php',
            ruby: 'main.rb',
            swift: 'main.swift',
            kotlin: 'Main.kt',
            scala: 'Main.scala',
        }
        return extensions[lang] || 'main.txt'
    }
}

export default PistonRuntime
