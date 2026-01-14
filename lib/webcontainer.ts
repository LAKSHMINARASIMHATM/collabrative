import { WebContainer } from "@webcontainer/api"
import type { FileNode } from "@/components/ide/ide-workspace"

export class WebContainerManager {
    private static instance: WebContainer | null = null
    private static booting = false

    static async getInstance(): Promise<WebContainer> {
        if (this.instance) {
            return this.instance
        }

        if (this.booting) {
            // Wait for the current boot to complete
            while (this.booting) {
                await new Promise((resolve) => setTimeout(resolve, 100))
            }
            return this.instance!
        }

        this.booting = true
        try {
            this.instance = await WebContainer.boot()
            await this.setupDefaultEnvironment()
            return this.instance
        } finally {
            this.booting = false
        }
    }

    private static async setupDefaultEnvironment() {
        if (!this.instance) return

        // Create a basic package.json for the container
        await this.instance.fs.writeFile(
            "/package.json",
            JSON.stringify({
                name: "codesync-runtime",
                type: "module",
                scripts: {
                    dev: "node index.js",
                },
            }, null, 2)
        )
    }

    static async syncFiles(files: FileNode[]) {
        const instance = await this.getInstance()

        // Helper to recursively write files
        const writeFiles = async (nodes: FileNode[], basePath = "") => {
            for (const node of nodes) {
                const path = `${basePath}/${node.name}`

                if (node.type === "folder") {
                    // Create directory
                    try {
                        await instance.fs.mkdir(path, { recursive: true })
                    } catch (error) {
                        // Directory might already exist
                    }

                    // Recursively write children
                    if (node.children) {
                        await writeFiles(node.children, path)
                    }
                } else {
                    // Write file
                    await instance.fs.writeFile(path, node.content || "")
                }
            }
        }

        await writeFiles(files)
    }

    static async runCommand(command: string): Promise<{
        output: AsyncIterable<string>
        exit: Promise<number>
    }> {
        const instance = await this.getInstance()
        const process = await instance.spawn("sh", ["-c", command])

        // Combine stdout and stderr
        const output = (async function* () {
            const decoder = new TextDecoder()

            // Read stdout
            const stdoutReader = process.output.getReader()
            const stderrReader = (process as any).error ? (process as any).error.getReader() : null

            try {
                while (true) {
                    const [stdoutResult, stderrResult] = await Promise.all([
                        stdoutReader.read(),
                        stderrReader ? stderrReader.read() : Promise.resolve({ done: true, value: undefined }),
                    ])

                    if (stdoutResult.value) {
                        yield decoder.decode(stdoutResult.value)
                    }

                    if (stderrResult.value) {
                        yield `\x1b[31m${decoder.decode(stderrResult.value)}\x1b[0m` // Red color for errors
                    }

                    if (stdoutResult.done && stderrResult.done) {
                        break
                    }
                }
            } finally {
                stdoutReader.releaseLock()
                stderrReader?.releaseLock()
            }
        })()

        return {
            output,
            exit: process.exit,
        }
    }

    static async installDependencies(onOutput?: (line: string) => void): Promise<boolean> {
        const instance = await this.getInstance()

        try {
            // Run npm install
            const installProcess = await instance.spawn("npm", ["install"])

            if (onOutput) {
                const reader = installProcess.output.getReader()
                const decoder = new TextDecoder()

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    if (typeof value === 'string') {
                        onOutput(value)
                    } else {
                        // value is Uint8Array
                        const text = decoder.decode(value, { stream: true })
                        onOutput(text)
                    }
                }
            }

            const exitCode = await installProcess.exit
            return exitCode === 0
        } catch (error) {
            console.error("Failed to install dependencies:", error)
            return false
        }
    }

    static async startDevServer(onOutput?: (line: string) => void): Promise<{ url: string; stop: () => void }> {
        const instance = await this.getInstance()

        // Start the dev server
        const serverProcess = await instance.spawn("npm", ["run", "dev"])

        if (onOutput) {
            const reader = serverProcess.output.getReader()
            const decoder = new TextDecoder()

                // Read output in the background
                ; (async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read()
                            if (done) break

                            if (typeof value === 'string') {
                                onOutput(value)
                            } else {
                                const text = decoder.decode(value)
                                onOutput(text)
                            }
                        }
                    } catch (error) {
                        console.error("Error reading server output:", error)
                    }
                })()
        }

        // Wait for server to be ready
        await instance.on("server-ready", (port, url) => {
            console.log(`Server ready on port ${port}: ${url}`)
        })

        const url = `http://localhost:${await this.waitForPort()}`

        return {
            url,
            stop: () => {
                serverProcess.kill()
            },
        }
    }

    private static async waitForPort(timeout = 10000): Promise<number> {
        const instance = await this.getInstance()

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error("Timeout waiting for server"))
            }, timeout)

            instance.on("server-ready", (port) => {
                clearTimeout(timeoutId)
                resolve(port)
            })
        })
    }

    static async executeFile(filePath: string, onOutput?: (line: string) => void): Promise<number> {
        const instance = await this.getInstance()

        const process = await instance.spawn("node", [filePath])

        if (onOutput) {
            const stdoutReader = process.output.getReader()
            const stderrReader = (process as any).error.getReader()
            const decoder = new TextDecoder()

            // Read both streams
            const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, isError = false) => {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const text = decoder.decode(value)
                    if (isError) {
                        onOutput(`\x1b[31m${text}\x1b[0m`) // Red for errors
                    } else {
                        onOutput(text)
                    }
                }
            }

            await Promise.all([
                readStream(stdoutReader as any),
                readStream(stderrReader as any, true),
            ])
        }

        return await process.exit
    }
}

export default WebContainerManager
