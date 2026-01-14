"use client"

/**
 * Execution Manager
 * 
 * Central orchestrator for code execution across all supported languages
 * Supports multiple execution backends with automatic fallback
 */

import type { SupportedLanguage, ExecutionOptions, ExecutionResult } from './types'
import { JavaScriptRuntime } from './runtimes/javascript-runtime'
import WebPreviewRuntime from './runtimes/web-preview-runtime'
// Import alternative runtimes
import PistonRuntime from './runtimes/piston-runtime'
import JDoodleRuntime from './runtimes/jdoodle-runtime'
import OneCompilerRuntime from './runtimes/onecompiler-runtime'

export class ExecutionManager {
    private runtimes: Map<SupportedLanguage, any> = new Map()
    private preferredBackend: string = 'piston' // Default to free Piston API

    constructor() {
        this.preferredBackend = typeof window !== 'undefined'
            ? (process.env.NEXT_PUBLIC_EXECUTION_BACKEND || 'piston')
            : 'piston'
        this.initializeRuntimes()
    }

    private initializeRuntimes() {
        // Browser-based runtimes (always available for JS/TS)
        this.runtimes.set('javascript', new JavaScriptRuntime())
        this.runtimes.set('typescript', new JavaScriptRuntime())

        // Web preview runtimes for HTML/CSS
        this.runtimes.set('html', new WebPreviewRuntime('html'))
        this.runtimes.set('css', new WebPreviewRuntime('css'))
    }

    async execute(
        code: string,
        language: SupportedLanguage,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
        try {
            // For HTML/CSS, use web preview runtime
            if (language === 'html' || language === 'css') {
                const runtime = this.runtimes.get(language)
                if (runtime) {
                    return await runtime.execute(code, options)
                }
            }

            // For JavaScript/TypeScript, check if it's React code
            if (language === 'javascript' || language === 'typescript') {
                const isReact = this.isReactCode(code)

                if (isReact) {
                    // Use web preview for React code
                    const webRuntime = new WebPreviewRuntime(language)
                    await webRuntime.initialize()
                    return await webRuntime.execute(code, options)
                } else {
                    // Use regular JS runtime
                    const runtime = this.runtimes.get(language)
                    if (runtime) {
                        return await runtime.execute(code, options)
                    }
                }
            }

            // For other languages, try backends in order
            const backends = this.getBackendOrder()

            for (const backend of backends) {
                try {
                    const result = await this.executeWithBackend(backend, code, language, options)
                    if (result.status !== 'error' || !result.error?.includes('not configured')) {
                        return result
                    }
                } catch (error) {
                    console.warn(`Backend ${backend} failed, trying next...`, error)
                    continue
                }
            }

            // If all backends fail, return error
            return {
                status: 'error',
                stdout: '',
                stderr: 'All execution backends failed. Please check your configuration.',
                output: 'Execution failed',
                exitCode: 1,
                executionTime: 0,
                error: 'All backends unavailable',
            }
        } catch (error) {
            return {
                status: 'error',
                stdout: '',
                stderr: error instanceof Error ? error.message : 'Unknown error',
                output: error instanceof Error ? error.message : 'Unknown error',
                exitCode: 1,
                executionTime: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }

    private isReactCode(code: string): boolean {
        return (
            code.includes('import React') ||
            code.includes('from "react"') ||
            code.includes("from 'react'") ||
            /<[A-Z][a-zA-Z0-9]*/.test(code) ||
            code.includes('useState') ||
            code.includes('useEffect') ||
            code.includes('ReactDOM') ||
            code.includes('jsx') ||
            code.includes('tsx')
        )
    }

    private getBackendOrder(): string[] {
        const backends = ['piston', 'onecompiler', 'jdoodle']

        // Move preferred backend to front
        const index = backends.indexOf(this.preferredBackend)
        if (index > -1) {
            backends.splice(index, 1)
            backends.unshift(this.preferredBackend)
        }

        return backends
    }

    private async executeWithBackend(
        backend: string,
        code: string,
        language: SupportedLanguage,
        options: ExecutionOptions
    ): Promise<ExecutionResult> {
        let runtime

        switch (backend) {
            case 'piston':
                runtime = new PistonRuntime(language)
                break
            case 'jdoodle':
                runtime = new JDoodleRuntime(language)
                break
            case 'onecompiler':
                runtime = new OneCompilerRuntime(language)
                break
            default:
                throw new Error(`Unknown backend: ${backend}`)
        }

        await runtime.initialize()
        return await runtime.execute(code, options)
    }

    stop() {
        // Stop all running executions
        this.runtimes.forEach(runtime => {
            if (runtime.stop) {
                runtime.stop()
            }
        })
    }

    cleanup() {
        this.runtimes.forEach(runtime => {
            if (runtime.cleanup) {
                runtime.cleanup()
            }
        })
        this.runtimes.clear()
    }

    /**
     * Get runtime instance for a specific language
     */
    getRuntime(language: SupportedLanguage): any {
        return this.runtimes.get(language)
    }
}

// Singleton instance
let executionManager: ExecutionManager | null = null

export function getExecutionManager(): ExecutionManager {
    if (!executionManager) {
        executionManager = new ExecutionManager()
    }
    return executionManager
}

export default ExecutionManager
