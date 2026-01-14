/**
 * Web Preview Runtime
 * Executes and previews HTML, CSS, and React/TSX code
 */

"use client"

import { BaseRuntime } from '../runtime-base'
import type { ExecutionOptions, ExecutionResult, SupportedLanguage } from '../types'

export class WebPreviewRuntime extends BaseRuntime {
    readonly language: SupportedLanguage
    readonly type = 'browser' as const
    private previewWindow: Window | null = null

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
            let htmlContent = ''

            switch (this.language) {
                case 'html':
                    htmlContent = this.wrapHTML(code)
                    break

                case 'css':
                    htmlContent = this.wrapCSS(code)
                    break

                case 'typescript':
                case 'javascript':
                    // Check if it's React/JSX code
                    if (this.isReactCode(code)) {
                        htmlContent = await this.wrapReact(code)
                    } else {
                        // Regular JS execution
                        return await this.executeJS(code)
                    }
                    break

                default:
                    throw new Error(`Unsupported language: ${this.language}`)
            }

            // Open preview window
            this.openPreview(htmlContent)

            return this.formatResult(
                'Preview opened in new window',
                '',
                0,
                Date.now() - startTime
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

    private wrapHTML(html: string): string {
        // If it's a complete HTML document, use as-is
        if (html.trim().toLowerCase().startsWith('<!doctype') || html.trim().toLowerCase().startsWith('<html')) {
            return html
        }

        // Otherwise, wrap in basic HTML structure
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`
    }

    private wrapCSS(css: string): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>Your CSS has been applied to this page.</p>
    <button>Sample Button</button>
    <div class="box">Sample Box</div>
  </div>
</body>
</html>`
    }

    private async wrapReact(code: string): Promise<string> {
        // Transform JSX/TSX to plain JavaScript
        const transformedCode = this.transformReact(code)

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    
    // Auto-render if there's a default export or App component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    if (typeof App !== 'undefined') {
      root.render(<App />);
    } else if (typeof Component !== 'undefined') {
      root.render(<Component />);
    }
  </script>
</body>
</html>`
    }

    private async executeJS(code: string): Promise<ExecutionResult> {
        const startTime = Date.now()
        const logs: string[] = []
        const errors: string[] = []

        // Create console capture
        const originalLog = console.log
        const originalError = console.error

        console.log = (...args) => {
            logs.push(args.map(a => String(a)).join(' '))
            originalLog(...args)
        }

        console.error = (...args) => {
            errors.push(args.map(a => String(a)).join(' '))
            originalError(...args)
        }

        try {
            // Execute in isolated scope
            const func = new Function(code)
            func()

            return {
                status: 'success',
                stdout: logs.join('\n'),
                stderr: errors.join('\n'),
                output: logs.join('\n'),
                exitCode: 0,
                executionTime: Date.now() - startTime,
            }
        } catch (error) {
            return {
                status: 'error',
                stdout: logs.join('\n'),
                stderr: error instanceof Error ? error.message : String(error),
                output: logs.join('\n'),
                exitCode: 1,
                executionTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : String(error),
            }
        } finally {
            console.log = originalLog
            console.error = originalError
        }
    }

    private isReactCode(code: string): boolean {
        // Check for JSX syntax or React imports
        return (
            code.includes('import React') ||
            code.includes('from "react"') ||
            code.includes("from 'react'") ||
            /<[A-Z][a-zA-Z0-9]*/.test(code) || // JSX component tags
            code.includes('useState') ||
            code.includes('useEffect') ||
            code.includes('ReactDOM')
        )
    }

    private transformReact(code: string): string {
        // Basic JSX transformation (for simple cases)
        // In production, you'd use Babel or similar
        return code
            .replace(/import\s+.*?from\s+['"]react['"];?/g, '')
            .replace(/import\s+.*?from\s+['"]react-dom['"];?/g, '')
            .replace(/export\s+default\s+/g, '')
    }

    private openPreview(html: string): void {
        // Close existing preview window
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.close()
        }

        // Open new preview window
        this.previewWindow = window.open('', 'preview', 'width=800,height=600,resizable=yes,scrollbars=yes')

        if (this.previewWindow) {
            this.previewWindow.document.open()
            this.previewWindow.document.write(html)
            this.previewWindow.document.close()
        }
    }

    stop(): void {
        if (this.previewWindow && !this.previewWindow.closed) {
            this.previewWindow.close()
        }
    }

    cleanup(): void {
        this.stop()
    }
}

export default WebPreviewRuntime
