"use client"

/**
 * JavaScript/TypeScript Runtime
 * 
 * Browser-based JavaScript execution using Web Workers for isolation
 */

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage, RuntimeType } from '../types'

export class JavaScriptRuntime extends BaseRuntime {
  readonly language: SupportedLanguage = 'javascript'
  readonly type: RuntimeType = 'browser'

  private worker: Worker | null = null

  /**
   * Initialize runtime
   */
  async initialize(): Promise<void> {
    if (this.ready) return

    // Web Worker is created on-demand during execution
    this.ready = true
  }

  /**
   * Execute JavaScript code
   */
  async executeInternal(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // Create inline worker for code execution
      const result = await this.executeInWorker(code, options.timeout || 30000)
      const executionTime = Date.now() - startTime

      return this.formatResult(
        result.output,
        result.error || '',
        result.error ? 1 : 0,
        executionTime
      )
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
   * Execute code in Web Worker
   */
  private executeInWorker(code: string, timeout: number, options: ExecutionOptions = {}): Promise<{ output: string, error?: string }> {
    return new Promise((resolve, reject) => {
      // Instrument code if debug mode is on
      let codeToExecute = code
      if (options.debug) {
        codeToExecute = this.instrumentCode(code)
      }

      // Create worker code that captures console output and handles debugging
      const workerCode = `
        let output = [];
        let hasError = false;
        let isPaused = false;
        let stepOver = false;
        
        // Debug state
        const breakpoints = new Set(${JSON.stringify(options.breakpoints || [])});
        
        // Communication with main thread
        const postDebug = (type, data) => {
          self.postMessage({ type: 'debug', subType: type, ...data });
        };
        
        // Wait for resume/step signal
        const waitForSignal = async () => {
          isPaused = true;
          return new Promise(resolve => {
            const handler = (e) => {
              if (e.data.type === 'resume') {
                isPaused = false;
                stepOver = false;
                self.removeEventListener('message', handler);
                resolve();
              } else if (e.data.type === 'step') {
                isPaused = false;
                stepOver = true;
                self.removeEventListener('message', handler);
                resolve();
              }
            };
            self.addEventListener('message', handler);
          });
        };
        
        // Breakpoint check function exposed to instrumented code
        self.__check_bkpt = async (line) => {
          if (stepOver || breakpoints.has(line)) {
            postDebug('breakpoint', { line });
            await waitForSignal();
          }
        };
        
        // Override console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
          const msg = args.map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); }
              catch(e) { return String(arg); }
            }
            return String(arg);
          }).join(' ');
          
          output.push(msg);
          postDebug('log', { message: msg });
        };
        
        console.error = (...args) => {
          hasError = true;
          const msg = 'ERROR: ' + args.map(String).join(' ');
          output.push(msg);
          postDebug('log', { message: msg });
        };
        
        console.warn = (...args) => {
          const msg = 'WARNING: ' + args.map(String).join(' ');
          output.push(msg);
          postDebug('log', { message: msg });
        };
        
        // Execute user code
        self.onmessage = function(e) {
          if (e.data.type === 'resume' || e.data.type === 'step') return;
          
          try {
            // Wrap in async function to support await
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction(e.data.code);
            
            Promise.resolve(fn()).then(result => {
              if (result !== undefined) {
                console.log(result);
              }
              self.postMessage({
                output: output.join('\\n'),
                error: hasError ? output.join('\\n') : undefined
              });
            }).catch(error => {
              self.postMessage({
                output: output.join('\\n'),
                error: error.message || String(error)
              });
            });
          } catch (error) {
            self.postMessage({
              output: output.join('\\n'),
              error: error.message || String(error)
            });
          }
        };
      `

      // Create blob and worker
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      this.worker = new Worker(workerUrl)

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.worker?.terminate()
        URL.revokeObjectURL(workerUrl)
        reject(new Error('Execution timeout'))
      }, timeout)

      // Listen for result and debug events
      this.worker.onmessage = (e) => {
        const data = e.data

        if (data.type === 'debug') {
          if (options.onDebugEvent) {
            options.onDebugEvent({
              type: data.subType,
              line: data.line,
              message: data.message,
              variables: {}
            })
          }
          return;
        }

        clearTimeout(timeoutId)
        this.worker?.terminate()
        URL.revokeObjectURL(workerUrl)
        resolve(data)
      }

      this.worker.onerror = (error) => {
        clearTimeout(timeoutId)
        this.worker?.terminate()
        URL.revokeObjectURL(workerUrl)
        reject(new Error(error.message || 'Worker error'))
      }

      this.worker.postMessage({ code: codeToExecute })
    })
  }

  /**
   * Instrument code for debugging
   */
  private instrumentCode(code: string): string {
    const lines = code.split('\n')
    return lines.map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('}') ||
        trimmed.startsWith(']') ||
        trimmed.startsWith(')') ||
        trimmed.startsWith('else') ||
        trimmed.startsWith('catch') ||
        trimmed.startsWith('finally')
      ) {
        return line
      }
      return `await __check_bkpt(${index + 1}); ${line}`
    }).join('\n')
  }

  resume() {
    this.worker?.postMessage({ type: 'resume' })
  }

  step() {
    this.worker?.postMessage({ type: 'step' })
  }

  stop(): void {
    super.stop()
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  cleanup(): void {
    this.stop()
    super.cleanup()
  }
}

export default JavaScriptRuntime
