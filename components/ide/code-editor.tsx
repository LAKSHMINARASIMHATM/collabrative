"use client"

import type React from "react"

import { useCallback, useRef, useEffect, useState } from "react"
import type { OpenFile } from "./ide-workspace"
import { X, Circle } from "lucide-react"
import Editor, { useMonaco } from "@monaco-editor/react"
import type { editor } from "monaco-editor"
import { monacoOptions, formatCode } from "@/lib/monaco-config"
import { useTheme } from "next-themes"
import * as Y from "yjs"
import { MonacoBinding } from "y-monaco"
import { WebsocketProvider } from "y-websocket"
import { type ConnectionStatus } from "@/lib/supabase-provider"
import type { User } from "@supabase/supabase-js"
import { applyMonacoTheme } from "@/lib/monaco-themes"
import type { UserPresence } from "@/lib/collaboration/presence-manager"

interface CodeEditorProps {
  openFiles: OpenFile[]
  activeFileId: string | null
  onFileSelect: (fileId: string) => void
  onFileClose: (fileId: string) => void
  onContentChange: (fileId: string, content: string) => void
  onSave: (fileId: string) => void
  breakpoints: Map<string, Set<number>>
  onToggleBreakpoint: (fileId: string, lineNumber: number) => void
  projectId?: string
  user?: User
  fontSize?: number
  debugLine?: number | null
  onEditorReady?: (editor: editor.IStandaloneCodeEditor | null) => void
  onCollaboratorsChange?: (users: UserPresence[]) => void
}

export function CodeEditor({
  openFiles,
  activeFileId,
  onFileSelect,
  onFileClose,
  onContentChange,
  onSave,
  breakpoints,
  onToggleBreakpoint,
  projectId,
  user,
  fontSize = 14,
  debugLine,
  onEditorReady,
  onCollaboratorsChange,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monaco = useMonaco()
  const { theme } = useTheme()
  const activeFile = openFiles.find((f) => f.id === activeFileId)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)

  // Debug decorations
  const debugDecorationsRef = useRef<string[]>([])

  // Highlight debug line
  useEffect(() => {
    if (!editorRef.current || !monaco) return

    const decorations: editor.IModelDeltaDecoration[] = []
    if (typeof debugLine === 'number') {
      decorations.push({
        range: new monaco.Range(debugLine, 1, debugLine, 1),
        options: {
          isWholeLine: true,
          className: 'debug-line-highlight',
          glyphMarginClassName: 'debug-line-glyph',
        }
      })
    }

    debugDecorationsRef.current = editorRef.current.deltaDecorations(
      debugDecorationsRef.current,
      decorations
    )
  }, [debugLine, monaco])

  // Collaborative editing state
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)

  const getUserColor = useCallback((id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }, [])

  const buildCollaboratorsFromAwareness = useCallback((provider: WebsocketProvider): UserPresence[] => {
    const states = provider.awareness.getStates()
    const collaborators: UserPresence[] = []

    states.forEach((state: any, clientId: number) => {
      if (clientId === provider.awareness.clientID) return
      const stateUser = state?.user
      const userId: string | undefined = stateUser?.id || stateUser?.userId

      const name: string =
        stateUser?.name ||
        (stateUser?.email ? String(stateUser.email).split("@")[0] : undefined) ||
        userId ||
        "Anonymous"

      const email: string = stateUser?.email || ""
      const color: string = stateUser?.color || "#3b82f6"
      const currentFile: string | undefined = state?.currentFile
      const activity = state?.activity

      collaborators.push({
        userId: userId || "unknown",
        userName: name,
        userEmail: email,
        color,
        status: "online",
        activity: activity || "editing",
        lastSeen: new Date(),
        isTyping: false,
        currentFile,
      })
    })

    return collaborators
  }, [user?.id])

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    onEditorReady?.(editor)

    // Update cursor position on change
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column })
    })

    // Focus the editor
    editor.focus()
  }, [onEditorReady])

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFileId && value !== undefined && !bindingRef.current) {
        // Only update if not using collaborative editing
        onContentChange(activeFileId, value)
      }
    },
    [activeFileId, onContentChange],
  )

  // Set up collaborative editing when file changes
  useEffect(() => {
    if (!editorRef.current || !monaco || !activeFileId || !activeFile || !projectId || !user) {
      return
    }

    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    // Clean up previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }
    if (providerRef.current) {
      providerRef.current.destroy()
      providerRef.current = null
    }
    if (ydocRef.current) {
      ydocRef.current.destroy()
      ydocRef.current = null
    }

    // Create new Yjs document for this file
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    let providerForCleanup: WebsocketProvider | null = null
    let awarenessChangeHandler: (() => void) | null = null

    try {
      // Create Websocket provider
      const wsUrl = `ws://localhost:3001`
      const roomName = `${projectId}_${activeFileId}`
      const provider = new WebsocketProvider(wsUrl, roomName, ydoc)
      providerRef.current = provider
      providerForCleanup = provider

      // Listen for connection status changes
      provider.on("status", (event: { status: string }) => {
        setConnectionStatus(event.status as any)
      })

      provider.awareness.setLocalStateField("user", {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        color: getUserColor(user.id),
      })
      provider.awareness.setLocalStateField("currentFile", activeFile.name)

      awarenessChangeHandler = () => {
        onCollaboratorsChange?.(buildCollaboratorsFromAwareness(provider))
      }

      provider.awareness.on("change", awarenessChangeHandler)
      awarenessChangeHandler()

      // Get the text type from Yjs document
      const ytext = ydoc.getText("monaco")

      // Initialize the text content if empty
      if (ytext.toString() === "" && activeFile.content) {
        ytext.insert(0, activeFile.content)
      }

      // Create Monaco binding
      const binding = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness,
      )
      bindingRef.current = binding

      // Listen for content changes in Yjs and sync to parent
      ytext.observe(() => {
        const content = ytext.toString()
        onContentChange(activeFileId, content)
      })
    } catch (error) {
      console.error('Failed to initialize collaborative editing:', error)
      setConnectionStatus('error')
      // Continue without collaboration
    }

    return () => {
      // Cleanup
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }

      if (providerForCleanup) {
        if (awarenessChangeHandler) {
          providerForCleanup.awareness.off("change", awarenessChangeHandler)
        }
        providerForCleanup.destroy()
      }

      if (ydocRef.current) {
        ydocRef.current.destroy()
        ydocRef.current = null
      }
    }
  }, [monaco, activeFileId, activeFile, projectId, user, onContentChange, buildCollaboratorsFromAwareness, onCollaboratorsChange, getUserColor])

  useEffect(() => {
    if (!providerRef.current || !activeFile) return
    providerRef.current.awareness.setLocalStateField("currentFile", activeFile.name)
  }, [activeFile?.name])

  // Apply Monaco theme when IDE theme changes
  useEffect(() => {
    if (!monaco) return

    try {
      const monacoTheme = applyMonacoTheme(monaco, theme)
      monaco.editor.setTheme(monacoTheme)
    } catch (error) {
      console.error('Failed to apply Monaco theme:', error)
    }
  }, [monaco, theme])

  // Set up keyboard shortcuts
  useEffect(() => {
    if (!editorRef.current || !monaco) return

    const editor = editorRef.current

    // Save shortcut (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeFileId) {
        onSave(activeFileId)
      }
    })

    // Format document (Shift+Alt+F)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, async () => {
      if (activeFile) {
        const formatted = await formatCode(activeFile.content, activeFile.language)

        // If using collaborative editing, update the Yjs document
        if (ydocRef.current) {
          const ytext = ydocRef.current.getText("monaco")
          ytext.delete(0, ytext.length)
          ytext.insert(0, formatted)
        } else {
          onContentChange(activeFileId!, formatted)
        }
      }
    })
  }, [monaco, activeFileId, activeFile, onSave, onContentChange])

  // Handle breakpoints
  useEffect(() => {
    if (!editorRef.current || !monaco || !activeFileId) return

    const editor = editorRef.current
    const model = editor.getModel()
    if (!model) return

    const fileBreakpoints = breakpoints.get(activeFileId) || new Set()

    // Add decorations for breakpoints
    const decorations = Array.from(fileBreakpoints).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: "breakpoint-glyph",
        glyphMarginHoverMessage: { value: "Breakpoint" },
      },
    }))

    editor.deltaDecorations([], decorations)

    // Handle clicking on glyph margin to toggle breakpoints
    const disposable = editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber
        if (lineNumber) {
          onToggleBreakpoint(activeFileId, lineNumber)
        }
      }
    })

    return () => disposable.dispose()
  }, [monaco, activeFileId, breakpoints, onToggleBreakpoint])

  // Focus editor when active file changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }, [activeFileId])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      onEditorReady?.(null)
      try {
        if (bindingRef.current) {
          bindingRef.current.destroy()
          bindingRef.current = null
        }
      } catch (error) {
        console.debug('Unmount binding cleanup:', error)
      }

      try {
        if (providerRef.current) {
          providerRef.current.destroy()
          providerRef.current = null
        }
      } catch (error) {
        console.debug('Unmount provider cleanup:', error)
      }

      try {
        if (ydocRef.current) {
          ydocRef.current.destroy()
          ydocRef.current = null
        }
      } catch (error) {
        console.debug('Unmount ydoc cleanup:', error)
      }
    }
  }, [])

  if (openFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No file open</p>
          <p className="mt-2 text-sm text-muted-foreground">Select a file from the explorer to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-card">
        <div className="flex overflow-x-auto">
          {openFiles.map((file) => (
            <div
              key={file.id}
              className={`group flex cursor-pointer items-center gap-2 border-r border-border px-4 py-2 text-sm ${file.id === activeFileId ? "bg-background text-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              onClick={() => onFileSelect(file.id)}
            >
              {file.isDirty && <Circle className="h-2 w-2 fill-accent text-accent" />}
              <span>{file.name}</span>
              <button
                className="ml-1 rounded p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileClose(file.id)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="relative flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={activeFile?.language || "plaintext"}
          value={activeFile?.content || ""}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === "high-contrast" ? "ide-high-contrast" : theme === "dark" ? "ide-dark" : "ide-light"}
          options={{ ...monacoOptions, fontSize }}
          loading={
            <div className="flex h-full items-center justify-center">
              <div className="text-muted-foreground">Loading editor...</div>
            </div>
          }
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{activeFile?.language || "plaintext"}</span>
          <span>UTF-8</span>
          {projectId && user && (
            <span className={
              connectionStatus === 'connected' ? 'text-green-500' :
                connectionStatus === 'connecting' ? 'text-yellow-500' :
                  connectionStatus === 'error' ? 'text-red-500' :
                    connectionStatus === 'disconnected' ? 'text-orange-500' :
                      'text-muted-foreground'
            }>
              {connectionStatus === 'connected' && '● Connected'}
              {connectionStatus === 'connecting' && '○ Connecting...'}
              {connectionStatus === 'error' && '✕ Connection Error'}
              {connectionStatus === 'disconnected' && '⚠ Disconnected'}
              {!connectionStatus && '○ Initializing...'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          <span>Spaces: 2</span>
        </div>
      </div>

      {/* Breakpoint styles */}
      <style jsx global>{`
        .breakpoint-glyph {
          background: hsl(var(--destructive));
          width: 10px !important;
          height: 10px !important;
          border-radius: 50%;
          margin-left: 5px;
        }
      `}</style>
    </div>
  )
}
