/**
 * Help Command Handler
 * Displays available commands and usage information
 */

import type { CommandHandler } from './terminal-executor'

export const helpCommand: CommandHandler = async (cmd, ctx) => {
    const { terminal } = ctx

    terminal.writeln('\x1b[1;36m╔═══════════════════════════════════════════════════════╗\x1b[0m')
    terminal.writeln('\x1b[1;36m║         CodeSync IDE Terminal - Command List          ║\x1b[0m')
    terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════════════════════╝\x1b[0m')
    terminal.writeln('')

    terminal.writeln('\x1b[1;33m📁 File & Directory Commands:\x1b[0m')
    terminal.writeln('  \x1b[32mls, dir\x1b[0m           List directory contents')
    terminal.writeln('  \x1b[32mcd <dir>\x1b[0m          Change directory')
    terminal.writeln('  \x1b[32mpwd\x1b[0m               Print working directory')
    terminal.writeln('  \x1b[32mmkdir <dir>\x1b[0m       Create directory')
    terminal.writeln('  \x1b[32mrmdir <dir>\x1b[0m       Remove directory')
    terminal.writeln('  \x1b[32mtouch <file>\x1b[0m      Create empty file')
    terminal.writeln('  \x1b[32mtree\x1b[0m              Display directory tree')
    terminal.writeln('')

    terminal.writeln('\x1b[1;33m📄 File Operations:\x1b[0m')
    terminal.writeln('  \x1b[32mcat, type <file>\x1b[0m  Display file contents')
    terminal.writeln('  \x1b[32mcopy, cp <src> <dst>\x1b[0m  Copy file')
    terminal.writeln('  \x1b[32mmove, mv <src> <dst>\x1b[0m  Move file')
    terminal.writeln('  \x1b[32mdel, rm <file>\x1b[0m    Delete file')
    terminal.writeln('  \x1b[32mfind, grep <pattern>\x1b[0m  Search in files')
    terminal.writeln('')

    terminal.writeln('\x1b[1;33m▶️  Code Execution:\x1b[0m')
    terminal.writeln('  \x1b[32mnode <file.js>\x1b[0m    Run JavaScript file')
    terminal.writeln('  \x1b[32mpython <file.py>\x1b[0m  Run Python file')
    terminal.writeln('  \x1b[32mnpm <command>\x1b[0m     Run npm commands (coming soon)')
    terminal.writeln('')

    terminal.writeln('\x1b[1;33m🛠️  Utilities:\x1b[0m')
    terminal.writeln('  \x1b[32mecho <text>\x1b[0m       Print text')
    terminal.writeln('  \x1b[32mclear, cls\x1b[0m        Clear terminal')
    terminal.writeln('  \x1b[32mwhoami\x1b[0m            Show current user')
    terminal.writeln('  \x1b[32mwhich <cmd>\x1b[0m       Find command location')
    terminal.writeln('  \x1b[32mhelp\x1b[0m              Show this help message')
    terminal.writeln('')

    terminal.writeln('\x1b[1;33m⌨️  Keyboard Shortcuts:\x1b[0m')
    terminal.writeln('  \x1b[36mCtrl+L\x1b[0m            Clear terminal')
    terminal.writeln('  \x1b[36mCtrl+C\x1b[0m            Cancel current command')
    terminal.writeln('  \x1b[36mBackspace\x1b[0m         Delete character')
    terminal.writeln('')

    terminal.writeln('\x1b[90mTip: Commands support flags and arguments\x1b[0m')
    terminal.writeln('\x1b[90mExample: ls -l, cat file.txt, echo "Hello World"\x1b[0m')
    terminal.writeln('')

    return {
        success: true,
        output: 'Help displayed',
        exitCode: 0,
        executionTime: 0
    }
}

export default helpCommand
