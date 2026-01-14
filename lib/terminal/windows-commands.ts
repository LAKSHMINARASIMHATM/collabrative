/**
 * Windows Command Handlers
 * Simulates Windows terminal commands using browser APIs
 */

import type { ParsedCommand } from './command-parser'
import type { ExecutionContext, ExecutionResult, CommandHandler } from './terminal-executor'
import helpCommand from './help-command'
import { languageCommands } from './language-commands'

/**
 * List directory contents (ls/dir)
 */
export const lsCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    try {
        // For now, use the files from the IDE context
        // In a full implementation, this would use File System Access API
        terminal.writeln('\x1b[1;36mDirectory listing:\x1b[0m')
        terminal.writeln('')

        // This is a placeholder - actual implementation would list real files
        terminal.writeln('📁 \x1b[34mdemo-project\x1b[0m')
        terminal.writeln('📄 \x1b[37mpackage.json\x1b[0m')
        terminal.writeln('📄 \x1b[37mREADME.md\x1b[0m')
        terminal.writeln('📄 \x1b[37m.gitignore\x1b[0m')

        return {
            success: true,
            output: 'Directory listed',
            exitCode: 0,
            executionTime: 0
        }
    } catch (error) {
        return {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : 'Failed to list directory',
            exitCode: 1,
            executionTime: 0
        }
    }
}

/**
 * Print working directory (pwd)
 */
export const pwdCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, workingDirectory } = ctx

    terminal.writeln(workingDirectory || '/workspace')

    return {
        success: true,
        output: workingDirectory || '/workspace',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Display file contents (cat/type)
 */
export const catCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: cat <filename>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]

    // This would actually read the file in a full implementation
    terminal.writeln(`\x1b[90m--- ${filename} ---\x1b[0m`)
    terminal.writeln('\x1b[33mFile content would appear here\x1b[0m')
    terminal.writeln('\x1b[90m(Actual file reading to be implemented)\x1b[0m')

    return {
        success: true,
        output: 'File displayed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Echo text (echo)
 */
export const echoCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx
    const text = cmd.args.join(' ')

    terminal.writeln(text)

    return {
        success: true,
        output: text,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Clear terminal (clear/cls)
 */
export const clearCommand: CommandHandler = async (cmd, ctx) => {
    // Terminal clear is handled by xterm internally
    return {
        success: true,
        output: '',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Change directory (cd)
 */
export const cdCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln(ctx.workingDirectory || '/workspace')
        return {
            success: true,
            output: ctx.workingDirectory || '/workspace',
            exitCode: 0,
            executionTime: 0
        }
    }

    const newPath = cmd.args[0]

    // Update working directory
    // In a full implementation, this would validate the path exists
    ctx.workingDirectory = newPath

    return {
        success: true,
        output: `Changed directory to ${newPath}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Make directory (mkdir)
 */
export const mkdirCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: mkdir <directory>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No directory specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const dirName = cmd.args[0]
    terminal.writeln(`\x1b[32mDirectory created: ${dirName}\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual directory creation to be implemented)\x1b[0m')

    return {
        success: true,
        output: `Created directory: ${dirName}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Remove directory (rmdir/rd)
 */
export const rmdirCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: rmdir <directory>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No directory specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const dirName = cmd.args[0]
    terminal.writeln(`\x1b[33mDirectory removed: ${dirName}\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual directory removal to be implemented)\x1b[0m')

    return {
        success: true,
        output: `Removed directory: ${dirName}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Delete file (del/rm)
 */
export const delCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: del <filename>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]
    terminal.writeln(`\x1b[33mFile deleted: ${filename}\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual file deletion to be implemented)\x1b[0m')

    return {
        success: true,
        output: `Deleted file: ${filename}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Copy file (copy/cp)
 */
export const copyCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length < 2) {
        terminal.writeln('\x1b[31mUsage: copy <source> <destination>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'Source and destination required',
            exitCode: 1,
            executionTime: 0
        }
    }

    const [source, dest] = cmd.args
    terminal.writeln(`\x1b[32mCopied: ${source} → ${dest}\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual file copy to be implemented)\x1b[0m')

    return {
        success: true,
        output: `Copied ${source} to ${dest}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Move file (move/mv)
 */
export const moveCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length < 2) {
        terminal.writeln('\x1b[31mUsage: move <source> <destination>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'Source and destination required',
            exitCode: 1,
            executionTime: 0
        }
    }

    const [source, dest] = cmd.args
    terminal.writeln(`\x1b[32mMoved: ${source} → ${dest}\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual file move to be implemented)\x1b[0m')

    return {
        success: true,
        output: `Moved ${source} to ${dest}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Display directory tree (tree)
 */
export const treeCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    terminal.writeln('\x1b[1;36mDirectory Tree:\x1b[0m')
    terminal.writeln('.')
    terminal.writeln('├── 📁 demo-project')
    terminal.writeln('│   ├── 📄 app.js')
    terminal.writeln('│   ├── 📄 styles.css')
    terminal.writeln('│   └── 📄 index.html')
    terminal.writeln('├── 📄 package.json')
    terminal.writeln('├── 📄 README.md')
    terminal.writeln('└── 📄 .gitignore')
    terminal.writeln('')
    terminal.writeln('\x1b[90m(Actual tree generation to be implemented)\x1b[0m')

    return {
        success: true,
        output: 'Tree displayed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Search in files (find/grep)
 */
export const findCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: find <pattern> [files...]\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No search pattern specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const pattern = cmd.args[0]
    terminal.writeln(`\x1b[36mSearching for: "${pattern}"\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual file search to be implemented)\x1b[0m')

    return {
        success: true,
        output: 'Search completed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Show current user (whoami)
 */
export const whoamiCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, user } = ctx

    terminal.writeln(user || 'anonymous')

    return {
        success: true,
        output: user || 'anonymous',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Create empty file (touch)
 */
export const touchCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: touch <filename>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]
    terminal.writeln(`\x1b[32mFile created: ${filename}\x1b[0m`)
    terminal.writeln('\x1b[90m(Actual file creation to be implemented)\x1b[0m')

    return {
        success: true,
        output: `Created file: ${filename}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Find command location (which)
 */
export const whichCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[31mUsage: which <command>\x1b[0m')
        return {
            success: false,
            output: '',
            error: 'No command specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    const command = cmd.args[0]
    terminal.writeln(`\x1b[36m/usr/bin/${command}\x1b[0m`)
    terminal.writeln('\x1b[90m(Simulated path)\x1b[0m')

    return {
        success: true,
        output: `/usr/bin/${command}`,
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Node.js command (node)
 */
export const nodeCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, onRunCode } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mNode.js\x1b[0m - JavaScript runtime')
        terminal.writeln('')
        terminal.writeln('Usage: node <filename.js>')
        terminal.writeln('       node -v  (show version)')
        terminal.writeln('       node -e "<code>"  (evaluate code)')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    // Handle version flag
    if (cmd.args[0] === '-v' || cmd.args[0] === '--version') {
        terminal.writeln('v20.10.0')
        return {
            success: true,
            output: 'v20.10.0',
            exitCode: 0,
            executionTime: 0
        }
    }

    // Handle eval flag
    if (cmd.args[0] === '-e') {
        const code = cmd.args.slice(1).join(' ')
        terminal.writeln(`\x1b[90mEvaluating: ${code}\x1b[0m`)
        terminal.writeln('\x1b[33mDirect code evaluation - use the Run button for full execution\x1b[0m')
        return {
            success: true,
            output: 'Eval mode',
            exitCode: 0,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]

    // Check if file has .js or .ts extension
    if (!filename.endsWith('.js') && !filename.endsWith('.ts') && !filename.endsWith('.mjs')) {
        terminal.writeln(`\x1b[31mError: File must have .js, .ts, or .mjs extension\x1b[0m`)
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

    terminal.writeln(`\x1b[33mTo run ${filename}, please use the "Run" button in the toolbar.\x1b[0m`)
    return {
        success: true,
        output: 'Use Run button',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Python command (python)
 */
export const pythonCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal, onRunCode } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mPython\x1b[0m - Programming language')
        terminal.writeln('')
        terminal.writeln('Usage: python <filename.py>')
        terminal.writeln('       python --version  (show version)')
        terminal.writeln('       python -c "<code>"  (execute code)')
        return {
            success: false,
            output: '',
            error: 'No filename specified',
            exitCode: 1,
            executionTime: 0
        }
    }

    // Handle version flag
    if (cmd.args[0] === '--version' || cmd.args[0] === '-V') {
        terminal.writeln('Python 3.11.0')
        return {
            success: true,
            output: 'Python 3.11.0',
            exitCode: 0,
            executionTime: 0
        }
    }

    // Handle code execution flag
    if (cmd.args[0] === '-c') {
        const code = cmd.args.slice(1).join(' ')
        terminal.writeln(`\x1b[90mExecuting: ${code}\x1b[0m`)
        terminal.writeln('\x1b[33mDirect code execution - use the Run button for full scripts\x1b[0m')
        return {
            success: true,
            output: 'Code executed',
            exitCode: 0,
            executionTime: 0
        }
    }

    const filename = cmd.args[0]

    // Check if file has .py extension
    if (!filename.endsWith('.py')) {
        terminal.writeln(`\x1b[31mError: File must have .py extension\x1b[0m`)
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

    terminal.writeln(`\x1b[33mTo run ${filename}, please use the "Run" button in the toolbar.\x1b[0m`)
    return {
        success: true,
        output: 'Use Run button',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * NPM command (npm)
 */
export const npmCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mnpm\x1b[0m - Node Package Manager')
        terminal.writeln('')
        terminal.writeln('Usage: npm <command>')
        terminal.writeln('')
        terminal.writeln('Common commands:')
        terminal.writeln('  install, i    Install packages')
        terminal.writeln('  run           Run scripts')
        terminal.writeln('  init          Initialize package.json')
        terminal.writeln('  test          Run tests')
        terminal.writeln('  start         Start application')
        return {
            success: true,
            output: 'npm help',
            exitCode: 0,
            executionTime: 0
        }
    }

    const subcommand = cmd.args[0]

    switch (subcommand) {
        case 'install':
        case 'i':
            const packages = cmd.args.slice(1)
            if (packages.length > 0) {
                terminal.writeln(`\x1b[90mnpm install ${packages.join(' ')}\x1b[0m`)
                terminal.writeln('')
                for (const pkg of packages) {
                    terminal.writeln(`\x1b[32m✓\x1b[0m ${pkg}`)
                }
                terminal.writeln('')
                terminal.writeln(`\x1b[32madded ${packages.length} package${packages.length > 1 ? 's' : ''}\x1b[0m`)
            } else {
                terminal.writeln('\x1b[90mInstalling dependencies...\x1b[0m')
                terminal.writeln('\x1b[32m✓\x1b[0m All dependencies installed')
            }
            terminal.writeln('\x1b[90m(Simulated - actual package installation not available in browser)\x1b[0m')
            break

        case 'run':
            const script = cmd.args[1]
            if (script) {
                terminal.writeln(`\x1b[90m> npm run ${script}\x1b[0m`)
                terminal.writeln(`\x1b[33mScript "${script}" would run here\x1b[0m`)
                terminal.writeln('\x1b[90m(Use the IDE Run button for actual script execution)\x1b[0m')
            } else {
                terminal.writeln('\x1b[31mError: Missing script name\x1b[0m')
            }
            break

        case 'init':
            terminal.writeln('\x1b[90mInitializing package.json...\x1b[0m')
            terminal.writeln('\x1b[32m✓\x1b[0m package.json created')
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        case 'start':
            terminal.writeln('\x1b[90m> npm start\x1b[0m')
            terminal.writeln('\x1b[33mStarting application...\x1b[0m')
            terminal.writeln('\x1b[90m(Use the IDE Run button for actual execution)\x1b[0m')
            break

        case 'test':
            terminal.writeln('\x1b[90m> npm test\x1b[0m')
            terminal.writeln('\x1b[32m✓\x1b[0m Tests would run here')
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        default:
            terminal.writeln(`\x1b[33mCommand: npm ${subcommand}\x1b[0m`)
            terminal.writeln('\x1b[90m(Command simulated)\x1b[0m')
    }

    return {
        success: true,
        output: 'npm command executed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * PNPM command (pnpm)
 */
export const pnpmCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mpnpm\x1b[0m - Fast, disk space efficient package manager')
        terminal.writeln('')
        terminal.writeln('Usage: pnpm <command>')
        return {
            success: true,
            output: 'pnpm help',
            exitCode: 0,
            executionTime: 0
        }
    }

    const subcommand = cmd.args[0]

    switch (subcommand) {
        case 'install':
        case 'i':
        case 'add':
            const packages = cmd.args.slice(1)
            if (packages.length > 0) {
                terminal.writeln(`\x1b[90mPackages: ${packages.join(', ')}\x1b[0m`)
                terminal.writeln('\x1b[32m✓\x1b[0m Packages installed')
            } else {
                terminal.writeln('\x1b[90mResolving dependencies...\x1b[0m')
                terminal.writeln('\x1b[32m✓\x1b[0m Dependencies installed')
            }
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        default:
            terminal.writeln(`\x1b[33mpnpm ${subcommand}\x1b[0m`)
            terminal.writeln('\x1b[90m(Command simulated)\x1b[0m')
    }

    return {
        success: true,
        output: 'pnpm command executed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Yarn command (yarn)
 */
export const yarnCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36myarn\x1b[0m - Package manager')
        terminal.writeln('')
        terminal.writeln('Usage: yarn <command>')
        return {
            success: true,
            output: 'yarn help',
            exitCode: 0,
            executionTime: 0
        }
    }

    const subcommand = cmd.args[0]

    switch (subcommand) {
        case 'install':
        case 'add':
            const packages = cmd.args.slice(1)
            if (packages.length > 0) {
                terminal.writeln(`\x1b[90m[1/4] Resolving packages...\x1b[0m`)
                terminal.writeln(`\x1b[90m[2/4] Fetching packages...\x1b[0m`)
                terminal.writeln(`\x1b[90m[3/4] Linking dependencies...\x1b[0m`)
                terminal.writeln(`\x1b[90m[4/4] Building fresh packages...\x1b[0m`)
                terminal.writeln(`\x1b[32m✓\x1b[0m Added ${packages.join(', ')}`)
            } else {
                terminal.writeln('\x1b[32m✓\x1b[0m Dependencies installed')
            }
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        default:
            terminal.writeln(`\x1b[33myarn ${subcommand}\x1b[0m`)
            terminal.writeln('\x1b[90m(Command simulated)\x1b[0m')
    }

    return {
        success: true,
        output: 'yarn command executed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * PIP command (pip)
 */
export const pipCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mpip\x1b[0m - Python Package Installer')
        terminal.writeln('')
        terminal.writeln('Usage: pip <command>')
        terminal.writeln('')
        terminal.writeln('Common commands:')
        terminal.writeln('  install       Install packages')
        terminal.writeln('  uninstall     Uninstall packages')
        terminal.writeln('  list          List installed packages')
        terminal.writeln('  freeze        Output installed packages')
        return {
            success: true,
            output: 'pip help',
            exitCode: 0,
            executionTime: 0
        }
    }

    const subcommand = cmd.args[0]

    switch (subcommand) {
        case 'install':
            const packages = cmd.args.slice(1)
            if (packages.length > 0) {
                terminal.writeln(`\x1b[90mCollecting ${packages.join(', ')}\x1b[0m`)
                terminal.writeln('\x1b[90m  Downloading...\x1b[0m')
                terminal.writeln('\x1b[90m  Installing...\x1b[0m')
                terminal.writeln(`\x1b[32mSuccessfully installed ${packages.join(', ')}\x1b[0m`)
            } else {
                terminal.writeln('\x1b[31mERROR: You must give at least one requirement to install\x1b[0m')
            }
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        case 'list':
            terminal.writeln('\x1b[90mPackage    Version\x1b[0m')
            terminal.writeln('\x1b[90m---------- -------\x1b[0m')
            terminal.writeln('pip        23.0.1')
            terminal.writeln('setuptools 65.5.0')
            terminal.writeln('\x1b[90m(Simulated list)\x1b[0m')
            break

        case 'freeze':
            terminal.writeln('pip==23.0.1')
            terminal.writeln('setuptools==65.5.0')
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        default:
            terminal.writeln(`\x1b[33mpip ${subcommand}\x1b[0m`)
            terminal.writeln('\x1b[90m(Command simulated)\x1b[0m')
    }

    return {
        success: true,
        output: 'pip command executed',
        exitCode: 0,
        executionTime: 0
    }
}

/**
 * Git command (git)
 */
export const gitCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    if (cmd.args.length === 0) {
        terminal.writeln('\x1b[36mgit\x1b[0m - Version control system')
        terminal.writeln('')
        terminal.writeln('Usage: git <command>')
        return {
            success: true,
            output: 'git help',
            exitCode: 0,
            executionTime: 0
        }
    }

    const subcommand = cmd.args[0]

    switch (subcommand) {
        case 'status':
            terminal.writeln('\x1b[32mOn branch main\x1b[0m')
            terminal.writeln('Your branch is up to date with \'origin/main\'.')
            terminal.writeln('')
            terminal.writeln('nothing to commit, working tree clean')
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        case 'init':
            terminal.writeln('\x1b[90mInitialized empty Git repository\x1b[0m')
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        case 'add':
            const files = cmd.args.slice(1).join(', ') || 'files'
            terminal.writeln(`\x1b[32m✓\x1b[0m Added ${files}`)
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        case 'commit':
            terminal.writeln('\x1b[90m[main abc1234] Commit message\x1b[0m')
            terminal.writeln(' 1 file changed, 10 insertions(+)')
            terminal.writeln('\x1b[90m(Simulated)\x1b[0m')
            break

        default:
            terminal.writeln(`\x1b[33mgit ${subcommand}\x1b[0m`)
            terminal.writeln('\x1b[90m(Command simulated)\x1b[0m')
    }

    return {
        success: true,
        output: 'git command executed',
        exitCode: 0,
        executionTime: 0
    }
}

// Export all command handlers
export const windowsCommands = {
    help: helpCommand,
    ls: lsCommand,
    dir: lsCommand,
    pwd: pwdCommand,
    cat: catCommand,
    type: catCommand,
    echo: echoCommand,
    clear: clearCommand,
    cls: clearCommand,
    cd: cdCommand,
    mkdir: mkdirCommand,
    rmdir: rmdirCommand,
    rd: rmdirCommand,
    del: delCommand,
    rm: delCommand,
    copy: copyCommand,
    cp: copyCommand,
    move: moveCommand,
    mv: moveCommand,
    tree: treeCommand,
    find: findCommand,
    grep: findCommand,
    whoami: whoamiCommand,
    touch: touchCommand,
    which: whichCommand,
    node: nodeCommand,
    python: pythonCommand,
    py: pythonCommand,
    npm: npmCommand,
    pnpm: pnpmCommand,
    yarn: yarnCommand,
    pip: pipCommand,
    pip3: pipCommand,
    git: gitCommand,
    ...languageCommands, // Add java, g++, gcc, go
}

export default windowsCommands
