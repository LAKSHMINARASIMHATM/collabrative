"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { MonacoBinding } from "y-monaco"
import Editor from "@monaco-editor/react"
import type { editor } from "monaco-editor"
import type { User } from "@supabase/supabase-js"
import { monacoOptions } from "@/lib/monaco-config"

interface CollaborativeEditorProps {
  roomId: string
  user: User
  language: string
  theme?: string
}

export function CollaborativeEditor({ roomId, user, language, theme = "vs-dark" }: CollaborativeEditorProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting")
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const docRef = useRef<Y.Doc | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)

  const getUserColor = useCallback((userId: string): string => {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }, [])

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
  }

  useEffect(() => {
    if (!roomId || !user) return

    const doc = new Y.Doc()
    docRef.current = doc

    const wsUrl = `ws://localhost:3001`
    const provider = new WebsocketProvider(wsUrl, roomId, doc)
    providerRef.current = provider

    provider.on("status", (event: { status: string }) => {
      setConnectionStatus(event.status)
    })

    provider.awareness.setLocalStateField("user", {
      id: user.id,
      name: user.email?.split("@")[0] || "Anonymous",
      color: getUserColor(user.id),
    })

    const yText = doc.getText("monaco")

    // Bind to editor when both are ready
    const interval = setInterval(() => {
      if (editorRef.current) {
        clearInterval(interval)
        const binding = new MonacoBinding(
          yText,
          editorRef.current.getModel()!,
          new Set([editorRef.current]),
          provider.awareness
        )
        bindingRef.current = binding
      }
    }, 100)

    return () => {
      clearInterval(interval)
      if (bindingRef.current) bindingRef.current.destroy()
      if (providerRef.current) providerRef.current.destroy()
      if (docRef.current) docRef.current.destroy()
    }
  }, [roomId, user, getUserColor])

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute right-4 top-2 z-10 flex items-center gap-2 rounded-full bg-background/50 px-3 py-1 text-xs backdrop-blur-sm">
        <div className={`h-2 w-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : "bg-yellow-500 animate-pulse"
          }`} />
        <span className="text-muted-foreground capitalize">{connectionStatus}</span>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          theme={theme === "vs-dark" ? "vs-dark" : "light"}
          onMount={handleEditorDidMount}
          options={{
            ...monacoOptions,
            fontSize: 14,
          }}
        />
      </div>
    </div>
  )
}
