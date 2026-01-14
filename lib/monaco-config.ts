import type { editor } from "monaco-editor"

export const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  minimap: {
    enabled: true,
  },
  scrollBeyondLastLine: false,
  fontSize: 14,
  lineHeight: 24,
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  contextmenu: true,
  scrollbar: {
    useShadows: true,
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  folding: true,
  glyphMargin: true,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 10,
  renderWhitespace: "selection",
  suggest: {
    showMethods: true,
    showFunctions: true,
    showConstructors: true,
    showFields: true,
    showVariables: true,
    showClasses: true,
    showStructs: true,
    showInterfaces: true,
    showModules: true,
    showProperties: true,
    showEvents: true,
    showOperators: true,
    showUnits: true,
    showValues: true,
    showConstants: true,
    showEnums: true,
    showEnumMembers: true,
    showKeywords: true,
    showWords: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
    showSnippets: true,
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true,
  },
  parameterHints: {
    enabled: true,
  },
  tabCompletion: "on",
  wordBasedSuggestions: "allDocuments",
  bracketPairColorization: {
    enabled: true,
  },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
}

export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    md: "markdown",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    sql: "sql",
    sh: "shell",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
  }
  return languageMap[ext || ""] || "plaintext"
}

export const formatCode = async (code: string, language: string): Promise<string> => {
  try {
    const prettier = await import("prettier")
    const plugins = []

    // Dynamically load the appropriate parser
    if (language === "typescript" || language === "javascript") {
      const typescript = await import("prettier/parser-typescript")
      plugins.push(typescript.default)
    } else if (language === "html") {
      const html = await import("prettier/parser-html")
      plugins.push(html.default)
    } else if (language === "css" || language === "scss" || language === "less") {
      const postcss = await import("prettier/parser-postcss")
      plugins.push(postcss.default)
    } else if (language === "markdown") {
      const markdown = await import("prettier/parser-markdown")
      plugins.push(markdown.default)
    } else if (language === "json") {
      const babel = await import("prettier/parser-babel")
      plugins.push(babel.default)
    }

    if (plugins.length === 0) {
      return code
    }

    const parserMap: Record<string, string> = {
      typescript: "typescript",
      javascript: "typescript",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      markdown: "markdown",
      json: "json",
    }

    return prettier.format(code, {
      parser: parserMap[language] || "typescript",
      plugins,
      semi: false,
      singleQuote: false,
      trailingComma: "all",
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
    })
  } catch (error) {
    console.error("Failed to format code:", error)
    return code
  }
}
