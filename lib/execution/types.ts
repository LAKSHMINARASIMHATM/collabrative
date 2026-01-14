"use client"

/**
 * Type Definitions for Code Execution System
 */

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout'

export type SupportedLanguage =
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'java'
    | 'cpp'
    | 'c'
    | 'go'
    | 'rust'
    | 'php'
    | 'ruby'
    | 'swift'
    | 'kotlin'
    | 'csharp'
    | 'scala'
    | 'html'
    | 'css'
    | 'r'
    | 'sql'

export type RuntimeType = 'browser' | 'server'

export interface ExecutionOptions {
    timeout?: number // milliseconds, default: 30000
    input?: string // stdin input
    args?: string[] // command line arguments
    env?: Record<string, string> // environment variables
    memoryLimit?: number // bytes
    debug?: boolean // enable debug mode
    breakpoints?: number[] // lines to break on
    onDebugEvent?: (event: DebugEvent) => void // callback for debug events
}

export interface ExecutionResult {
    status: ExecutionStatus
    stdout: string
    stderr: string
    output: string // combined stdout + stderr
    exitCode: number
    executionTime: number // milliseconds
    memory?: number // bytes used
    error?: string
}

export type DebugEventType = 'breakpoint' | 'step' | 'log' | 'variable'

export interface DebugEvent {
    type: DebugEventType
    line?: number
    variables?: Record<string, any>
    message?: string
}


export interface LanguageConfig {
    id: string
    name: string
    extension: string
    runtimeType: RuntimeType
    judge0Id?: number // Judge0 language ID
    icon?: string
    version?: string
    defaultCode?: string
}

export interface Runtime {
    readonly language: SupportedLanguage
    readonly type: RuntimeType

    initialize(): Promise<void>
    execute(code: string, options?: ExecutionOptions): Promise<ExecutionResult>
    stop(): void
    isReady(): boolean
    cleanup(): void
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
    javascript: {
        id: 'javascript',
        name: 'JavaScript',
        extension: '.js',
        runtimeType: 'browser',
        icon: '📜',
        version: 'ES2022',
        defaultCode: 'console.log("Hello, World!");',
    },
    typescript: {
        id: 'typescript',
        name: 'TypeScript',
        extension: '.ts',
        runtimeType: 'browser',
        icon: '📘',
        version: '5.0',
        defaultCode: 'console.log("Hello, TypeScript!");',
    },
    python: {
        id: 'python',
        name: 'Python',
        extension: '.py',
        runtimeType: 'browser',
        icon: '🐍',
        version: '3.10',
        defaultCode: 'print("Hello, World!")',
    },
    java: {
        id: 'java',
        name: 'Java',
        extension: '.java',
        runtimeType: 'server',
        judge0Id: 62, // Java (OpenJDK 13.0.1)
        icon: '☕',
        defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    },
    cpp: {
        id: 'cpp',
        name: 'C++',
        extension: '.cpp',
        runtimeType: 'server',
        judge0Id: 54, // C++ (GCC 9.2.0)
        icon: '⚙️',
        defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
    },
    c: {
        id: 'c',
        name: 'C',
        extension: '.c',
        runtimeType: 'server',
        judge0Id: 50, // C (GCC 9.2.0)
        icon: '🔧',
        defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    },
    go: {
        id: 'go',
        name: 'Go',
        extension: '.go',
        runtimeType: 'server',
        judge0Id: 60, // Go (1.13.5)
        icon: '🐹',
        defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
    },
    rust: {
        id: 'rust',
        name: 'Rust',
        extension: '.rs',
        runtimeType: 'server',
        judge0Id: 73, // Rust (1.40.0)
        icon: '🦀',
        defaultCode: 'fn main() {\n    println!("Hello, World!");\n}',
    },
    php: {
        id: 'php',
        name: 'PHP',
        extension: '.php',
        runtimeType: 'server',
        judge0Id: 68, // PHP (7.4.1)
        icon: '🐘',
        defaultCode: '<?php\necho "Hello, World!\\n";\n?>',
    },
    ruby: {
        id: 'ruby',
        name: 'Ruby',
        extension: '.rb',
        runtimeType: 'server',
        judge0Id: 72, // Ruby (2.7.0)
        icon: '💎',
        defaultCode: 'puts "Hello, World!"',
    },
    swift: {
        id: 'swift',
        name: 'Swift',
        extension: '.swift',
        runtimeType: 'server',
        judge0Id: 83, // Swift (5.2.3)
        icon: '🦅',
        defaultCode: 'print("Hello, World!")',
    },
    kotlin: {
        id: 'kotlin',
        name: 'Kotlin',
        extension: '.kt',
        runtimeType: 'server',
        judge0Id: 78, // Kotlin (1.3.70)
        icon: '🎯',
        defaultCode: 'fun main() {\n    println("Hello, World!")\n}',
    },
    csharp: {
        id: 'csharp',
        name: 'C#',
        extension: '.cs',
        runtimeType: 'server',
        judge0Id: 51, // C# (Mono 6.6.0.161)
        icon: '#️⃣',
        defaultCode: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
    },
    r: {
        id: 'r',
        name: 'R',
        extension: '.r',
        runtimeType: 'server',
        judge0Id: 80, // R (4.0.0)
        icon: '📊',
        defaultCode: 'print("Hello, World!")',
    },
    sql: {
        id: 'sql',
        name: 'SQL',
        extension: '.sql',
        runtimeType: 'server',
        judge0Id: 82, // SQL (SQLite 3.27.2)
        icon: '🗄️',
        defaultCode: 'SELECT \'Hello, World!\';',
    },
    scala: {
        id: 'scala',
        name: 'Scala',
        extension: '.scala',
        runtimeType: 'server',
        judge0Id: 81,
        icon: '🔺',
        defaultCode: 'object Main extends App {\n  println("Hello, World!")\n}',
    },
    html: {
        id: 'html',
        name: 'HTML',
        extension: '.html',
        runtimeType: 'browser',
        icon: '🌐',
        version: 'HTML5',
        defaultCode: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>',
    },
    css: {
        id: 'css',
        name: 'CSS',
        extension: '.css',
        runtimeType: 'browser',
        icon: '🎨',
        version: 'CSS3',
        defaultCode: 'body {\n  font-family: Arial, sans-serif;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}',
    },
}

export function detectLanguage(filename: string): SupportedLanguage {
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase()

    for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
        if (config.extension === extension) {
            return lang as SupportedLanguage
        }
    }

    return 'javascript' // default
}

export function getLanguageConfig(language: SupportedLanguage): LanguageConfig {
    return LANGUAGE_CONFIGS[language]
}
