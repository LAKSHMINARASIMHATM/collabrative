/**
 * Terminal Command Parser
 * Parses terminal commands into structured format for execution
 */

export interface ParsedCommand {
    command: string
    args: string[]
    flags: Map<string, string | boolean>
    rawInput: string
    pipes: ParsedCommand[]
    redirects: {
        stdout?: string
        stderr?: string
        stdin?: string
    }
}

export class CommandParser {
    /**
     * Parse a command string into structured format
     */
    parse(input: string): ParsedCommand {
        const trimmed = input.trim()

        // Handle pipes
        if (trimmed.includes('|')) {
            return this.parsePipedCommands(trimmed)
        }

        // Handle redirects
        const { command: cleanCommand, redirects } = this.extractRedirects(trimmed)

        // Split into tokens
        const tokens = this.tokenize(cleanCommand)

        if (tokens.length === 0) {
            return {
                command: '',
                args: [],
                flags: new Map(),
                rawInput: input,
                pipes: [],
                redirects: {}
            }
        }

        const command = tokens[0]
        const { args, flags } = this.parseArgsAndFlags(tokens.slice(1))

        return {
            command,
            args,
            flags,
            rawInput: input,
            pipes: [],
            redirects
        }
    }

    /**
     * Parse piped commands (cmd1 | cmd2 | cmd3)
     */
    private parsePipedCommands(input: string): ParsedCommand {
        const commands = input.split('|').map(cmd => cmd.trim())
        const mainCommand = this.parse(commands[0])

        if (commands.length > 1) {
            mainCommand.pipes = commands.slice(1).map(cmd => this.parse(cmd))
        }

        return mainCommand
    }

    /**
     * Extract redirect operators (>, >>, <, 2>)
     */
    private extractRedirects(input: string): { command: string; redirects: ParsedCommand['redirects'] } {
        const redirects: ParsedCommand['redirects'] = {}
        let command = input

        // Output redirect (>)
        const stdoutMatch = command.match(/\s+>\s+(.+?)(?:\s|$)/)
        if (stdoutMatch) {
            redirects.stdout = stdoutMatch[1]
            command = command.replace(stdoutMatch[0], ' ')
        }

        // Error redirect (2>)
        const stderrMatch = command.match(/\s+2>\s+(.+?)(?:\s|$)/)
        if (stderrMatch) {
            redirects.stderr = stderrMatch[1]
            command = command.replace(stderrMatch[0], ' ')
        }

        // Input redirect (<)
        const stdinMatch = command.match(/\s+<\s+(.+?)(?:\s|$)/)
        if (stdinMatch) {
            redirects.stdin = stdinMatch[1]
            command = command.replace(stdinMatch[0], ' ')
        }

        return { command: command.trim(), redirects }
    }

    /**
     * Tokenize command string respecting quotes
     */
    private tokenize(input: string): string[] {
        const tokens: string[] = []
        let current = ''
        let inQuotes = false
        let quoteChar = ''

        for (let i = 0; i < input.length; i++) {
            const char = input[i]

            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true
                quoteChar = char
                continue
            }

            if (char === quoteChar && inQuotes) {
                inQuotes = false
                quoteChar = ''
                continue
            }

            if (char === ' ' && !inQuotes) {
                if (current) {
                    tokens.push(current)
                    current = ''
                }
                continue
            }

            current += char
        }

        if (current) {
            tokens.push(current)
        }

        return tokens
    }

    /**
     * Parse arguments and flags from tokens
     */
    private parseArgsAndFlags(tokens: string[]): { args: string[]; flags: Map<string, string | boolean> } {
        const args: string[] = []
        const flags = new Map<string, string | boolean>()

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]

            // Long flag (--flag or --flag=value)
            if (token.startsWith('--')) {
                const [flagName, flagValue] = token.slice(2).split('=')
                flags.set(flagName, flagValue || true)
                continue
            }

            // Short flag (-f or -f value)
            if (token.startsWith('-') && token.length > 1) {
                const flagName = token.slice(1)

                // Check if next token is the value
                if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
                    flags.set(flagName, tokens[i + 1])
                    i++ // Skip next token
                } else {
                    flags.set(flagName, true)
                }
                continue
            }

            // Regular argument
            args.push(token)
        }

        return { args, flags }
    }

    /**
     * Expand environment variables in command
     */
    expandVariables(input: string, env: Map<string, string>): string {
        return input.replace(/\$(\w+)|\$\{(\w+)\}/g, (match, var1, var2) => {
            const varName = var1 || var2
            return env.get(varName) || match
        })
    }

    /**
     * Expand wildcards (*, ?, [...])
     */
    expandWildcards(pattern: string, files: string[]): string[] {
        const regex = this.wildcardToRegex(pattern)
        return files.filter(file => regex.test(file))
    }

    private wildcardToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')

        return new RegExp(`^${escaped}$`, 'i')
    }
}

export default CommandParser
