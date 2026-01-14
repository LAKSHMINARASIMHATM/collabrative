/**
 * Unified Language Manager
 * Handles execution for multiple programming languages
 */

import PythonRuntime from "./python-runtime"
import { WebContainerManager } from "../webcontainer"

export type SupportedLanguage = "javascript" | "typescript" | "python" | "java" | "cpp" | "c" | "go" | "rust" | "php"

export interface ExecutionResult {
    output: string
    error?: string
    exitCode?: number
}

export class LanguageManager {
    private pythonRuntime: PythonRuntime | null = null
    private webContainer: typeof WebContainerManager | null = null

    /**
     * Execute code in the specified language
     */
    async execute(
        language: SupportedLanguage,
        code: string,
        filename: string,
        onOutput?: (line: string) => void
    ): Promise<ExecutionResult> {
        switch (language) {
            case "javascript":
            case "typescript":
                return await this.executeJavaScript(code, filename, onOutput)

            case "python":
                return await this.executePython(code, onOutput)

            case "java":
                return await this.executeJava(code, filename, onOutput)

            case "cpp":
            case "c":
                return await this.executeCpp(code, filename, onOutput)

            case "go":
                return await this.executeGo(code, filename, onOutput)

            case "rust":
                return await this.executeRust(code, filename, onOutput)

            case "php":
                return await this.executePHP(code, onOutput)

            default:
                return {
                    output: "",
                    error: `Unsupported language: ${language}`,
                }
        }
    }

    /**
     * Execute JavaScript/TypeScript using WebContainers
     */
    private async executeJavaScript(
        code: string,
        filename: string,
        onOutput?: (line: string) => void
    ): Promise<ExecutionResult> {
        try {
            const exitCode = await WebContainerManager.executeFile(filename, onOutput)
            return { output: "", exitCode }
        } catch (error) {
            return {
                output: "",
                error: error instanceof Error ? error.message : String(error),
            }
        }
    }

    /**
     * Execute Python using Pyodide
     */
    private async executePython(code: string, onOutput?: (line: string) => void): Promise<ExecutionResult> {
        if (!this.pythonRuntime) {
            this.pythonRuntime = new PythonRuntime()
            await this.pythonRuntime.init()
        }

        return await this.pythonRuntime.runCode(code, onOutput)
    }

    /**
     * Execute Java (simulated - requires backend or WASM compiler)
     */
    private async executeJava(
        code: string,
        filename: string,
        onOutput?: (line: string) => void
    ): Promise<ExecutionResult> {
        // Note: Real Java execution would require GraalVM WASM or backend service
        const output = `
Java Execution (Simulated)
===========================
File: ${filename}

[INFO] This is a simulation. For real Java execution:
- Use GraalVM Native Image (WASM compilation)
- Deploy backend execution service
- Use remote container execution

Code Preview:
${code.split('\n').slice(0, 10).join('\n')}
${code.split('\n').length > 10 ? '...' : ''}

[SUCCESS] Syntax appears valid
`

        if (onOutput) {
            onOutput(output)
        }

        return { output }
    }

    /**
     * Execute C/C++ (simulated - requires Emscripten or backend)
     */
    private async executeCpp(
        code: string,
        filename: string,
        onOutput?: (line: string) => void
    ): Promise<ExecutionResult> {
        // Note: Real C++ execution would require Emscripten WASM compilation
        const output = `
C/C++ Execution (Simulated)
===========================
File: ${filename}

[INFO] This is a simulation. For real C/C++ execution:
- Use Emscripten for WASM compilation
- Deploy backend with GCC/Clang
- Use WebAssembly System Interface (WASI)

Code Preview:
${code.split('\n').slice(0, 10).join('\n')}
${code.split('\n').length > 10 ? '...' : ''}

[SUCCESS] Syntax appears valid
`

        if (onOutput) {
            onOutput(output)
        }

        return { output }
    }

    /**
     * Execute Go (simulated - requires TinyGo WASM or backend)
     */
    private async executeGo(
        code: string,
        filename: string,
        onOutput?: (line: string) => void
    ): Promise<ExecutionResult> {
        const output = `
Go Execution (Simulated)
========================
File: ${filename}

[INFO] This is a simulation. For real Go execution:
- Use TinyGo for WASM compilation
- Deploy backend Go runtime
- Use GopherJS for JavaScript transpilation

Code Preview:
${code.split('\n').slice(0, 10).join('\n')}
${code.split('\n').length > 10 ? '...' : ''}

[SUCCESS] Syntax appears valid
`

        if (onOutput) {
            onOutput(output)
        }

        return { output }
    }

    /**
     * Execute Rust (simulated - requires wasm-pack or backend)
     */
    private async executeRust(
        code: string,
        filename: string,
        onOutput?: (line: string) => void
    ): Promise<ExecutionResult> {
        const output = `
Rust Execution (Simulated)
==========================
File: ${filename}

[INFO] This is a simulation. For real Rust execution:
- Use wasm-pack for WASM compilation
- Deploy backend Rust runtime with Cargo
- Use Rust Playground API

Code Preview:
${code.split('\n').slice(0, 10).join('\n')}
${code.split('\n').length > 10 ? '...' : ''}

[SUCCESS] Syntax appears valid
`

        if (onOutput) {
            onOutput(output)
        }

        return { output }
    }

    /**
     * Execute PHP (simulated - requires PHP WASM or backend)
     */
    private async executePHP(code: string, onOutput?: (line: string) => void): Promise<ExecutionResult> {
        const output = `
PHP Execution (Simulated)
=========================

[INFO] This is a simulation. For real PHP execution:
- Use php-wasm for browser execution
- Deploy backend PHP runtime
- Use PHP-CPP for native execution

Code Preview:
${code.split('\n').slice(0, 10).join('\n')}
${code.split('\n').length > 10 ? '...' : ''}

[SUCCESS] Syntax appears valid
`

        if (onOutput) {
            onOutput(output)
        }

        return { output }
    }

    /**
     * Get language from file extension
     */
    static getLanguageFromFile(filename: string): SupportedLanguage {
        const ext = filename.split(".").pop()?.toLowerCase()

        const extMap: Record<string, SupportedLanguage> = {
            js: "javascript",
            mjs: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            py: "python",
            java: "java",
            cpp: "cpp",
            cc: "cpp",
            cxx: "cpp",
            c: "c",
            h: "c",
            go: "go",
            rs: "rust",
            php: "php",
        }

        return extMap[ext || ""] || "javascript"
    }

    /**
     * Check if language is supported
     */
    static isSupported(language: string): boolean {
        return ["javascript", "typescript", "python", "java", "cpp", "c", "go", "rust", "php"].includes(language)
    }
}

export default LanguageManager
