/**
 * Extension API for CodeSync IDE
 * Allows third-party extensions to add functionality
 */

export interface Extension {
    id: string
    name: string
    version: string
    description?: string
    author?: string
    activate(context: ExtensionContext): void | Promise<void>
    deactivate?(): void | Promise<void>
}

export interface ExtensionContext {
    subscriptions: Disposable[]
    workspace: WorkspaceAPI
    languages: LanguagesAPI
    window: WindowAPI
    commands: CommandsAPI
}

export interface Disposable {
    dispose(): void
}

export interface WorkspaceAPI {
    /**
     * Get all open text documents
     */
    getTextDocuments(): TextDocument[]

    /**
     * Get workspace root path
     */
    getWorkspaceFolder(): string | undefined

    /**
     * Read file content
     */
    readFile(path: string): Promise<string>

    /**
     * Write file content
     */
    writeFile(path: string, content: string): Promise<void>

    /**
     * Watch for file changes
     */
    onDidChangeTextDocument(callback: (document: TextDocument) => void): Disposable
}

export interface TextDocument {
    uri: string
    languageId: string
    version: number
    getText(): string
    getLine(line: number): string
    lineCount: number
}

export interface LanguagesAPI {
    /**
     * Register completion provider
     */
    registerCompletionProvider(
        language: string,
        provider: CompletionProvider
    ): Disposable

    /**
     * Register hover provider
     */
    registerHoverProvider(
        language: string,
        provider: HoverProvider
    ): Disposable

    /**
     * Register code action provider
     */
    registerCodeActionProvider(
        language: string,
        provider: CodeActionProvider
    ): Disposable
}

export interface CompletionProvider {
    provideCompletionItems(
        document: TextDocument,
        position: Position
    ): CompletionItem[] | Promise<CompletionItem[]>
}

export interface CompletionItem {
    label: string
    kind: CompletionItemKind
    detail?: string
    documentation?: string
    insertText?: string
}

export enum CompletionItemKind {
    Text = 0,
    Method = 1,
    Function = 2,
    Constructor = 3,
    Field = 4,
    Variable = 5,
    Class = 6,
    Interface = 7,
    Module = 8,
    Property = 9,
    Keyword = 14,
    Snippet = 15,
}

export interface HoverProvider {
    provideHover(
        document: TextDocument,
        position: Position
    ): Hover | Promise<Hover> | undefined
}

export interface Hover {
    contents: string | string[]
    range?: Range
}

export interface CodeActionProvider {
    provideCodeActions(
        document: TextDocument,
        range: Range
    ): CodeAction[] | Promise<CodeAction[]>
}

export interface CodeAction {
    title: string
    kind?: string
    edit?: WorkspaceEdit
    command?: Command
}

export interface WorkspaceEdit {
    changes: { [uri: string]: TextEdit[] }
}

export interface TextEdit {
    range: Range
    newText: string
}

export interface Position {
    line: number
    character: number
}

export interface Range {
    start: Position
    end: Position
}

export interface WindowAPI {
    /**
     * Show information message
     */
    showInformationMessage(message: string): void

    /**
     * Show warning message
     */
    showWarningMessage(message: string): void

    /**
     * Show error message
     */
    showErrorMessage(message: string): void

    /**
     * Show input box
     */
    showInputBox(options?: InputBoxOptions): Promise<string | undefined>
}

export interface InputBoxOptions {
    prompt?: string
    placeholder?: string
    value?: string
}

export interface CommandsAPI {
    /**
     * Register a command
     */
    registerCommand(id: string, callback: (...args: any[]) => any): Disposable

    /**
     * Execute a command
     */
    executeCommand(id: string, ...args: any[]): Promise<any>
}

export interface Command {
    id: string
    title: string
    arguments?: any[]
}

/**
 * Extension Host - manages extension lifecycle
 */
export class ExtensionHost {
    private extensions = new Map<string, Extension>()
    private contexts = new Map<string, ExtensionContext>()

    /**
     * Register an extension
     */
    register(extension: Extension): void {
        this.extensions.set(extension.id, extension)
    }

    /**
     * Activate an extension
     */
    async activate(extensionId: string, context: ExtensionContext): Promise<void> {
        const extension = this.extensions.get(extensionId)
        if (!extension) {
            throw new Error(`Extension ${extensionId} not found`)
        }

        this.contexts.set(extensionId, context)
        await extension.activate(context)
    }

    /**
     * Deactivate an extension
     */
    async deactivate(extensionId: string): Promise<void> {
        const extension = this.extensions.get(extensionId)
        const context = this.contexts.get(extensionId)

        if (extension?.deactivate) {
            await extension.deactivate()
        }

        // Dispose all subscriptions
        context?.subscriptions.forEach(sub => sub.dispose())
        this.contexts.delete(extensionId)
    }

    /**
     * Get all registered extensions
     */
    getAllExtensions(): Extension[] {
        return Array.from(this.extensions.values())
    }
}

export default ExtensionHost
