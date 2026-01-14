/**
 * Monaco Editor Syntax Themes
 * 
 * Professional syntax highlighting themes for Monaco Editor
 * integrated with the IDE theme system.
 */

import type { editor } from "monaco-editor"

/**
 * Light Theme - Clean syntax highlighting
 */
export const monacoLightTheme: editor.IStandaloneThemeData = {
    base: "vs",
    inherit: true,
    rules: [
        { token: "comment", foreground: "6a737d", fontStyle: "italic" },
        { token: "comment.block", foreground: "6a737d", fontStyle: "italic" },
        { token: "comment.line", foreground: "6a737d", fontStyle: "italic" },

        { token: "string", foreground: "22863a" },
        { token: "string.escape", foreground: "005cc5", fontStyle: "bold" },
        { token: "string.regexp", foreground: "e36209" },

        { token: "number", foreground: "005cc5" },
        { token: "number.hex", foreground: "005cc5" },
        { token: "number.binary", foreground: "005cc5" },
        { token: "number.octal", foreground: "005cc5" },

        { token: "keyword", foreground: "d73a49", fontStyle: "bold" },
        { token: "keyword.control", foreground: "d73a49", fontStyle: "bold" },
        { token: "keyword.operator", foreground: "d73a49" },

        { token: "operator", foreground: "24292e" },
        { token: "delimiter", foreground: "24292e" },

        { token: "variable", foreground: "24292e" },
        { token: "variable.predefined", foreground: "005cc5" },
        { token: "variable.parameter", foreground: "e36209" },

        { token: "function", foreground: "6f42c1" },
        { token: "function.predefined", foreground: "005cc5" },

        { token: "type", foreground: "005cc5", fontStyle: "bold" },
        { token: "type.identifier", foreground: "005cc5" },
        { token: "class", foreground: "6f42c1" },
        { token: "class.name", foreground: "6f42c1", fontStyle: "bold" },

        { token: "constant", foreground: "005cc5", fontStyle: "bold" },
        { token: "constant.language", foreground: "005cc5" },
        { token: "constant.numeric", foreground: "005cc5" },

        { token: "tag", foreground: "22863a" },
        { token: "tag.attribute", foreground: "6f42c1" },
        { token: "attribute.name", foreground: "6f42c1" },
        { token: "attribute.value", foreground: "032f62" },

        { token: "meta", foreground: "6a737d" },
        { token: "annotation", foreground: "d73a49" },
        { token: "decorator", foreground: "e36209" },
    ],
    colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#24292e",
        "editor.lineHighlightBackground": "#f6f8fa",
        "editorCursor.foreground": "#24292e",
        "editor.selectionBackground": "#0366d620",
        "editorLineNumber.foreground": "#6a737d",
        "editorLineNumber.activeForeground": "#24292e",
    },
}

/**
 * Dark Theme - Comfortable dark syntax highlighting
 */
export const monacoDarkTheme: editor.IStandaloneThemeData = {
    base: "vs-dark",
    inherit: true,
    rules: [
        { token: "comment", foreground: "6a9955", fontStyle: "italic" },
        { token: "comment.block", foreground: "6a9955", fontStyle: "italic" },
        { token: "comment.line", foreground: "6a9955", fontStyle: "italic" },

        { token: "string", foreground: "ce9178" },
        { token: "string.escape", foreground: "d7ba7d", fontStyle: "bold" },
        { token: "string.regexp", foreground: "d16969" },

        { token: "number", foreground: "b5cea8" },
        { token: "number.hex", foreground: "b5cea8" },
        { token: "number.binary", foreground: "b5cea8" },
        { token: "number.octal", foreground: "b5cea8" },

        { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
        { token: "keyword.control", foreground: "c586c0", fontStyle: "bold" },
        { token: "keyword.operator", foreground: "569cd6" },

        { token: "operator", foreground: "d4d4d4" },
        { token: "delimiter", foreground: "d4d4d4" },

        { token: "variable", foreground: "9cdcfe" },
        { token: "variable.predefined", foreground: "4fc1ff" },
        { token: "variable.parameter", foreground: "9cdcfe" },

        { token: "function", foreground: "dcdcaa" },
        { token: "function.predefined", foreground: "4ec9b0" },

        { token: "type", foreground: "4ec9b0", fontStyle: "bold" },
        { token: "type.identifier", foreground: "4ec9b0" },
        { token: "class", foreground: "4ec9b0" },
        { token: "class.name", foreground: "4ec9b0", fontStyle: "bold" },

        { token: "constant", foreground: "4fc1ff", fontStyle: "bold" },
        { token: "constant.language", foreground: "569cd6" },
        { token: "constant.numeric", foreground: "b5cea8" },

        { token: "tag", foreground: "569cd6" },
        { token: "tag.attribute", foreground: "9cdcfe" },
        { token: "attribute.name", foreground: "9cdcfe" },
        { token: "attribute.value", foreground: "ce9178" },

        { token: "meta", foreground: "6a9955" },
        { token: "annotation", foreground: "dcdcaa" },
        { token: "decorator", foreground: "c586c0" },
    ],
    colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editor.lineHighlightBackground": "#2a2a2a",
        "editorCursor.foreground": "#d4d4d4",
        "editor.selectionBackground": "#264f78",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#d4d4d4",
    },
}

/**
 * High Contrast Theme - Maximum visibility
 */
export const monacoHighContrastTheme: editor.IStandaloneThemeData = {
    base: "hc-black",
    inherit: true,
    rules: [
        { token: "comment", foreground: "a0a0a0", fontStyle: "italic" },
        { token: "comment.block", foreground: "a0a0a0", fontStyle: "italic" },
        { token: "comment.line", foreground: "a0a0a0", fontStyle: "italic" },

        { token: "string", foreground: "00ff00", fontStyle: "bold" },
        { token: "string.escape", foreground: "00ffff", fontStyle: "bold" },
        { token: "string.regexp", foreground: "ff8800" },

        { token: "number", foreground: "00ff00", fontStyle: "bold" },
        { token: "number.hex", foreground: "00ff00" },
        { token: "number.binary", foreground: "00ff00" },
        { token: "number.octal", foreground: "00ff00" },

        { token: "keyword", foreground: "ff00ff", fontStyle: "bold" },
        { token: "keyword.control", foreground: "ff00ff", fontStyle: "bold" },
        { token: "keyword.operator", foreground: "ffffff" },

        { token: "operator", foreground: "ffffff", fontStyle: "bold" },
        { token: "delimiter", foreground: "ffffff" },

        { token: "variable", foreground: "00ffff" },
        { token: "variable.predefined", foreground: "00ffff", fontStyle: "bold" },
        { token: "variable.parameter", foreground: "00ffff" },

        { token: "function", foreground: "ffff00", fontStyle: "bold" },
        { token: "function.predefined", foreground: "ffff00" },

        { token: "type", foreground: "00ffff", fontStyle: "bold" },
        { token: "type.identifier", foreground: "00ffff" },
        { token: "class", foreground: "00ffff" },
        { token: "class.name", foreground: "00ffff", fontStyle: "bold" },

        { token: "constant", foreground: "ff8800", fontStyle: "bold" },
        { token: "constant.language", foreground: "ff00ff" },
        { token: "constant.numeric", foreground: "00ff00" },

        { token: "tag", foreground: "00ffff" },
        { token: "tag.attribute", foreground: "ffff00" },
        { token: "attribute.name", foreground: "ffff00" },
        { token: "attribute.value", foreground: "00ff00" },

        { token: "meta", foreground: "a0a0a0" },
        { token: "annotation", foreground: "ffff00" },
        { token: "decorator", foreground: "ff00ff" },
    ],
    colors: {
        "editor.background": "#000000",
        "editor.foreground": "#ffffff",
        "editor.lineHighlightBackground": "#1a1a1a",
        "editorCursor.foreground": "#ffff00",
        "editor.selectionBackground": "#ffff0040",
        "editorLineNumber.foreground": "#808080",
        "editorLineNumber.activeForeground": "#ffffff",
        "editorBracketMatch.background": "#ffff0040",
        "editorBracketMatch.border": "#ffff00",
    },
}

/**
 * Apply Monaco theme based on current IDE theme
 */
export function applyMonacoTheme(
    monaco: typeof import("monaco-editor"),
    theme: string | undefined
): string {
    if (!monaco) return "vs"

    switch (theme) {
        case "light":
            monaco.editor.defineTheme("ide-light", monacoLightTheme)
            return "ide-light"

        case "dark":
            monaco.editor.defineTheme("ide-dark", monacoDarkTheme)
            return "ide-dark"

        case "high-contrast":
            monaco.editor.defineTheme("ide-high-contrast", monacoHighContrastTheme)
            return "ide-high-contrast"

        default:
            // System or unknown - use default
            return theme === "system" ? "vs" : "vs"
    }
}

/**
 * Get Monaco theme name for current IDE theme
 */
export function getMonacoThemeName(theme: string | undefined): string {
    switch (theme) {
        case "light":
            return "ide-light"
        case "dark":
            return "ide-dark"
        case "high-contrast":
            return "ide-high-contrast"
        default:
            return "vs"
    }
}
