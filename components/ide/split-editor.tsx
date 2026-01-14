"use client"

import { useEffect, useRef, useState } from "react"
import { SplitSquareHorizontal, SplitSquareVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "./code-editor"
import type { OpenFile } from "./ide-workspace"
import type { User } from "@supabase/supabase-js"
import type { editor as MonacoEditor } from "monaco-editor"
import type { UserPresence } from "@/lib/collaboration/presence-manager"

interface SplitEditorProps {
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
    onEditorReady?: (editor: MonacoEditor.IStandaloneCodeEditor | null) => void
    onCollaboratorsChange?: (users: UserPresence[]) => void
}

type SplitMode = "none" | "horizontal" | "vertical"

export function SplitEditor(props: SplitEditorProps) {
    const [splitMode, setSplitMode] = useState<SplitMode>("none")
    const [leftFiles, setLeftFiles] = useState<string[]>([])
    const [rightFiles, setRightFiles] = useState<string[]>([])
    const [activePane, setActivePane] = useState<"left" | "right">("left")
    const leftEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
    const rightEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
    const leftCollaboratorsRef = useRef<UserPresence[]>([])
    const rightCollaboratorsRef = useRef<UserPresence[]>([])

    const handleSplitHorizontal = () => {
        if (splitMode === "none" && props.activeFileId) {
            setSplitMode("horizontal")
            setLeftFiles([props.activeFileId])
            setRightFiles([])
            setActivePane("right")
        } else {
            setSplitMode("none")
            setLeftFiles([])
            setRightFiles([])
        }
    }

    const handleSplitVertical = () => {
        if (splitMode === "none" && props.activeFileId) {
            setSplitMode("vertical")
            setLeftFiles([props.activeFileId])
            setRightFiles([])
            setActivePane("right")
        } else {
            setSplitMode("none")
            setLeftFiles([])
            setRightFiles([])
        }
    }

    const handleFileSelect = (fileId: string) => {
        if (splitMode !== "none") {
            // Add to active pane
            if (activePane === "left") {
                if (!leftFiles.includes(fileId)) {
                    setLeftFiles([...leftFiles, fileId])
                }
            } else {
                if (!rightFiles.includes(fileId)) {
                    setRightFiles([...rightFiles, fileId])
                }
            }
        }
        props.onFileSelect(fileId)
    }

    useEffect(() => {
        if (splitMode === "none") return
        props.onEditorReady?.(activePane === "left" ? leftEditorRef.current : rightEditorRef.current)
        props.onCollaboratorsChange?.(activePane === "left" ? leftCollaboratorsRef.current : rightCollaboratorsRef.current)
    }, [activePane, splitMode, props])

    if (splitMode === "none") {
        return (
            <div className="flex h-full flex-col">
                {/* Toolbar */}
                <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleSplitHorizontal}
                        title="Split Horizontally"
                    >
                        <SplitSquareHorizontal className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleSplitVertical}
                        title="Split Vertically"
                    >
                        <SplitSquareVertical className="h-3 w-3" />
                    </Button>
                </div>

                {/* Single Editor */}
                <div className="flex-1">
                    <CodeEditor
                        {...props}
                        onFileSelect={handleFileSelect}
                        onEditorReady={props.onEditorReady}
                        onCollaboratorsChange={props.onCollaboratorsChange}
                    />
                </div>
            </div>
        )
    }

    const leftOpenFiles = props.openFiles.filter((f) => leftFiles.includes(f.id))
    const rightOpenFiles = props.openFiles.filter((f) => rightFiles.includes(f.id))
    const leftActiveId = leftFiles.includes(props.activeFileId || "") ? props.activeFileId : leftFiles[0] || null
    const rightActiveId = rightFiles.includes(props.activeFileId || "") ? props.activeFileId : rightFiles[0] || null

    return (
        <div className="flex h-full flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setSplitMode("none")}
                    title="Close Split"
                >
                    <X className="h-3 w-3 mr-1" />
                    Close Split
                </Button>
            </div>

            {/* Split Editors */}
            <div className={`flex flex-1 ${splitMode === "horizontal" ? "flex-row" : "flex-col"}`}>
                {/* Left/Top Pane */}
                <div
                    className={`${splitMode === "horizontal" ? "w-1/2" : "h-1/2"} ${activePane === "left" ? "ring-1 ring-accent" : ""
                        }`}
                    onClick={() => setActivePane("left")}
                >
                    <CodeEditor
                        {...props}
                        openFiles={leftOpenFiles}
                        activeFileId={leftActiveId}
                        onFileSelect={handleFileSelect}
                        onEditorReady={(editor) => {
                            leftEditorRef.current = editor
                            if (activePane === "left") props.onEditorReady?.(editor)
                        }}
                        onCollaboratorsChange={(users) => {
                            leftCollaboratorsRef.current = users
                            if (activePane === "left") props.onCollaboratorsChange?.(users)
                        }}
                    />
                </div>

                {/* Divider */}
                <div className={`${splitMode === "horizontal" ? "w-px" : "h-px"} bg-border`} />

                {/* Right/Bottom Pane */}
                <div
                    className={`${splitMode === "horizontal" ? "w-1/2" : "h-1/2"} ${activePane === "right" ? "ring-1 ring-accent" : ""
                        }`}
                    onClick={() => setActivePane("right")}
                >
                    <CodeEditor
                        {...props}
                        openFiles={rightOpenFiles}
                        activeFileId={rightActiveId}
                        onFileSelect={handleFileSelect}
                        onEditorReady={(editor) => {
                            rightEditorRef.current = editor
                            if (activePane === "right") props.onEditorReady?.(editor)
                        }}
                        onCollaboratorsChange={(users) => {
                            rightCollaboratorsRef.current = users
                            if (activePane === "right") props.onCollaboratorsChange?.(users)
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
