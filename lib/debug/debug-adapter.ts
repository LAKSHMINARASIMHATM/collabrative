/**
 * Debug Adapter Protocol (DAP) implementation
 * Provides unified debugging interface for all languages
 */

export interface DebugSession {
    id: string
    language: string
    state: "idle" | "running" | "paused" | "stopped"
}

export interface Breakpoint {
    id: string
    file: string
    line: number
    condition?: string
    enabled: boolean
}

export interface StackFrame {
    id: string
    name: string
    file: string
    line: number
    column: number
}

export interface Variable {
    name: string
    value: any
    type: string
    variablesReference?: number
}

export interface Scope {
    name: string
    variablesReference: number
    expensive: boolean
}

import { getExecutionManager } from '../execution/execution-manager'
import type { SupportedLanguage, DebugEvent } from '../execution/types'

export class DebugAdapter {
    private session: DebugSession | null = null
    private breakpoints = new Map<string, Breakpoint[]>()
    private stackFrames: StackFrame[] = []
    private variables = new Map<number, Variable[]>()
    private currentLine: number | null = null
    private currentFile: string | null = null
    private updateCallback: ((state: any) => void) | null = null

    setUpdateCallback(callback: (state: any) => void) {
        this.updateCallback = callback
    }

    private notifyUpdate() {
        if (this.updateCallback) {
            this.updateCallback({
                session: this.session,
                currentLine: this.currentLine,
                stackFrames: this.stackFrames,
                variables: this.variables
            })
        }
    }

    /**
     * Start debug session
     */
    async start(language: string, filename: string, content: string): Promise<void> {
        this.session = {
            id: `debug-${Date.now()}`,
            language,
            state: "idle",
        }
        this.currentFile = filename

        // Initialize debugger based on language
        switch (language) {
            case "javascript":
            case "typescript":
                await this.startNodeDebugger(content, language as SupportedLanguage)
                break

            case "python":
                await this.startPythonDebugger(content)
                break

            default:
                console.log(`Debug support for ${language} is simulated`)
        }
    }

    /**
     * Set breakpoints for a file
     */
    setBreakpoints(file: string, lines: number[]): Breakpoint[] {
        const breakpoints = lines.map((line, index) => ({
            id: `bp-${Date.now()}-${index}`,
            file,
            line,
            enabled: true,
        }))

        this.breakpoints.set(file, breakpoints)
        return breakpoints
    }

    /**
     * Continue execution
     */
    async continue(): Promise<void> {
        if (this.session) {
            this.session.state = "running"
            this.currentLine = null
            this.notifyUpdate()

            const manager = getExecutionManager()
            const runtime = manager.getRuntime(this.session.language as SupportedLanguage)
            if (runtime && runtime.resume) {
                runtime.resume()
            }
        }
    }

    /**
     * Step over
     */
    async stepOver(): Promise<void> {
        if (this.session?.state === "paused") {
            const manager = getExecutionManager()
            const runtime = manager.getRuntime(this.session.language as SupportedLanguage)
            if (runtime && runtime.step) {
                runtime.step()
            }
        }
    }

    /**
     * Step into
     */
    async stepInto(): Promise<void> {
        // For now, map to step (same as stepOver in this simple implementation)
        await this.stepOver()
    }

    /**
     * Step out
     */
    async stepOut(): Promise<void> {
        // Not supported in simple runtime yet
        await this.stepOver()
    }

    /**
     * Pause execution
     */
    async pause(): Promise<void> {
        // Not easily supported in simple async runtime without eager checks, 
        // effectively ignored or sets flag for next check
        if (this.session) {
            this.session.state = "paused"
            this.notifyUpdate()
        }
    }

    /**
     * Stop debugging
     */
    async stop(): Promise<void> {
        const manager = getExecutionManager()
        if (this.session) {
            const runtime = manager.getRuntime(this.session.language as SupportedLanguage)
            if (runtime && runtime.stop) {
                runtime.stop()
            }
        }

        this.session = null
        this.stackFrames = []
        this.variables.clear()
        this.currentLine = null
        this.notifyUpdate()
    }

    /**
     * Start Node.js debugger (actually Browser JS debugger now)
     */
    private async startNodeDebugger(content: string, language: SupportedLanguage): Promise<void> {
        console.log("Starting debugger for:", language)

        const manager = getExecutionManager()
        // Get configured breakpoints for this file
        const filePoints = this.breakpoints.get(this.currentFile!) || []
        const lineNumbers = filePoints.map(bp => bp.line)

        // Start execution
        manager.execute(content, language, {
            debug: true,
            breakpoints: lineNumbers,
            onDebugEvent: (event) => this.handleDebugEvent(event)
        }).then(() => {
            if (this.session) {
                this.stop()
            }
        })

        this.session!.state = "running"
        this.notifyUpdate()
    }

    private handleDebugEvent(event: DebugEvent) {
        if (!this.session) return

        if (event.type === 'breakpoint' || event.type === 'step') {
            this.session.state = "paused"
            this.currentLine = event.line || null

            // Update stack frame (simulated for now)
            this.stackFrames = [{
                id: 'frame-1',
                name: 'main',
                file: this.currentFile!,
                line: this.currentLine || 1,
                column: 1
            }]

            this.notifyUpdate()
        } else if (event.type === 'log') {
            // Logs are handled by execution output, but we could capture them here too
        }
    }

    /**
     * Start Python debugger
     */
    private async startPythonDebugger(program: string): Promise<void> {
        // Simulation for Python
        console.log("Starting Python debugger for:", program)
        this.session!.state = "paused"
        this.currentLine = 1
        this.notifyUpdate()
    }

    // ... rest of getters ...

    /**
     * Get stack trace
     */
    getStackTrace(): StackFrame[] {
        return this.stackFrames
    }

    /**
     * Get scopes for a stack frame
     */
    getScopes(frameId: string): Scope[] {
        return [
            {
                name: "Variables",
                variablesReference: 1,
                expensive: false,
            }
        ]
    }

    /**
     * Get variables for a scope
     */
    getVariables(variablesReference: number): Variable[] {
        return this.variables.get(variablesReference) || []
    }

    isActive(): boolean {
        return this.session !== null
    }

    getSession() {
        return this.session
    }

    getCurrentLine() {
        return this.currentLine
    }
}

export default DebugAdapter
