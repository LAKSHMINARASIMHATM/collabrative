/**
 * Additional Language Execution Commands
 */

import type { CommandHandler } from './terminal-executor'

/**
 * Java command (java)
 */
export const javaCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, onRunCode } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mJava\x1b[0m - Programming language')
        terminal.writeln('')
        terminal.writeln('Usage: java <filename.java>')
        terminal.writeln('       java -version  (show version)')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    if (cmd.args[0] === '-version' || cmd.args[0] === '--version') {
        terminal.writeln('java version "17.0.2" 2022-01-18 LTS')
        terminal.writeln('Java(TM) SE Runtime Environment (build 17.0.2+8-LTS-86)')
        return {
            success: true,
            output: 'Java 17',
            exitCode: 0,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]

    if (!filename.endsWith('.java')) {
        terminal.writeln(`\x1b[31mError: File must have .java extension\x1b[0m`)
        return {
            success: false,
            output: '',
            error: 'Invalid file extension',
            exitCode: 1,
            executionTime: 0
        }
    }

    if (onRunCode) {
        terminal.writeln(`\x1b[36m▶\x1b[0m Compiling and running ${filename}...`)
        terminal.writeln('')
        try {
            await onRunCode(filename)
            return {
                success: true,
                output: 'Executed',
                exitCode: 0,
                executionTime: 0
            }
        } catch (error) {
            terminal.writeln(`\x1b[31m✗ Execution failed\x1b[0m`)
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Execution failed',
                exitCode: 1,
                executionTime: 0
            }
        }
    }

    terminal.writeln(`\x1b[33mTo run ${filename}, use the Run button\x1b[0m`)
    return {
        success: true,
        output: 'Use Run button',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * C++ command (g++)
 */
export const cppCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, onRunCode } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mg++\x1b[0m - C++ compiler')
        terminal.writeln('')
        terminal.writeln('Usage: g++ <filename.cpp>')
        terminal.writeln('       g++ --version  (show version)')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    if (cmd.args[0] === '--version') {
        terminal.writeln('g++ (GCC) 11.2.0')
        return {
            success: true,
            output: 'g++ 11.2.0',
            exitCode: 0,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]

    if (!filename.endsWith('.cpp') && !filename.endsWith('.cc') && !filename.endsWith('.cxx')) {
        terminal.writeln(`\x1b[31mError: File must have .cpp, .cc, or .cxx extension\x1b[0m`)
        return {
            success: false,
            output: '',
            error: 'Invalid file extension',
            exitCode: 1,
            executionTime: 0
        }
    }

    if (onRunCode) {
        terminal.writeln(`\x1b[36m▶\x1b[0m Compiling and running ${filename}...`)
        terminal.writeln('')
        try {
            await onRunCode(filename)
            return {
                success: true,
                output: 'Executed',
                exitCode: 0,
                executionTime: 0
            }
        } catch (error) {
            terminal.writeln(`\x1b[31m✗ Compilation/execution failed\x1b[0m`)
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Execution failed',
                exitCode: 1,
                executionTime: 0
            }
        }
    }

    terminal.writeln(`\x1b[33mTo compile and run ${filename}, use the Run button\x1b[0m`)
    return {
        success: true,
        output: 'Use Run button',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Go command (go)
 */
export const goCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, onRunCode } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mGo\x1b[0m - Programming language')
        terminal.writeln('')
        terminal.writeln('Usage: go run <filename.go>')
        terminal.writeln('       go version  (show version)')
        return {
            success: false,
            output: '',
            error: 'No subcommand specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const subcommand = cmd.args[0]

    if (subcommand === 'version') {
        terminal.writeln('go version go1.21.0 windows/amd64')
        return {
            success: true,
            output: 'go1.21.0',
            exitCode: 0,
            executionTime: 0
        }
    }

    if (subcommand === 'run') {
        const filename = cmd.args[1]

        if (!filename) {
            terminal.writeln('\x1b[31mError: No file specified\x1b[0m')
            return {
                success: false,
                output: '',
                error: 'No file specified',
                exitCode: 1,
                executionTime: 0
            }
        }

        if (!filename.endsWith('.go')) {
            terminal.writeln(`\x1b[31mError: File must have .go extension\x1b[0m`)
            return {
                success: false,
                output: '',
                error: 'Invalid file extension',
                exitCode: 1,
                executionTime: 0
            }
        }

        if (onRunCode) {
            terminal.writeln(`\x1b[36m▶\x1b[0m Running ${filename}...`)
            terminal.writeln('')
            try {
                await onRunCode(filename)
                return {
                    success: true,
                    output: 'Executed',
                    exitCode: 0,
                    executionTime: 0
                }
            } catch (error) {
                terminal.writeln(`\x1b[31m✗ Execution failed\x1b[0m`)
                return {
                    success: false,
                    output: '',
                    error: error instanceof Error ? error.message : 'Execution failed',
                    exitCode: 1,
                    executionTime: 0
                }
            }
        }

        terminal.writeln(`\x1b[33mTo run ${filename}, use the Run button\x1b[0m`)
        return {
            success: true,
            output: 'Use Run button',
            exitCode: 0,
            executionTime: 0
        }
    }

    terminal.writeln(`\x1b[33mgo ${subcommand}\x1b[0m`)
    terminal.writeln('\x1b[90m(Command simulated)\x1b[0m')
    return {
        success: true,
        output: 'Command executed',
        exitCode: 0,
        executionTime: 0
    }
}

export const languageCommands = {
    java: javaCommand,
    'g++': cppCommand,
    gcc: cppCommand,
    go: goCommand,
}

export default languageCommands
