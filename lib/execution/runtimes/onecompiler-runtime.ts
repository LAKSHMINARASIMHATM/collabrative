/**
 * OneCompiler API Runtime
 * Alternative code execution using OneCompiler API
 * https://onecompiler.com/api
 */

"use client"

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage } from '../types'

export class OneCompilerRuntime extends BaseRuntime {
    readonly language: SupportedLanguage
    readonly type = 'server' as const
    private apiUrl = 'https://onecompiler.com/api/code/exec'

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
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language: this.mapLanguage(this.language),
                    stdin: options.input || '',
                    files: [{
                        name: this.getFileName(this.language),
                        content: code,
                    }],
                }),
            })

            if (!response.ok) {
                throw new Error(`OneCompiler API error: ${response.statusText}`)
            }

            const result = await response.json()
            const executionTime = Date.now() - startTime

            return this.formatResult(
                result.stdout || '',
                result.stderr || result.exception || '',
                result.exitCode || 0,
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
            typescript: 'typescript',
            python: 'python',
            java: 'java',
            cpp: 'cpp',
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
            javascript: 'index.js',
            typescript: 'index.ts',
            python: 'main.py',
            java: 'Main.java',
            cpp: 'main.cpp',
            c: 'main.c',
            csharp: 'Program.cs',
            go: 'main.go',
            rust: 'main.rs',
            php: 'index.php',
            ruby: 'main.rb',
            swift: 'main.swift',
            kotlin: 'Main.kt',
            scala: 'Main.scala',
        }
        return extensions[lang] || 'main.txt'
    }
}

export default OneCompilerRuntime
