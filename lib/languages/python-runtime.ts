import { loadPyodide, type PyodideInterface } from "pyodide"

export class PythonRuntime {
    private pyodide: PyodideInterface | null = null
    private initialized = false

    /**
     * Initialize Pyodide runtime
     */
    async init(): Promise<void> {
        if (this.initialized) return

        console.log("Loading Pyodide...")
        this.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/",
        })
        this.initialized = true
        console.log("Pyodide loaded")
    }

    /**
     * Run Python code
     */
    async runCode(code: string, onOutput?: (line: string) => void): Promise<{ output: string; error?: string }> {
        if (!this.pyodide) {
            throw new Error("Pyodide not initialized")
        }

        try {
            // Redirect stdout/stderr
            await this.pyodide.runPythonAsync(`
        import sys
        from io import StringIO
        sys.stdout = StringIO()
        sys.stderr = StringIO()
      `)

            // Run the user code
            await this.pyodide.runPythonAsync(code)

            // Get output
            const stdout = await this.pyodide.runPythonAsync("sys.stdout.getvalue()")
            const stderr = await this.pyodide.runPythonAsync("sys.stderr.getvalue()")

            const output = stdout + (stderr ? `\nErrors:\n${stderr}` : "")

            if (onOutput) {
                onOutput(output)
            }

            return { output, error: stderr ? String(stderr) : undefined }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (onOutput) {
                onOutput(`Error: ${errorMessage}`)
            }
            return { output: "", error: errorMessage }
        }
    }

    /**
     * Install a Python package
     */
    async installPackage(packageName: string, onOutput?: (line: string) => void): Promise<void> {
        if (!this.pyodide) {
            throw new Error("Pyodide not initialized")
        }

        try {
            if (onOutput) {
                onOutput(`Installing ${packageName}...`)
            }

            await this.pyodide.loadPackage("micropip")
            await this.pyodide.runPythonAsync(`
        import micropip
        await micropip.install('${packageName}')
      `)

            if (onOutput) {
                onOutput(`Successfully installed ${packageName}`)
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            if (onOutput) {
                onOutput(`Error installing ${packageName}: ${errorMessage}`)
            }
            throw error
        }
    }

    /**
     * List installed packages
     */
    async listPackages(): Promise<string[]> {
        if (!this.pyodide) {
            throw new Error("Pyodide not initialized")
        }

        const packages = await this.pyodide.runPythonAsync(`
      import micropip
      list(micropip.list())
    `)

        return packages as unknown as string[]
    }

    /**
     * Execute Python file
     */
    async executeFile(filepath: string, content: string, onOutput?: (line: string) => void): Promise<void> {
        if (!this.pyodide) {
            throw new Error("Pyodide not initialized")
        }

        // Write file to Pyodide filesystem
        this.pyodide.FS.writeFile(filepath, content)

        // Run the file
        await this.runCode(`exec(open('${filepath}').read())`, onOutput)
    }

    /**
     * Check if Pyodide is initialized
     */
    isInitialized(): boolean {
        return this.initialized
    }

    /**
     * Get Pyodide instance
     */
    getPyodide(): PyodideInterface | null {
        return this.pyodide
    }
}

export default PythonRuntime
