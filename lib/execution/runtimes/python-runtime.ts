"use client"

/**
 * Python Runtime (Enhanced)
 * 
 * Browser-based Python execution using Pyodide (WebAssembly)
 */

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage, RuntimeType } from '../types'

// Dynamically import Pyodide
let loadPyodide: any = null
let PyodideInterface: any = null

export class PythonRuntime extends BaseRuntime {
    readonly language: SupportedLanguage = 'python'
    readonly type: RuntimeType = 'browser'

    private pyodide: any = null
    private initializing = false

    /**
     * Initialize Pyodide
     */
    async initialize(): Promise<void> {
        if (this.ready) return
        if (this.initializing) {
            // Wait for initialization to complete
            while (this.initializing) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
            return
        }

        this.initializing = true

        try {
            // Dynamically load Pyodide
            if (!loadPyodide) {
                const pyodideModule = await import('pyodide')
                loadPyodide = pyodideModule.loadPyodide
            }

            console.log('Loading Pyodide...')
            this.pyodide = await loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            })

            this.ready = true
            console.log('Pyodide loaded successfully')
        } catch (error) {
            console.error('Failed to load Pyodide:', error)
            throw error
        } finally {
            this.initializing = false
        }
    }

    /**
     * Execute Python code
     */
    async executeInternal(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
        if (!this.pyodide) {
            throw new Error('Pyodide not initialized')
        }

        const startTime = Date.now()

        try {
            // Set up stdout/stderr capture
            await this.pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `)

            // Run user code
            await this.pyodide.runPythonAsync(code)

            // Get output
            const stdout = await this.pyodide.runPythonAsync('sys.stdout.getvalue()')
            const stderr = await this.pyodide.runPythonAsync('sys.stderr.getvalue()')

            const executionTime = Date.now() - startTime

            return this.formatResult(
                String(stdout || ''),
                String(stderr || ''),
                stderr ? 1 : 0,
                executionTime
            )
        } catch (error) {
            const executionTime = Date.now() - startTime

            // Extract Python error message
            let errorMessage = error instanceof Error ? error.message : String(error)

            // Try to get stderr
            try {
                const stderr = await this.pyodide.runPythonAsync('sys.stderr.getvalue()')
                if (stderr) {
                    errorMessage = String(stderr)
                }
            } catch { }

            return this.formatResult(
                '',
                errorMessage,
                1,
                executionTime
            )
        }
    }

    /**
     * Install Python package
     */
    async installPackage(packageName: string): Promise<void> {
        if (!this.pyodide) {
            throw new Error('Pyodide not initialized')
        }

        try {
            console.log(`Installing ${packageName}...`)
            await this.pyodide.loadPackage('micropip')
            await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
      `)
            console.log(`Successfully installed ${packageName}`)
        } catch (error) {
            console.error(`Failed to install ${packageName}:`, error)
            throw error
        }
    }

    /**
     * Get Pyodide instance (for advanced usage)
     */
    getPyodide(): any {
        return this.pyodide
    }
}

export default PythonRuntime
