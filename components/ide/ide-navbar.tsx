"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
    Play,
    Bug,
    Hammer,
    Palette,
    FolderOpen,
    Search,
    Menu,
    Loader2,
    CheckCircle2,
    XCircle,
    Sun,
    Moon,
    Contrast,
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface IDENavbarProps {
    onRun?: () => void
    onDebug?: () => void
    onBuild?: () => void
    onWorkspaceSwitch?: (workspaceId: string) => void
    currentWorkspace?: string
    runStatus?: 'idle' | 'running' | 'success' | 'error'
    debugStatus?: 'idle' | 'running' | 'paused' | 'stopped'
    buildStatus?: 'idle' | 'building' | 'success' | 'error'
}

export function IDENavbar({
    onRun,
    onDebug,
    onBuild,
    onWorkspaceSwitch,
    currentWorkspace = "My Project",
    runStatus = 'idle',
    debugStatus = 'idle',
    buildStatus = 'idle',
}: IDENavbarProps) {
    const { theme, setTheme } = useTheme()
    const [searchOpen, setSearchOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const getStatusIcon = (status: string, type: 'run' | 'debug' | 'build') => {
        if (status === 'running' || status === 'building' || status === 'paused') {
            return <Loader2 className="h-3 w-3 animate-spin" />
        }
        if (status === 'success') {
            return <CheckCircle2 className="h-3 w-3 text-green-500" />
        }
        if (status === 'error') {
            return <XCircle className="h-3 w-3 text-destructive" />
        }
        return null
    }

    const getStatusColor = (status: string) => {
        if (status === 'running' || status === 'building') return 'text-blue-500'
        if (status === 'success') return 'text-green-500'
        if (status === 'error') return 'text-destructive'
        if (status === 'paused') return 'text-yellow-500'
        return ''
    }

    const getThemeIcon = (themeName: string | undefined) => {
        if (themeName === 'light') return <Sun className="h-4 w-4" />
        if (themeName === 'dark') return <Moon className="h-4 w-4" />
        if (themeName === 'high-contrast') return <Contrast className="h-4 w-4" />
        return <Palette className="h-4 w-4" />
    }

    const getThemeLabel = (themeName: string | undefined) => {
        if (themeName === 'light') return 'Light'
        if (themeName === 'dark') return 'Dark'
        if (themeName === 'high-contrast') return 'High Contrast'
        if (themeName === 'system') return 'System'
        return 'Theme'
    }

    // Mock recent workspaces - in production, this would come from props or context
    const recentWorkspaces = [
        { id: "1", name: "My Project", path: "/projects/my-project" },
        { id: "2", name: "Web App", path: "/projects/web-app" },
        { id: "3", name: "API Server", path: "/projects/api" },
    ]

    return (
        <nav className="flex items-center justify-between border-b border-border bg-card px-4 py-2 shadow-sm">
            {/* Left Section: Quick Actions */}
            <div className="flex items-center gap-2">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <Menu className="h-4 w-4" />
                </Button>

                {/* Desktop Quick Actions */}
                <div className="hidden md:flex items-center gap-1">
                    {/* Run Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRun}
                        className={`gap-2 ${getStatusColor(runStatus)}`}
                        title="Run (Ctrl+Shift+R)"
                    >
                        <Play className="h-4 w-4" />
                        <span className="text-xs font-medium">Run</span>
                        {getStatusIcon(runStatus, 'run')}
                    </Button>

                    {/* Debug Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDebug}
                        className={`gap-2 ${getStatusColor(debugStatus)}`}
                        title="Debug (F5)"
                    >
                        <Bug className="h-4 w-4" />
                        <span className="text-xs font-medium">Debug</span>
                        {getStatusIcon(debugStatus, 'debug')}
                    </Button>

                    {/* Build Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBuild}
                        className={`gap-2 ${getStatusColor(buildStatus)}`}
                        title="Build (Ctrl+Shift+B)"
                    >
                        <Hammer className="h-4 w-4" />
                        <span className="text-xs font-medium">Build</span>
                        {getStatusIcon(buildStatus, 'build')}
                    </Button>
                </div>
            </div>

            {/* Center Section: Workspace Switcher */}
            <div className="flex-1 flex justify-center px-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 max-w-xs truncate">
                            <FolderOpen className="h-4 w-4" />
                            <span className="hidden sm:inline text-sm font-medium truncate">{currentWorkspace}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-64">
                        <DropdownMenuLabel>Current Project</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5">
                            <Input
                                defaultValue={currentWorkspace}
                                className="h-8 text-sm"
                                placeholder="Project name..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const newName = (e.target as HTMLInputElement).value
                                        if (newName.trim()) {
                                            // Handle rename
                                            console.log('Rename project to:', newName)
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    const newName = e.target.value
                                    if (newName.trim() && newName !== currentWorkspace) {
                                        // Handle rename
                                        console.log('Rename project to:', newName)
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Press Enter to rename</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Recent Projects</DropdownMenuLabel>
                        {recentWorkspaces.map((workspace) => (
                            <DropdownMenuItem
                                key={workspace.id}
                                onClick={() => onWorkspaceSwitch?.(workspace.id)}
                                className="gap-2"
                            >
                                <FolderOpen className="h-4 w-4" />
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-medium truncate">{workspace.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{workspace.path}</div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                            <FolderOpen className="h-4 w-4" />
                            <span>Open Folder...</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Right Section: Theme & Search */}
            <div className="flex items-center gap-2">
                {/* Search Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="hidden sm:flex gap-2"
                    title="Search (Ctrl+P)"
                >
                    <Search className="h-4 w-4" />
                    <span className="text-xs text-muted-foreground">Search...</span>
                </Button>

                {/* Theme Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2" title="Change Theme">
                            {getThemeIcon(theme)}
                            <span className="hidden lg:inline text-xs font-medium">{getThemeLabel(theme)}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                            <Sun className="h-4 w-4" />
                            <span>Light</span>
                            {theme === 'light' && <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                            <Moon className="h-4 w-4" />
                            <span>Dark</span>
                            {theme === 'dark' && <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('high-contrast')} className="gap-2">
                            <Contrast className="h-4 w-4" />
                            <span>High Contrast</span>
                            {theme === 'high-contrast' && <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                            <Palette className="h-4 w-4" />
                            <span>Follow System</span>
                            {theme === 'system' && <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="absolute top-14 left-0 right-0 z-50 md:hidden bg-card border-b border-border shadow-lg p-4 space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { onRun?.(); setMobileMenuOpen(false) }}
                        className={`w-full justify-start gap-2 ${getStatusColor(runStatus)}`}
                    >
                        <Play className="h-4 w-4" />
                        <span>Run</span>
                        {getStatusIcon(runStatus, 'run')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { onDebug?.(); setMobileMenuOpen(false) }}
                        className={`w-full justify-start gap-2 ${getStatusColor(debugStatus)}`}
                    >
                        <Bug className="h-4 w-4" />
                        <span>Debug</span>
                        {getStatusIcon(debugStatus, 'debug')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { onBuild?.(); setMobileMenuOpen(false) }}
                        className={`w-full justify-start gap-2 ${getStatusColor(buildStatus)}`}
                    >
                        <Hammer className="h-4 w-4" />
                        <span>Build</span>
                        {getStatusIcon(buildStatus, 'build')}
                    </Button>
                </div>
            )}

            {/* Search Modal Overlay */}
            {searchOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                    <div className="fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2">
                        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search files, symbols, commands..."
                                    className="flex-1"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                                Press <kbd className="px-2 py-1 bg-muted rounded">ESC</kbd> to close
                            </div>
                        </div>
                    </div>
                    <div className="fixed inset-0" onClick={() => setSearchOpen(false)} />
                </div>
            )}
        </nav>
    )
}
