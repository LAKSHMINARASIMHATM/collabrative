"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FileExplorer } from "./file-explorer"
import { SplitEditor } from "./split-editor"
import { Terminal } from "./terminal"
import { AdvancedDebugPanel } from "./advanced-debug-panel"
import { CollaboratorsPanel } from "./collaborators-panel"
import { IDEHeader } from "./ide-header"
import { FindReplace, type FindOptions } from "./find-replace"
import { Breadcrumb } from "./breadcrumb"
import { WorkspaceManager } from "@/lib/workspace-manager"
import { FileWatcher, type FileChange } from "@/lib/file-watcher"
import { DragDropHandler, type DroppedFile, type OpenFile } from "@/lib/drag-drop"
import { LanguageManager } from "@/lib/languages/language-manager"
import { DebugAdapter } from "@/lib/debug/debug-adapter"
import { toast } from "sonner"
import type { editor as MonacoEditor } from "monaco-editor"
import type { UserPresence } from "@/lib/collaboration/presence-manager"
import { AIAssistantPanel } from "./ai-assistant-panel"

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  language?: string
  children?: FileNode[]
}

export type { OpenFile }

interface IDEWorkspaceProps {
  projectId: string
  user: User
}

export function IDEWorkspace({ projectId, user }: IDEWorkspaceProps) {
  // File state
  const [files, setFiles] = useState<FileNode[]>([])
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string | null>(null)

  // UI state
  const [showTerminal, setShowTerminal] = useState(true)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["Welcome to CodeSync IDE Terminal", "Type 'help' for available commands", ""])
  const [fontSize, setFontSize] = useState(14)
  const [collaborators, setCollaborators] = useState<UserPresence[]>([])

  // Debug state
  const [breakpoints, setBreakpoints] = useState<Map<string, Set<number>>>(new Map())
  const [isDebugging, setIsDebugging] = useState(false)
  const [isDebugPaused, setIsDebugPaused] = useState(false)

  // Managers
  const workspaceManagerRef = useRef<WorkspaceManager>(new WorkspaceManager())
  const fileWatcherRef = useRef<FileWatcher>(new FileWatcher())
  const dragDropHandlerRef = useRef<DragDropHandler | null>(null)
  const languageManagerRef = useRef<LanguageManager>(new LanguageManager())
  const debugAdapterRef = useRef<DebugAdapter>(new DebugAdapter())
  const workspaceRef = useRef<HTMLDivElement>(null)
  const activeEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)

  // Initialize drag and drop
  useEffect(() => {
    if (workspaceRef.current && !dragDropHandlerRef.current) {
      const handler = new DragDropHandler(workspaceRef.current)

      handler.onFilesDropped((droppedFiles) => {
        handleDroppedFiles(droppedFiles)
      })

      dragDropHandlerRef.current = handler
    }

    return () => {
      dragDropHandlerRef.current?.destroy()
    }
  }, [])

  // Handle dropped files
  const handleDroppedFiles = async (droppedFiles: DroppedFile[]) => {
    for (const file of droppedFiles) {
      const newFile: OpenFile = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        content: file.content,
        language: getLanguageFromFilename(file.name),
        isDirty: false,
      }

      setOpenFiles(prev => [...prev, newFile])
      setActiveFileId(newFile.id)
      toast.success(`Added ${file.name}`)
    }
  }

  // Open local folder
  const handleOpenFolder = async () => {
    try {
      const result = await workspaceManagerRef.current.openFolder()
      if (result) {
        setFiles(result.files)
        setWorkspaceName(result.name)

        // Start file watcher if directory handle is available
        const rootHandle = (workspaceManagerRef.current as any).fileSystem?.getRootHandle()
        if (rootHandle) {
          await fileWatcherRef.current.watch(rootHandle)

          // Listen for file changes
          fileWatcherRef.current.onChange((changes) => {
            handleFileChanges(changes)
          })
        }

        toast.success(`Opened workspace: ${result.name}`)
      }
    } catch (error) {
      console.error("Error opening folder:", error)
      toast.error("Failed to open folder")
    }
  }

  // Handle external file changes
  const handleFileChanges = (changes: FileChange[]) => {
    changes.forEach(change => {
      if (change.type === "modified") {
        toast.info(`${change.path} was modified externally`)
        // Optionally reload the file
      } else if (change.type === "created") {
        toast.info(`${change.path} was created`)
      } else if (change.type === "deleted") {
        toast.warning(`${change.path} was deleted`)
      }
    })
  }

  // Find and replace handlers
  const handleFind = (query: string, options: FindOptions) => {
    // Monaco editor has built-in find - trigger via keyboard shortcut
    const event = new KeyboardEvent("keydown", {
      key: "f",
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  const handleReplace = (findText: string, replaceText: string, options: FindOptions) => {
    if (!activeFileId) return

    const activeFile = openFiles.find(f => f.id === activeFileId)
    if (!activeFile) return

    // Simple replace
    const regex = options.regex
      ? new RegExp(findText, options.caseSensitive ? "g" : "gi")
      : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), options.caseSensitive ? "g" : "gi")

    const newContent = activeFile.content.replace(regex, replaceText)
    handleContentChange(activeFileId, newContent)
  }

  const handleReplaceAll = (findText: string, replaceText: string, options: FindOptions) => {
    handleReplace(findText, replaceText, options)
  }

  // File operations
  const handleFileSelect = (fileId: string) => {
    const file = findFileById(files, fileId)
    if (file && file.type === "file") {
      const existingFile = openFiles.find((f) => f.id === fileId)
      if (!existingFile) {
        setOpenFiles([
          ...openFiles,
          {
            id: fileId,
            name: file.name,
            content: file.content || "",
            language: file.language || "plaintext",
            isDirty: false,
          },
        ])
      }
      setActiveFileId(fileId)
    }
  }

  const handleFileClose = (fileId: string) => {
    setOpenFiles(openFiles.filter((f) => f.id !== fileId))
    if (activeFileId === fileId) {
      const remaining = openFiles.filter((f) => f.id !== fileId)
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handleContentChange = (fileId: string, content: string) => {
    setOpenFiles(
      openFiles.map((file) =>
        file.id === fileId ? { ...file, content, isDirty: true } : file
      )
    )
  }

  const handleSaveFile = async (fileId: string) => {
    const file = openFiles.find((f) => f.id === fileId)
    if (file) {
      // Save to workspace if available
      try {
        if (workspaceManagerRef.current.isWorkspaceOpen()) {
          await workspaceManagerRef.current.writeFile(fileId, file.content)
          toast.success(`Saved ${file.name}`)
        }

        setOpenFiles(
          openFiles.map((f) => (f.id === fileId ? { ...f, isDirty: false } : f))
        )
      } catch (error) {
        console.error("Error saving file:", error)
        toast.error(`Failed to save ${file.name}`)
      }
    }
  }

  const handleCreateFile = (parentId: string | null, name: string, type: "file" | "folder") => {
    const newNode: FileNode = {
      id: `${Date.now()}-${name}`,
      name,
      type,
      content: type === "file" ? "" : undefined,
      language: type === "file" ? getLanguageFromFilename(name) : undefined,
      children: type === "folder" ? [] : undefined,
    }

    if (parentId === null) {
      setFiles([...files, newNode])
    } else {
      setFiles(addFileToParent(files, parentId, newNode))
    }

    if (type === "file") {
      handleFileSelect(newNode.id)
    }
  }

  const handleDeleteFile = (fileId: string) => {
    setFiles(removeFileById(files, fileId))
    handleFileClose(fileId)
  }

  const handleToggleBreakpoint = (fileId: string, lineNumber: number) => {
    setBreakpoints((prev) => {
      const newMap = new Map(prev)
      const fileBreakpoints = newMap.get(fileId) || new Set()

      if (fileBreakpoints.has(lineNumber)) {
        fileBreakpoints.delete(lineNumber)
      } else {
        fileBreakpoints.add(lineNumber)
      }

      if (fileBreakpoints.size === 0) {
        newMap.delete(fileId)
      } else {
        newMap.set(fileId, fileBreakpoints)
      }

      return newMap
    })
  }

  const handleCommand = (command: string) => {
    setTerminalOutput([...terminalOutput, `$ ${command}`, `Executing: ${command}...`, ""])
  }

  const handleNewFile = () => {
    const fileName = prompt("Enter file name:", "newfile.txt")
    if (fileName) {
      handleCreateFile(null, fileName, "file")
      toast.success(`Created ${fileName}`)
    }
  }

  const handleSaveAll = () => {
    const dirtyFiles = openFiles.filter(f => f.isDirty)
    dirtyFiles.forEach(file => {
      handleSaveFile(file.id)
    })
    if (dirtyFiles.length > 0) {
      toast.success(`Saved ${dirtyFiles.length} files`)
    }
  }

  const handleExport = async () => {
    try {
      const snapshot = {
        projectId,
        workspaceName,
        exportedAt: new Date().toISOString(),
        openFiles,
        activeFileId,
        files,
      }

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${workspaceName || "project"}-snapshot.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Exported project snapshot")
    } catch (error) {
      toast.error("Failed to export")
    }
  }

  const handleFindToggle = () => {
    setShowFindReplace(!showFindReplace)
    activeEditorRef.current?.getAction("actions.find")?.run()
  }

  const handleReplaceToggle = () => {
    setShowFindReplace(true)
    activeEditorRef.current?.getAction("editor.action.startFindReplaceAction")?.run()
  }

  const handleUndo = () => {
    activeEditorRef.current?.trigger("toolbar", "undo", null)
  }

  const handleRedo = () => {
    activeEditorRef.current?.trigger("toolbar", "redo", null)
  }

  const handleCut = () => {
    activeEditorRef.current?.getAction("editor.action.clipboardCutAction")?.run()
  }

  const handleCopy = () => {
    activeEditorRef.current?.getAction("editor.action.clipboardCopyAction")?.run()
  }

  const handlePaste = () => {
    activeEditorRef.current?.getAction("editor.action.clipboardPasteAction")?.run()
  }

  const handleRunCode = async () => {
    const activeFile = openFiles.find(f => f.id === activeFileId)
    if (!activeFile) {
      toast.error("No file selected")
      return
    }

    const language = LanguageManager.getLanguageFromFile(activeFile.name)

    toast.info(`Running ${activeFile.name}...`)
    setTerminalOutput(prev => [...prev, `\n▶ Running ${activeFile.name}...`, ""])

    try {
      const result = await languageManagerRef.current.execute(
        language,
        activeFile.content,
        activeFile.name,
        (line) => {
          setTerminalOutput(prev => [...prev, line])
        }
      )

      if (result.error) {
        toast.error("Execution failed")
        setTerminalOutput(prev => [...prev, `❌ Error: ${result.error}`, ""])
      } else {
        toast.success("Execution complete")
        setTerminalOutput(prev => [...prev, result.output, "✓ Complete", ""])
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      toast.error("Execution error")
      setTerminalOutput(prev => [...prev, `❌ ${errorMsg}`, ""])
    }
  }

  const handleDebugStart = async () => {
    const activeFile = openFiles.find(f => f.id === activeFileId)
    if (!activeFile) {
      toast.error("No file selected")
      return
    }

    const language = LanguageManager.getLanguageFromFile(activeFile.name)

    try {
      await debugAdapterRef.current.start(language, activeFile.name)

      // Set breakpoints for current file
      const fileBreakpoints = breakpoints.get(activeFileId!)
      if (fileBreakpoints) {
        debugAdapterRef.current.setBreakpoints(
          activeFile.name,
          Array.from(fileBreakpoints)
        )
      }

      setIsDebugging(true)
      setIsDebugPaused(true)
      toast.success("Debug session started")
    } catch (error) {
      toast.error("Failed to start debugger")
    }
  }

  const handleDebugContinue = async () => {
    await debugAdapterRef.current.continue()
    setIsDebugPaused(false)
  }

  const handleDebugPause = async () => {
    await debugAdapterRef.current.pause()
    setIsDebugPaused(true)
  }

  const handleDebugStepOver = async () => {
    await debugAdapterRef.current.stepOver()
  }

  const handleDebugStepInto = async () => {
    await debugAdapterRef.current.stepInto()
  }

  const handleDebugStepOut = async () => {
    await debugAdapterRef.current.stepOut()
  }

  const handleDebugStop = async () => {
    await debugAdapterRef.current.stop()
    setIsDebugging(false)
    setIsDebugPaused(false)
    toast.info("Debug session stopped")
  }

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      html: "html",
      css: "css",
      md: "markdown",
      py: "python",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  const findFileById = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findFileById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const addFileToParent = (nodes: FileNode[], parentId: string, newNode: FileNode): FileNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId && node.type === "folder") {
        return { ...node, children: [...(node.children || []), newNode] }
      }
      if (node.children) {
        return { ...node, children: addFileToParent(node.children, parentId, newNode) }
      }
      return node
    })
  }

  const removeFileById = (nodes: FileNode[], id: string): FileNode[] => {
    return nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        children: node.children ? removeFileById(node.children, id) : undefined,
      }))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (activeFileId) {
          handleSaveFile(activeFileId)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "`") {
        e.preventDefault()
        setShowTerminal((prev) => !prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault()
        setShowFindReplace((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeFileId])

  const activeFile = openFiles.find((f) => f.id === activeFileId)

  return (
    <div ref={workspaceRef} className="flex h-screen flex-col bg-background">
      {/* Header */}
      <IDEHeader
        projectId={projectId}
        user={user}
        showTerminal={showTerminal}
        setShowTerminal={setShowTerminal}
        showDebugPanel={showDebugPanel}
        setShowDebugPanel={setShowDebugPanel}
        showCollaborators={showCollaborators}
        setShowCollaborators={setShowCollaborators}
        showAIPanel={showAIPanel}
        setShowAIPanel={setShowAIPanel}
        onRun={handleRunCode}
        onSave={() => activeFileId && handleSaveFile(activeFileId)}
        onSaveAll={handleSaveAll}
        onNewFile={handleNewFile}
        onOpenFolder={handleOpenFolder}
        onExport={handleExport}
        onFind={handleFindToggle}
        onReplace={handleReplaceToggle}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        hasUnsavedChanges={openFiles.some(f => f.isDirty)}
        projectName={workspaceName || "Untitled"}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onFileSelect={handleFileSelect}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onOpenFolder={handleOpenFolder}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor */}
          <ResizablePanel defaultSize={60}>
            <div className="flex h-full flex-col">
              {/* Breadcrumb */}
              {activeFile && (
                <Breadcrumb
                  path={activeFile.name}
                  onNavigate={(path) => console.log("Navigate to:", path)}
                />
              )}

              {/* Find & Replace */}
              {showFindReplace && (
                <FindReplace
                  onFind={handleFind}
                  onReplace={handleReplace}
                  onReplaceAll={handleReplaceAll}
                  onClose={() => setShowFindReplace(false)}
                />
              )}

              {/* Split Editor */}
              <div className="flex-1">
                <SplitEditor
                  openFiles={openFiles}
                  activeFileId={activeFileId}
                  onFileSelect={handleFileSelect}
                  onFileClose={handleFileClose}
                  onContentChange={handleContentChange}
                  onSave={handleSaveFile}
                  breakpoints={breakpoints}
                  onToggleBreakpoint={handleToggleBreakpoint}
                  projectId={projectId}
                  user={user}
                  fontSize={fontSize}
                  onEditorReady={(editorInstance) => {
                    activeEditorRef.current = editorInstance
                  }}
                  onCollaboratorsChange={setCollaborators}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <ResizablePanelGroup direction="vertical">
              {showDebugPanel && (
                <>
                  <ResizablePanel defaultSize={50}>
                    <AdvancedDebugPanel
                      isDebugging={isDebugging}
                      isPaused={isDebugPaused}
                      breakpoints={breakpoints}
                      stackFrames={debugAdapterRef.current.getStackTrace()}
                      onStart={handleDebugStart}
                      onPause={handleDebugPause}
                      onContinue={handleDebugContinue}
                      onStepOver={handleDebugStepOver}
                      onStepInto={handleDebugStepInto}
                      onStepOut={handleDebugStepOut}
                      onStop={handleDebugStop}
                    />
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}

              {showCollaborators && (
                <>
                  <ResizablePanel defaultSize={50}>
                    <CollaboratorsPanel user={user} activeUsers={collaborators} />
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}

              {showAIPanel && (
                <>
                  <ResizablePanel defaultSize={50}>
                    <AIAssistantPanel
                      activeFileContent={activeFile?.content}
                      activeFileName={activeFile?.name}
                      onClose={() => setShowAIPanel(false)}
                    />
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}

              {showTerminal && (
                <ResizablePanel defaultSize={showDebugPanel || showCollaborators || showAIPanel ? 50 : 100}>
                  <Terminal
                    output={terminalOutput}
                    onCommand={handleCommand}
                    onClose={() => setShowTerminal(false)}
                  />
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Drag & Drop Styles */}
      <style jsx global>{`
        .drag-over {
          outline: 2px dashed hsl(var(--accent));
          outline-offset: -2px;
          background-color: hsl(var(--accent) / 0.1);
        }
      `}</style>
    </div>
  )
}
