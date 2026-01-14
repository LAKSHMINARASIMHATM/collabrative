"use client"

import { useEffect, useRef, useState } from "react"
import { Terminal as XTerm } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import { WebLinksAddon } from "xterm-addon-web-links"
import "xterm/css/xterm.css"
import { X, Plus, Settings, Maximize2, Minimize2, Copy, Search, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TerminalProps {
  onCommand?: (command: string) => void | Promise<void>
  onClose?: () => void
}

interface TerminalTab {
  id: string
  title: string
  shell: string
  terminal: XTerm
  fitAddon: FitAddon
  commandHistory: string[]
  currentDirectory: string
}

export function Terminal({ onCommand, onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [tabs, setTabs] = useState<TerminalTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>("")
  const [isMaximized, setIsMaximized] = useState(false)

  // Initialize first terminal tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab("PowerShell")
    }
  }, [])

  // Render active terminal
  useEffect(() => {
    if (!terminalRef.current || tabs.length === 0) return

    const activeTab = tabs.find(t => t.id === activeTabId)
    if (!activeTab) return

    // Clear container
    terminalRef.current.innerHTML = ""

    // Mount terminal
    activeTab.terminal.open(terminalRef.current)

    // Fit after mount
    setTimeout(() => {
      activeTab.fitAddon.fit()
    }, 10)

      // Expose terminal globally for external commands
      ; (window as any).__terminal = {
        write: (text: string) => activeTab.terminal.write(text),
        writeln: (text: string) => activeTab.terminal.writeln(text),
      }

    // Handle window resize
    const handleResize = () => {
      activeTab.fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      ; (window as any).__terminal = null
      window.removeEventListener('resize', handleResize)
    }
  }, [activeTabId, tabs])

  const createNewTab = (shell: string = "PowerShell") => {
    const terminal = new XTerm({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 14,
      fontFamily: "'Cascadia Code', 'Cascadia Mono', 'Consolas', 'Courier New', monospace",
      theme: {
        background: "#012456",
        foreground: "#cccccc",
        cursor: "#ffffff",
        cursorAccent: "#000000",
        selectionBackground: "rgba(255, 255, 255, 0.3)",
        black: "#0c0c0c",
        red: "#c50f1f",
        green: "#13a10e",
        yellow: "#c19c00",
        blue: "#0037da",
        magenta: "#881798",
        cyan: "#3a96dd",
        white: "#cccccc",
        brightBlack: "#767676",
        brightRed: "#e74856",
        brightGreen: "#16c60c",
        brightYellow: "#f9f1a5",
        brightBlue: "#3b78ff",
        brightMagenta: "#b4009e",
        brightCyan: "#61d6d6",
        brightWhite: "#f2f2f2",
      },
      allowProposedApi: true,
      scrollback: 10000,
      tabStopWidth: 4,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    const tabId = `tab-${Date.now()}`
    const commandHistory: string[] = []

    const newTab: TerminalTab = {
      id: tabId,
      title: shell,
      shell,
      terminal,
      fitAddon,
      commandHistory,
      currentDirectory: "D:\\workspace",
    }

    // Write PowerShell-style welcome
    terminal.writeln("\x1b[36mWindows PowerShell\x1b[0m")
    terminal.writeln("\x1b[90mCopyright (C) Microsoft Corporation. All rights reserved.\x1b[0m")
    terminal.writeln("")
    terminal.writeln("\x1b[90mInstall the latest PowerShell for new features and improvements! https://aka.ms/PSWindows\x1b[0m")
    terminal.writeln("")
    terminal.write("\x1b[32mPS\x1b[0m \x1b[93mD:\\workspace>\x1b[0m ")

    // Enhanced input handling with all features
    let currentLine = ""
    let isExecuting = false
    let historyIndex = -1
    let cursorPosition = 0

    terminal.onData((data) => {
      const code = data.charCodeAt(0)

      // ========== ARROW KEYS ==========

      // Up arrow - command history (previous)
      if (data === '\x1b[A') {
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          terminal.write('\r\x1b[K')
          terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
          historyIndex++
          currentLine = commandHistory[commandHistory.length - 1 - historyIndex]
          terminal.write(currentLine)
          cursorPosition = currentLine.length
        }
        return
      }

      // Down arrow - command history (next)
      if (data === '\x1b[B') {
        if (historyIndex > 0) {
          terminal.write('\r\x1b[K')
          terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
          historyIndex--
          currentLine = commandHistory[commandHistory.length - 1 - historyIndex]
          terminal.write(currentLine)
          cursorPosition = currentLine.length
        } else if (historyIndex === 0) {
          terminal.write('\r\x1b[K')
          terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
          historyIndex = -1
          currentLine = ""
          cursorPosition = 0
        }
        return
      }

      // Left arrow - move cursor left
      if (data === '\x1b[D') {
        if (cursorPosition > 0) {
          cursorPosition--
          terminal.write('\x1b[D')
        }
        return
      }

      // Right arrow - move cursor right
      if (data === '\x1b[C') {
        if (cursorPosition < currentLine.length) {
          cursorPosition++
          terminal.write('\x1b[C')
        }
        return
      }

      // ========== SPECIAL KEYS ==========

      // Home key - move to start
      if (data === '\x1b[H' || data === '\x1b[1~') {
        while (cursorPosition > 0) {
          terminal.write('\x1b[D')
          cursorPosition--
        }
        return
      }

      // End key - move to end
      if (data === '\x1b[F' || data === '\x1b[4~') {
        while (cursorPosition < currentLine.length) {
          terminal.write('\x1b[C')
          cursorPosition++
        }
        return
      }

      // Delete key - delete character at cursor
      if (data === '\x1b[3~') {
        if (cursorPosition < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPosition) + currentLine.slice(cursorPosition + 1)
          const rest = currentLine.substring(cursorPosition) + ' '
          terminal.write(rest)
          for (let i = 0; i < rest.length; i++) {
            terminal.write('\b')
          }
        }
        return
      }

      // ========== TAB COMPLETION ==========

      if (code === 9) {
        const commands = ['npm', 'pnpm', 'yarn', 'pip', 'git', 'node', 'python', 'cd', 'ls', 'dir', 'mkdir', 'help', 'clear', 'echo', 'java', 'g++', 'go', 'cat', 'pwd', 'rm', 'cp', 'mv']
        const currentWord = currentLine.slice(0, cursorPosition).split(' ').pop() || ''
        const matches = commands.filter(cmd => cmd.startsWith(currentWord))

        if (matches.length === 1 && currentWord) {
          const completion = matches[0].substring(currentWord.length)
          currentLine = currentLine.slice(0, cursorPosition) + completion + ' ' + currentLine.slice(cursorPosition)
          terminal.write(completion + ' ')
          cursorPosition += completion.length + 1
        } else if (matches.length > 1) {
          terminal.write('\r\n')
          terminal.writeln('\x1b[90m' + matches.join('  ') + '\x1b[0m')
          terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
          terminal.write(currentLine)
          const diff = currentLine.length - cursorPosition
          for (let i = 0; i < diff; i++) {
            terminal.write('\b')
          }
        }
        return
      }

      // ========== CTRL SHORTCUTS ==========

      // Ctrl+L - clear screen
      if (code === 12) {
        terminal.clear()
        terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
        terminal.write(currentLine)
        const diff = currentLine.length - cursorPosition
        for (let i = 0; i < diff; i++) {
          terminal.write('\b')
        }
        return
      }

      // Ctrl+A - move to start
      if (code === 1) {
        while (cursorPosition > 0) {
          terminal.write('\x1b[D')
          cursorPosition--
        }
        return
      }

      // Ctrl+E - move to end
      if (code === 5) {
        while (cursorPosition < currentLine.length) {
          terminal.write('\x1b[C')
          cursorPosition++
        }
        return
      }

      // Ctrl+V - paste from clipboard
      if (code === 22) {
        navigator.clipboard.readText().then(text => {
          if (text && !isExecuting) {
            currentLine = currentLine.slice(0, cursorPosition) + text + currentLine.slice(cursorPosition)
            terminal.write(text)
            const rest = currentLine.substring(cursorPosition + text.length)
            if (rest) {
              terminal.write(rest)
              for (let i = 0; i < rest.length; i++) {
                terminal.write('\b')
              }
            }
            cursorPosition += text.length
          }
        }).catch(() => { })
        return
      }

      // Ctrl+U - clear line before cursor
      if (code === 21) {
        if (cursorPosition > 0) {
          currentLine = currentLine.slice(cursorPosition)
          terminal.write('\r\x1b[K')
          terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
          terminal.write(currentLine)
          cursorPosition = 0
          const diff = currentLine.length
          for (let i = 0; i < diff; i++) {
            terminal.write('\b')
          }
        }
        return
      }

      // Ctrl+K - clear line after cursor
      if (code === 11) {
        if (cursorPosition < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPosition)
          terminal.write('\x1b[K')
        }
        return
      }

      // Ctrl+W - delete word before cursor
      if (code === 23) {
        if (cursorPosition > 0) {
          const beforeCursor = currentLine.slice(0, cursorPosition)
          const match = beforeCursor.match(/\S+\s*$/)
          if (match) {
            const deleteCount = match[0].length
            currentLine = currentLine.slice(0, cursorPosition - deleteCount) + currentLine.slice(cursorPosition)
            for (let i = 0; i < deleteCount; i++) {
              terminal.write('\b')
            }
            cursorPosition -= deleteCount
            const rest = currentLine.substring(cursorPosition) + ' '.repeat(deleteCount)
            terminal.write(rest)
            for (let i = 0; i < rest.length; i++) {
              terminal.write('\b')
            }
          }
        }
        return
      }

      // ========== ENTER - EXECUTE COMMAND ==========

      if (code === 13) {
        terminal.write("\r\n")
        const command = currentLine.trim()

        if (command && !isExecuting) {
          // Add to history
          if (command !== commandHistory[commandHistory.length - 1]) {
            commandHistory.push(command)
            if (commandHistory.length > 100) {
              commandHistory.shift()
            }
          }
          historyIndex = -1
          isExecuting = true

          // Execute command
          if (onCommand) {
            const result = onCommand(command)
            Promise.resolve(result)
              .then(() => {
                isExecuting = false
                terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
              })
              .catch((error) => {
                terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`)
                isExecuting = false
                terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
              })
          } else {
            isExecuting = false
            terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
          }
        } else if (!command) {
          terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
        }

        currentLine = ""
        cursorPosition = 0
        return
      }

      // ========== BACKSPACE ==========

      if (code === 127) {
        if (currentLine.length > 0 && !isExecuting && cursorPosition > 0) {
          currentLine = currentLine.slice(0, cursorPosition - 1) + currentLine.slice(cursorPosition)
          cursorPosition--
          terminal.write("\b")
          const rest = currentLine.substring(cursorPosition) + ' '
          terminal.write(rest)
          for (let i = 0; i < rest.length; i++) {
            terminal.write('\b')
          }
        }
        return
      }

      // ========== CTRL+C ==========

      if (code === 3) {
        terminal.write("^C\r\n")
        isExecuting = false
        currentLine = ""
        cursorPosition = 0
        terminal.write("\x1b[32mPS\x1b[0m \x1b[93m" + newTab.currentDirectory + ">\x1b[0m ")
        return
      }

      // ========== PRINTABLE CHARACTERS ==========

      if (code >= 32 && !isExecuting) {
        currentLine = currentLine.slice(0, cursorPosition) + data + currentLine.slice(cursorPosition)
        terminal.write(data)
        const rest = currentLine.substring(cursorPosition + 1)
        if (rest) {
          terminal.write(rest)
          for (let i = 0; i < rest.length; i++) {
            terminal.write('\b')
          }
        }
        cursorPosition++
      }
    })

    setTabs(prev => [...prev, newTab])
    setActiveTabId(tabId)
  }

  const closeTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      tab.terminal.dispose()
    }

    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id)
    } else if (newTabs.length === 0 && onClose) {
      onClose()
    }
  }

  const copySelection = () => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (activeTab) {
      const selection = activeTab.terminal.getSelection()
      if (selection) {
        navigator.clipboard.writeText(selection)
      }
    }
  }

  const clearTerminal = () => {
    const activeTab = tabs.find(t => t.id === activeTabId)
    if (activeTab) {
      activeTab.terminal.clear()
    }
  }

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className={`flex h-full flex-col bg-[#012456] text-white ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Windows Terminal Header */}
      <div className="flex items-center justify-between bg-[#1e1e1e] border-b border-[#2d2d2d] px-2 py-1">
        {/* Tabs */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer transition-colors whitespace-nowrap ${tab.id === activeTabId
                  ? "bg-[#012456] text-white"
                  : "bg-transparent text-gray-400 hover:bg-[#2d2d2d]"
                }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="text-sm font-medium">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-[#3d3d3d] rounded p-0.5 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* New Tab Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
                title="New tab"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1e1e1e] border-[#2d2d2d]">
              <DropdownMenuItem onClick={() => createNewTab("PowerShell")} className="text-white hover:bg-[#2d2d2d]">
                PowerShell
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createNewTab("Command Prompt")} className="text-white hover:bg-[#2d2d2d]">
                Command Prompt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => createNewTab("Git Bash")} className="text-white hover:bg-[#2d2d2d]">
                Git Bash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
            onClick={copySelection}
            title="Copy selection (Ctrl+Shift+C)"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
            onClick={clearTerminal}
            title="Clear terminal (Ctrl+L)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-red-600"
              onClick={onClose}
              title="Close terminal"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-hidden"
      />

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-[#007acc] px-3 py-1 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold">{activeTab?.shell || "Terminal"}</span>
          <span className="text-white/80">{activeTab?.currentDirectory || "D:\\workspace"}</span>
          <span className="text-white/60">History: {activeTab?.commandHistory.length || 0}</span>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <span>UTF-8</span>
          <span>CRLF</span>
          <span>PowerShell 7.3</span>
        </div>
      </div>
    </div>
  )
}
