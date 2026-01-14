"use client"

import { useState, useRef } from "react"
import type { FileNode } from "./ide-workspace"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FilePlus, FolderPlus, Trash2, Search, FolderOpenDot, Upload } from "lucide-react"

interface FileExplorerProps {
  files: FileNode[]
  activeFileId: string | null
  onFileSelect: (fileId: string) => void
  onCreateFile: (parentId: string | null, name: string, type: "file" | "folder") => void
  onDeleteFile: (fileId: string) => void
  onOpenFolder?: () => void
  onImportFiles?: (files: FileList) => void
}

export function FileExplorer({ files, activeFileId, onFileSelect, onCreateFile, onDeleteFile, onOpenFolder, onImportFiles }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1"]))
  const [isCreating, setIsCreating] = useState<{ parentId: string | null; type: "file" | "folder" } | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleCreateSubmit = () => {
    if (newItemName.trim()) {
      onCreateFile(isCreating?.parentId || null, newItemName.trim(), isCreating?.type || "file")
    }
    setIsCreating(null)
    setNewItemName("")
  }

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") {
      return expandedFolders.has(node.id) ? (
        <FolderOpen className="h-4 w-4 text-accent" />
      ) : (
        <Folder className="h-4 w-4 text-accent" />
      )
    }

    const ext = node.name.split(".").pop()?.toLowerCase()
    const iconColors: Record<string, string> = {
      tsx: "text-chart-1",
      ts: "text-chart-1",
      jsx: "text-chart-3",
      js: "text-chart-3",
      css: "text-chart-2",
      json: "text-chart-4",
      md: "text-muted-foreground",
    }

    return <File className={`h-4 w-4 ${iconColors[ext || ""] || "text-muted-foreground"}`} />
  }

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.id)
    const isActive = node.id === activeFileId

    return (
      <div key={node.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${isActive ? "bg-accent/20 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => {
                if (node.type === "folder") {
                  toggleFolder(node.id)
                } else {
                  onFileSelect(node.id)
                }
              }}
            >
              {node.type === "folder" && (
                <span className="flex h-4 w-4 items-center justify-center">
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </span>
              )}
              {getFileIcon(node)}
              <span className="truncate">{node.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-card border-border">
            {node.type === "folder" && (
              <>
                <ContextMenuItem
                  className="text-foreground"
                  onClick={() => {
                    setIsCreating({ parentId: node.id, type: "file" })
                    setExpandedFolders((prev) => new Set([...prev, node.id]))
                  }}
                >
                  <FilePlus className="mr-2 h-4 w-4" /> New File
                </ContextMenuItem>
                <ContextMenuItem
                  className="text-foreground"
                  onClick={() => {
                    setIsCreating({ parentId: node.id, type: "folder" })
                    setExpandedFolders((prev) => new Set([...prev, node.id]))
                  }}
                >
                  <FolderPlus className="mr-2 h-4 w-4" /> New Folder
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}
            <ContextMenuItem className="text-destructive" onClick={() => onDeleteFile(node.id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {node.type === "folder" && isExpanded && (
          <div>
            {isCreating?.parentId === node.id && (
              <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
                {isCreating.type === "folder" ? (
                  <Folder className="h-4 w-4 text-accent" />
                ) : (
                  <File className="h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSubmit()
                    if (e.key === "Escape") {
                      setIsCreating(null)
                      setNewItemName("")
                    }
                  }}
                  onBlur={handleCreateSubmit}
                  className="h-6 bg-background text-sm"
                  placeholder={`New ${isCreating.type}...`}
                />
              </div>
            )}
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#ced3e2' }}>Explorer</span>
        <div className="flex items-center gap-1">
          {onOpenFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-accent"
              onClick={() => {
                const folderInput = document.getElementById('folder-input') as HTMLInputElement
                folderInput?.click()
              }}
              title="Open Folder"
            >
              <FolderOpenDot className="h-3.5 w-3.5" />
            </Button>
          )}
          {onImportFiles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-accent"
              onClick={() => fileInputRef.current?.click()}
              title="Import Files"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCreating({ parentId: null, type: "file" })}
          >
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsCreating({ parentId: null, type: "folder" })}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 bg-background pl-7 text-xs"
          />
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-auto p-2">
        {isCreating?.parentId === null && (
          <div className="flex items-center gap-1 px-2 py-1">
            {isCreating.type === "folder" ? (
              <Folder className="h-4 w-4 text-accent" />
            ) : (
              <File className="h-4 w-4 text-muted-foreground" />
            )}
            <Input
              autoFocus
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit()
                if (e.key === "Escape") {
                  setIsCreating(null)
                  setNewItemName("")
                }
              }}
              onBlur={handleCreateSubmit}
              className="h-6 bg-background text-sm"
              placeholder={`New ${isCreating.type}...`}
            />
          </div>
        )}
        {files.map((file) => renderNode(file))}
      </div>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files && onImportFiles) {
            onImportFiles(e.target.files)
          }
          e.target.value = ''
        }}
      />
      <input
        type="file"
        id="folder-input"
        className="hidden"
        {...({ webkitdirectory: "", directory: "", mozdirectory: "" } as any)}
        onChange={(e) => {
          if (e.target.files && onImportFiles) {
            onImportFiles(e.target.files)
          }
          e.target.value = ''
        }}
      />
    </div>
  )
}
