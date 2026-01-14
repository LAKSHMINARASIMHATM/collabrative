"use client"

import { useState, useEffect, useCallback } from "react"
import type { OpenFile } from "./ide-workspace"
import { Button } from "@/components/ui/button"
import {
  X,
  Play,
  Pause,
  StepBack as StepInto,
  Server as StepOver,
  Sprout as StepOut,
  RotateCcw,
  Circle,
  Bug,
  Activity,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Debugger, Breakpoint, Variable, CallFrame } from "@/lib/debug/core/debugger"
import { BreakpointManager } from "@/lib/debug/core/breakpoint-manager"
import { VariableInspector } from "@/lib/debug/core/variable-inspector"
import { CallStackManager } from "@/lib/debug/core/call-stack"
import { DebugConsole } from "@/lib/debug/core/debug-console"
import { PerformanceProfiler } from "@/lib/debug/core/performance-profiler"

interface DebugPanelProps {
  breakpoints: Map<string, Set<number>>
  activeFile: OpenFile | undefined
  onClose: () => void
}

export function DebugPanel({ breakpoints, activeFile, onClose }: DebugPanelProps) {
  // Initialize debugging services
  const debuggerInstance = useState(() => {
    console.log('Initializing Debugger instance')
    return new Debugger()
  })[0]
  const breakpointManager = useState(() => {
    console.log('Initializing BreakpointManager instance')
    return new BreakpointManager()
  })[0]
  const variableInspector = useState(() => {
    console.log('Initializing VariableInspector instance')
    return new VariableInspector()
  })[0]
  const callStackManager = useState(() => {
    console.log('Initializing CallStackManager instance')
    return new CallStackManager()
  })[0]
  const debugConsole = useState(() => {
    console.log('Initializing DebugConsole instance')
    return new DebugConsole()
  })[0]
  const performanceProfiler = useState(() => {
    console.log('Initializing PerformanceProfiler instance')
    return new PerformanceProfiler()
  })[0]

  // State management
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentBreakpoints, setCurrentBreakpoints] = useState<Breakpoint[]>([])
  const [currentVariables, setCurrentVariables] = useState<Variable[]>([])
  const [currentCallStack, setCurrentCallStack] = useState<CallFrame[]>([])
  const [expandedSections, setExpandedSections] = useState({
    breakpoints: true,
    variables: true,
    callStack: true,
    console: false,
    performance: false,
  })

  // Convert legacy breakpoints to new format
  const allBreakpoints = Array.from(breakpoints.entries()).flatMap(([fileId, lines]) =>
    Array.from(lines).map((line) => ({ fileId, line })),
  )

  // Initialize breakpoints from legacy format
  useEffect(() => {
    const newBreakpoints: Breakpoint[] = []
    allBreakpoints.forEach(({ fileId, line }) => {
      const fileName = fileId // Convert fileId to file path as needed
      try {
        const bp = breakpointManager.addBreakpoint(fileName, line)
        newBreakpoints.push(bp)
      } catch (error) {
        // Breakpoint might already exist
      }
    })
    setCurrentBreakpoints(newBreakpoints)
  }, [breakpoints, allBreakpoints, breakpointManager])

  // Setup debugger event listeners
  useEffect(() => {
    const handleSessionStart = (session: any) => {
      setIsRunning(true)
      setIsPaused(false)
      debugConsole.addMessage('info', 'Debug session started', 'debugger')
    }

    const handleSessionEnd = (session: any) => {
      setIsRunning(false)
      setIsPaused(false)
      setCurrentVariables([])
      setCurrentCallStack([])
      debugConsole.addMessage('info', 'Debug session ended', 'debugger')
    }

    const handleDebugPaused = (session: any) => {
      setIsPaused(true)
      debugConsole.addMessage('info', 'Debug paused', 'debugger')
    }

    const handleDebugResumed = (session: any) => {
      setIsPaused(false)
      debugConsole.addMessage('info', 'Debug resumed', 'debugger')
    }

    const handleVariablesUpdated = (variables: Variable[]) => {
      setCurrentVariables(variables)
    }

    const handleCallStackUpdated = (callStack: CallFrame[]) => {
      setCurrentCallStack(callStack)
    }

    debuggerInstance.on('session_start', handleSessionStart)
    debuggerInstance.on('session_end', handleSessionEnd)
    debuggerInstance.on('debug_paused', handleDebugPaused)
    debuggerInstance.on('debug_resumed', handleDebugResumed)
    debuggerInstance.on('variables_updated', handleVariablesUpdated)
    debuggerInstance.on('call_stack_updated', handleCallStackUpdated)

    return () => {
      debuggerInstance.off('session_start', handleSessionStart)
      debuggerInstance.off('session_end', handleSessionEnd)
      debuggerInstance.off('debug_paused', handleDebugPaused)
      debuggerInstance.off('debug_resumed', handleDebugResumed)
      debuggerInstance.off('variables_updated', handleVariablesUpdated)
      debuggerInstance.off('call_stack_updated', handleCallStackUpdated)
    }
  }, [debuggerInstance, debugConsole])

  // Debug control handlers
  const handleStartDebug = useCallback(() => {
    console.log('Start debug button clicked')
    try {
      const session = debuggerInstance.startDebugging()
      performanceProfiler.startProfiling()
      debugConsole.addMessage('info', 'Starting debug session...', 'debugger')
      console.log('Debug session started:', session)
    } catch (error) {
      console.error('Error starting debug session:', error)
      debugConsole.addMessage('error', `Failed to start debug session: ${error}`, 'debugger')
    }
  }, [debuggerInstance, performanceProfiler, debugConsole])

  const handleStopDebug = useCallback(() => {
    console.log('Stop debug button clicked')
    try {
      debuggerInstance.stopDebugging()
      performanceProfiler.stopProfiling()
      debugConsole.addMessage('info', 'Stopping debug session...', 'debugger')
    } catch (error) {
      console.error('Error stopping debug session:', error)
      debugConsole.addMessage('error', `Failed to stop debug session: ${error}`, 'debugger')
    }
  }, [debuggerInstance, performanceProfiler, debugConsole])

  const handlePauseResume = useCallback(() => {
    console.log('Pause/Resume button clicked, isPaused:', isPaused)
    try {
      if (isPaused) {
        debuggerInstance.resumeDebugging()
        debugConsole.addMessage('info', 'Resuming debug session...', 'debugger')
      } else {
        debuggerInstance.pauseDebugging()
        debugConsole.addMessage('info', 'Pausing debug session...', 'debugger')
      }
    } catch (error) {
      console.error('Error pausing/resuming debug session:', error)
      debugConsole.addMessage('error', `Failed to pause/resume debug session: ${error}`, 'debugger')
    }
  }, [debuggerInstance, isPaused, debugConsole])

  const handleStepOver = useCallback(() => {
    console.log('Step over button clicked')
    try {
      debuggerInstance.stepOver()
      debugConsole.addMessage('debug', 'Step over', 'debugger')
    } catch (error) {
      console.error('Error stepping over:', error)
      debugConsole.addMessage('error', `Failed to step over: ${error}`, 'debugger')
    }
  }, [debuggerInstance, debugConsole])

  const handleStepInto = useCallback(() => {
    console.log('Step into button clicked')
    try {
      debuggerInstance.stepInto()
      debugConsole.addMessage('debug', 'Step into', 'debugger')
    } catch (error) {
      console.error('Error stepping into:', error)
      debugConsole.addMessage('error', `Failed to step into: ${error}`, 'debugger')
    }
  }, [debuggerInstance, debugConsole])

  const handleStepOut = useCallback(() => {
    console.log('Step out button clicked')
    try {
      debuggerInstance.stepOut()
      debugConsole.addMessage('debug', 'Step out', 'debugger')
    } catch (error) {
      console.error('Error stepping out:', error)
      debugConsole.addMessage('error', `Failed to step out: ${error}`, 'debugger')
    }
  }, [debuggerInstance, debugConsole])

  // Toggle section expansion
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  // Format variable value for display
  const formatVariableValue = useCallback((variable: Variable): string => {
    if (variable.value === null) return 'null'
    if (variable.value === undefined) return 'undefined'
    
    const type = typeof variable.value
    switch (type) {
      case 'string':
        return `"${variable.value}"`
      case 'object':
        if (Array.isArray(variable.value)) {
          return `Array(${variable.value.length})`
        }
        return 'Object'
      default:
        return String(variable.value)
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#b70000' }}>Debug</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Debug controls */}
      <div className="flex items-center gap-1 border-b border-border px-4 py-2">
        {/* Test button to verify basic functionality */}
        <Button
          size="sm"
          className="h-7 gap-1 bg-red-500 text-white hover:bg-red-600"
          onClick={() => {
            console.log('TEST BUTTON CLICKED - Basic React working')
            alert('Test button clicked! If you see this, React event handling is working.')
          }}
        >
          TEST
        </Button>
        {!isRunning ? (
          <Button
            size="sm"
            className="h-7 gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleStartDebug}
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handlePauseResume}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleStopDebug}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="mx-2 h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              disabled={!isPaused}
              onClick={handleStepOver}
            >
              <StepOver className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              disabled={!isPaused}
              onClick={handleStepInto}
            >
              <StepInto className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              disabled={!isPaused}
              onClick={handleStepOut}
            >
              <StepOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Breakpoints */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('breakpoints')}
            >
              {expandedSections.breakpoints ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              BREAKPOINTS
            </button>
            <span className="text-xs text-muted-foreground">{currentBreakpoints.length}</span>
          </div>
          {expandedSections.breakpoints && (
            <div className="px-4 pb-2">
              {currentBreakpoints.length === 0 ? (
                <p className="text-xs text-muted-foreground">Click on line numbers to add breakpoints</p>
              ) : (
                <div className="space-y-1">
                  {currentBreakpoints.map((bp) => (
                    <div key={bp.id} className="flex items-center gap-2 text-xs">
                      <Circle className={`h-2 w-2 ${bp.enabled ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                      <span className="text-muted-foreground">
                        {bp.file.split('/').pop()}:{bp.line}
                      </span>
                      {bp.condition && (
                        <span className="text-blue-500">({bp.condition})</span>
                      )}
                      <span className="text-muted-foreground ml-auto">
                        {bp.hitCount} hits
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Variables */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('variables')}
            >
              {expandedSections.variables ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              VARIABLES
            </button>
            <span className="text-xs text-muted-foreground">{currentVariables.length}</span>
          </div>
          {expandedSections.variables && (
            <div className="px-4 pb-2">
              {isRunning && isPaused ? (
                <div className="space-y-1">
                  {currentVariables.map((variable) => (
                    <div key={`${variable.name}:${variable.scope}`} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">
                        {variable.name}
                        <span className="text-muted-foreground ml-1">({variable.scope})</span>
                      </span>
                      <span className="text-muted-foreground">
                        {formatVariableValue(variable)}
                        <span className="text-blue-500 ml-1">{variable.type}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isRunning ? "Running..." : "Start debugging to see variables"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Call Stack */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('callStack')}
            >
              {expandedSections.callStack ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              CALL STACK
            </button>
            <span className="text-xs text-muted-foreground">{currentCallStack.length}</span>
          </div>
          {expandedSections.callStack && (
            <div className="px-4 pb-2">
              {isRunning && isPaused ? (
                <div className="space-y-1">
                  {currentCallStack.map((frame, index) => (
                    <div key={`${frame.id}:${index}`} className="text-xs">
                      <span className="text-foreground">{frame.name}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        at {frame.file.split('/').pop()}:{frame.line}:{frame.column}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isRunning ? "Running..." : "Start debugging to see call stack"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Debug Console */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('console')}
            >
              {expandedSections.console ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Bug className="h-3 w-3" />
              CONSOLE
            </button>
            <span className="text-xs text-muted-foreground">{debugConsole.getAllMessages().length}</span>
          </div>
          {expandedSections.console && (
            <div className="px-4 pb-2">
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugConsole.getAllMessages().slice(-10).map((message) => (
                  <div key={message.id} className="text-xs">
                    <span className={`${
                      message.type === 'error' ? 'text-red-500' :
                      message.type === 'warn' ? 'text-yellow-500' :
                      message.type === 'info' ? 'text-blue-500' :
                      'text-muted-foreground'
                    }`}>
                      {message.type.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground ml-2">{message.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance Profiler */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('performance')}
            >
              {expandedSections.performance ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Activity className="h-3 w-3" />
              PERFORMANCE
            </button>
            <span className="text-xs text-muted-foreground">
              {performanceProfiler.isActive() ? 'Active' : 'Inactive'}
            </span>
          </div>
          {expandedSections.performance && (
            <div className="px-4 pb-2">
              {performanceProfiler.isActive() ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">Duration</span>
                    <span className="text-muted-foreground">
                      {Math.round(performanceProfiler.getCurrentDuration())}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">Frames</span>
                    <span className="text-muted-foreground">
                      {performanceProfiler.getAllFrames().length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">Memory</span>
                    <span className="text-muted-foreground">
                      {performanceProfiler.getMemorySnapshots().length > 0 ? (
                        <span>{Math.round(performanceProfiler.getMemorySnapshots()[performanceProfiler.getMemorySnapshots().length - 1].usedJSHeapSize / 1024 / 1024)}MB</span>
                      ) : (
                        <span>N/A</span>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isRunning ? "Start profiling to see performance data" : "Start debugging to enable profiling"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
