"use client"

import { useEffect, useRef } from "react"
import type { editor as MonacoEditor } from "monaco-editor"
import type { UserPresence } from "@/lib/collaboration/presence-manager"

interface CursorOverlayProps {
    editor: MonacoEditor.IStandaloneCodeEditor
    collaborators: UserPresence[]
    currentUserId: string
}

export function CursorOverlay({ editor, collaborators, currentUserId }: CursorOverlayProps) {
    const cursorsRef = useRef<Map<string, HTMLDivElement>>(new Map())
    const selectionsRef = useRef<Map<string, HTMLDivElement>>(new Map())

    useEffect(() => {
        if (!editor) return

        const updateCursorPositions = () => {
            const editorDom = editor.getDomNode()
            if (!editorDom) return

            // Clear old cursors/selections
            cursorsRef.current.forEach((cursor) => cursor.remove())
            selectionsRef.current.forEach((selection) => selection.remove())
            cursorsRef.current.clear()
            selectionsRef.current.clear()

            // Render new cursors/selections
            collaborators.forEach((collab) => {
                if (collab.userId === currentUserId) return

                // Render selection
                if (collab.selection) {
                    renderSelection(editor, collab, editorDom, selectionsRef.current)
                }

                // Render cursor
                if (collab.cursor) {
                    renderCursor(editor, collab, editorDom, cursorsRef.current)
                }
            })
        }

        // Update on scroll, model change, cursor position change
        const disposables = [
            editor.onDidScrollChange(updateCursorPositions),
            editor.onDidChangeModelContent(updateCursorPositions),
            editor.onDidChangeCursorPosition(updateCursorPositions),
            editor.onDidLayoutChange(updateCursorPositions),
        ]

        // Initial render
        updateCursorPositions()

        return () => {
            disposables.forEach((d) => d.dispose())
            cursorsRef.current.forEach((cursor) => cursor.remove())
            selectionsRef.current.forEach((selection) => selection.remove())
        }
    }, [editor, collaborators, currentUserId])

    return null // This component doesn't render anything directly
}

function renderCursor(
    editor: MonacoEditor.IStandaloneCodeEditor,
    collab: UserPresence,
    editorDom: HTMLElement,
    cursorMap: Map<string, HTMLDivElement>
) {
    if (!collab.cursor) return

    const position = { lineNumber: collab.cursor.line, column: collab.cursor.column }
    const coords = editor.getScrolledVisiblePosition(position)

    if (!coords) return

    // Create cursor element
    const cursor = document.createElement("div")
    cursor.style.position = "absolute"
    cursor.style.left = `${coords.left}px`
    cursor.style.top = `${coords.top}px`
    cursor.style.width = "2px"
    cursor.style.height = `${coords.height || 18}px`
    cursor.style.backgroundColor = collab.color
    cursor.style.zIndex = "1000"
    cursor.style.pointerEvents = "none"
    cursor.style.animation = "blink 1s step-end infinite"

    // Create cursor label
    const label = document.createElement("div")
    label.style.position = "absolute"
    label.style.left = "3px"
    label.style.top = "-20px"
    label.style.backgroundColor = collab.color
    label.style.color = "#ffffff"
    label.style.padding = "2px 6px"
    label.style.borderRadius = "3px"
    label.style.fontSize = "11px"
    label.style.fontWeight = "500"
    label.style.whiteSpace = "nowrap"
    label.style.pointerEvents = "none"
    label.textContent = collab.userName

    cursor.appendChild(label)
    editorDom.appendChild(cursor)

    // Store reference
    cursorMap.set(collab.userId, cursor)

    // Add blink animation if not already added
    if (!document.getElementById("cursor-blink-style")) {
        const style = document.createElement("style")
        style.id = "cursor-blink-style"
        style.textContent = `
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
    `
        document.head.appendChild(style)
    }
}

function renderSelection(
    editor: MonacoEditor.IStandaloneCodeEditor,
    collab: UserPresence,
    editorDom: HTMLElement,
    selectionsMap: Map<string, HTMLDivElement>
) {
    if (!collab.selection) return

    const start = {
        lineNumber: collab.selection.start.line,
        column: collab.selection.start.column,
    }
    const end = {
        lineNumber: collab.selection.end.line,
        column: collab.selection.end.column,
    }

    const startCoords = editor.getScrolledVisiblePosition(start)
    const endCoords = editor.getScrolledVisiblePosition(end)

    if (!startCoords || !endCoords) return

    // Create selection overlay
    const selection = document.createElement("div")
    selection.style.position = "absolute"
    selection.style.left = `${Math.min(startCoords.left, endCoords.left)}px`
    selection.style.top = `${Math.min(startCoords.top, endCoords.top)}px`
    selection.style.width = `${Math.abs(endCoords.left - startCoords.left)}px`
    selection.style.height = `${Math.abs(endCoords.top - startCoords.top) + (endCoords.height || 18)}px`
    selection.style.backgroundColor = collab.color
    selection.style.opacity = "0.2"
    selection.style.zIndex = "999"
    selection.style.pointerEvents = "none"
    selection.style.borderRadius = "2px"

    editorDom.appendChild(selection)

    // Store reference
    selectionsMap.set(collab.userId, selection)
}

export default CursorOverlay
