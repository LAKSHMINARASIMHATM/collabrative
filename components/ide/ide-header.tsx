"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Zap,
  Play,
  Settings,
  Terminal,
  Bug,
  Users,
  ChevronDown,
  Share2,
  Download,
  GitBranch,
  MoreHorizontal,
  GitFork,
  Bot,
  Folder,
  Plus,
  Check,
  Layout,
  RefreshCw,
  Key,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CloneDialog } from "@/components/ide/clone-dialog"
import { SettingsDialog } from "@/components/ide/settings-dialog"
import { ShareDialog } from "@/components/ide/share-dialog"
import { CollaborateDialog } from "@/components/ide/collaborate-dialog"
import { useState } from "react"
import { toast } from "sonner"

interface IDEHeaderProps {
  projectId: string
  user: User
  showTerminal: boolean
  setShowTerminal: (show: boolean) => void
  showDebugPanel: boolean
  setShowDebugPanel: (show: boolean) => void
  showCollaborators: boolean
  setShowCollaborators: (show: boolean) => void
  showAIPanel: boolean
  setShowAIPanel: (show: boolean) => void
  onRun: () => void
  onSave: () => void
  onSaveAll?: () => void
  onNewFile?: () => void
  onOpenFolder?: () => void
  onExport?: () => void
  onFind?: () => void
  onReplace?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onCut?: () => void
  onCopy?: () => void
  onPaste?: () => void
  hasUnsavedChanges: boolean
  projectName?: string
  onCloneSuccess?: (dir: string) => void
  fontSize: number
  onFontSizeChange: (size: number) => void
}

export function IDEHeader({
  projectId,
  user,
  showTerminal,
  setShowTerminal,
  showDebugPanel,
  setShowDebugPanel,
  showCollaborators,
  setShowCollaborators,
  showAIPanel,
  setShowAIPanel,
  onRun,
  onSave,
  onSaveAll,
  onNewFile,
  onOpenFolder,
  onExport,
  onFind,
  onReplace,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  hasUnsavedChanges,
  projectName = "Untitled",
  onCloneSuccess,
  fontSize,
  onFontSizeChange,
}: IDEHeaderProps) {
  const router = useRouter()
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  // Handle new project creation
  const handleNewProject = async () => {
    try {
      // Create a new folder dialog or use file system API
      const projectFolder = prompt('Enter new project name:')
      if (projectFolder && projectFolder.trim()) {
        console.log('Creating new project:', projectFolder.trim())
        // Here you would typically:
        // 1. Create a new folder in the file system
        // 2. Initialize project files
        // 3. Update the IDE state with the new project
        toast.success(`New project "${projectFolder.trim()}" created!`)
      }
    } catch (error) {
      console.error('Error creating new project:', error)
      toast.error('Failed to create new project')
    }
  }

  // Generate random room ID
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Create new room ID and password
  const createNewRoom = () => {
    const newRoomId = generateRoomId();
    const newPassword = generatePassword();
    toast.success('New room created! Room ID: ' + newRoomId);
    // You could add state management or callback here to update room settings
  };

  // Generate new password only
  const generateNewPassword = () => {
    const newPassword = generatePassword();
    toast.success('New password generated!');
    // You could add state management or callback here to update room settings
  };


  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-accent">
            <Zap className="h-4 w-4 text-accent-foreground" />
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 h-auto py-1 px-2 text-sm hover:bg-accent/50">
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] text-muted-foreground font-normal leading-none">Project</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground leading-none">{projectName}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              {hasUnsavedChanges && <span className="ml-1 h-2 w-2 rounded-full bg-accent" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px] bg-card border-border">
            <DropdownMenuLabel className="text-xs">Switch Project</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-accent transition-colors" onClick={onOpenFolder}>
              <Folder className="mr-2 h-4 w-4 flex-shrink-0" /> 
              <span className="text-xs">Open Project...</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground cursor-pointer hover:bg-accent transition-colors" onClick={handleNewProject}>
              <Plus className="mr-2 h-4 w-4 flex-shrink-0" /> 
              <span className="text-xs">New Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Menu bar */}
        <div className="hidden items-center gap-1 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              <DropdownMenuItem className="text-foreground" onClick={onNewFile}>New File</DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={onOpenFolder}>Open...</DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={() => setShowCloneDialog(true)}>
                <GitFork className="mr-2 h-4 w-4" /> Clone from GitHub...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" onClick={onSave}>
                Save <span className="ml-auto text-xs text-muted-foreground">⌘S</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={onSaveAll}>Save All</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" /> Export Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                Edit
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              <DropdownMenuItem className="text-foreground" onClick={onUndo}>
                Undo <span className="ml-auto text-xs text-muted-foreground">⌘Z</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={onRedo}>
                Redo <span className="ml-auto text-xs text-muted-foreground">⌘⇧Z</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" onClick={onCut}>
                Cut <span className="ml-auto text-xs text-muted-foreground">⌘X</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={onCopy}>
                Copy <span className="ml-auto text-xs text-muted-foreground">⌘C</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={onPaste}>
                Paste <span className="ml-auto text-xs text-muted-foreground">⌘V</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-foreground" onClick={onFind}>
                Find <span className="ml-auto text-xs text-muted-foreground">⌘F</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={onReplace}>
                Replace <span className="ml-auto text-xs text-muted-foreground">⌘H</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              <DropdownMenuItem className="text-foreground" onClick={() => setShowTerminal(!showTerminal)}>
                <Terminal className="mr-2 h-4 w-4" />
                Terminal
                {showTerminal && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={() => setShowDebugPanel(!showDebugPanel)}>
                <Bug className="mr-2 h-4 w-4" />
                Debug Panel
                {showDebugPanel && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={() => setShowCollaborators(!showCollaborators)}>
                <Users className="mr-2 h-4 w-4" />
                Collaborators
                {showCollaborators && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground" onClick={() => setShowAIPanel(!showAIPanel)}>
                <Bot className="mr-2 h-4 w-4" />
                AI Assistant
                {showAIPanel && <span className="ml-auto">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center section - Git branch */}
      <div className="hidden items-center gap-2 md:flex">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <GitBranch className="h-3 w-3" />
          main
        </Button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className={`h-7 w-7 p-0 ${showDebugPanel ? "text-accent" : "text-muted-foreground"}`}
        >
          <Bug className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
          onClick={() => setShowCloneDialog(true)}
          title="Clone from GitHub"
        >
          <GitFork className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTerminal(!showTerminal)}
          className={`h-7 w-7 p-0 ${showTerminal ? "text-accent" : "text-muted-foreground"}`}
        >
          <Terminal className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCollaborators(!showCollaborators)}
          className={`h-7 w-7 p-0 ${showCollaborators ? "text-accent" : "text-muted-foreground"}`}
        >
          <Users className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAIPanel(!showAIPanel)}
          title="AI Assistant"
          className={`h-7 w-7 p-0 ${showAIPanel ? "text-accent" : "text-muted-foreground"}`}
        >
          <Bot className="h-4 w-4" />
        </Button>

        <div className="mx-2 h-4 w-px bg-border" />

        <ShareDialog projectId={projectId}>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </ShareDialog>

        <CollaborateDialog projectId={projectId}>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            Join
          </Button>
        </CollaborateDialog>

        <Button size="sm" className="h-7 gap-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={onRun}>
          <Play className="h-3 w-3" />
          Run
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem className="text-foreground" onClick={() => setShowSettings(true)}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-foreground" onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Clone Repository Dialog */}
      <CloneDialog
        open={showCloneDialog}
        onOpenChange={setShowCloneDialog}
        onCloneSuccess={(dir, repoInfo) => {
          if (onCloneSuccess) {
            onCloneSuccess(dir)
          }
        }}
      />
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        fontSize={fontSize}
        onFontSizeChange={onFontSizeChange}
      />
    </header>
  )
}
