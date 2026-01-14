"use client"

import { Play, Pause, SkipForward, ArrowRight, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { Variable, StackFrame, Scope } from "@/lib/debug/debug-adapter"

interface AdvancedDebugPanelProps {
    isDebugging: boolean
    isPaused: boolean
    breakpoints: Map<string, Set<number>>
    stackFrames: StackFrame[]
    onStart: () => void
    onPause: () => void
    onContinue: () => void
    onStepOver: () => void
    onStepInto: () => void
    onStepOut: () => void
    onStop: () => void
}

export function AdvancedDebugPanel({
    isDebugging,
    isPaused,
    breakpoints,
    stackFrames,
    onStart,
    onPause,
    onContinue,
    onStepOver,
    onStepInto,
    onStepOut,
    onStop,
}: AdvancedDebugPanelProps) {
    const [activeTab, setActiveTab] = useState<"variables" | "watch" | "callstack" | "breakpoints">("variables")
    const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set(["local"]))

    // Mock variables for demonstration
    const mockVariables: Variable[] = [
        { name: "count", value: 42, type: "number" },
        { name: "message", value: "Hello World", type: "string" },
        { name: "isActive", value: true, type: "boolean" },
        { name: "user", value: { name: "John", age: 30 }, type: "object" },
    ]

    const toggleScope = (scopeName: string) => {
        setExpandedScopes(prev => {
            const next = new Set(prev)
            if (next.has(scopeName)) {
                next.delete(scopeName)
            } else {
                next.add(scopeName)
            }
            return next
        })
    }

    return (
        <div className="flex h-full flex-col border-r border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Debug</span>
            </div>

            {/* Debug Controls */}
            <div className="flex items-center gap-1 border-b border-border bg-muted/50 px-2 py-2">
                {!isDebugging ? (
                    <Button size="sm" variant="default" onClick={onStart} className="h-7">
                        <Play className="mr-1 h-3 w-3" />
                        Start
                    </Button>
                ) : (
                    <>
                        {isPaused ? (
                            <Button size="sm" variant="default" onClick={onContinue} className="h-7">
                                <Play className="h-3 w-3" />
                            </Button>
                        ) : (
                            <Button size="sm" variant="default" onClick={onPause} className="h-7">
                                <Pause className="h-3 w-3" />
                            </Button>
                        )}

                        <Button size="sm" variant="ghost" onClick={onStepOver} disabled={!isPaused} className="h-7">
                            <ArrowRight className="h-3 w-3" />
                        </Button>

                        <Button size="sm" variant="ghost" onClick={onStepInto} disabled={!isPaused} className="h-7">
                            <SkipForward className="h-3 w-3" />
                        </Button>

                        <Button size="sm" variant="ghost" onClick={onStepOut} disabled={!isPaused} className="h-7">
                            <ChevronDown className="h-3 w-3" />
                        </Button>

                        <div className="flex-1" />

                        <Button size="sm" variant="destructive" onClick={onStop} className="h-7">
                            Stop
                        </Button>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {(["variables", "watch", "callstack", "breakpoints"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${activeTab === tab
                            ? "border-b-2 border-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2">
                {activeTab === "variables" && (
                    <div className="space-y-1">
                        {/* Local Scope */}
                        <div>
                            <button
                                onClick={() => toggleScope("local")}
                                className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-muted"
                            >
                                {expandedScopes.has("local") ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                                Local
                            </button>

                            {expandedScopes.has("local") && (
                                <div className="ml-4 space-y-0.5">
                                    {mockVariables.map((variable) => (
                                        <div key={variable.name} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted">
                                            <span className="text-muted-foreground">{variable.name}:</span>
                                            <span className="font-mono text-accent">
                                                {typeof variable.value === "object"
                                                    ? JSON.stringify(variable.value)
                                                    : String(variable.value)}
                                            </span>
                                            <span className="text-muted-foreground">({variable.type})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "callstack" && (
                    <div className="space-y-1">
                        {stackFrames.length > 0 ? (
                            stackFrames.map((frame) => (
                                <div
                                    key={frame.id}
                                    className="rounded bg-muted px-2 py-1 text-xs"
                                >
                                    <div className="font-medium">{frame.name}</div>
                                    <div className="text-muted-foreground">
                                        {frame.file}:{frame.line}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-muted-foreground">No stack frames</div>
                        )}
                    </div>
                )}

                {activeTab === "breakpoints" && (
                    <div className="space-y-1">
                        {Array.from(breakpoints.entries()).map(([file, lines]) => (
                            <div key={file} className="space-y-0.5">
                                <div className="text-xs font-medium text-muted-foreground">{file}</div>
                                {Array.from(lines).map((line) => (
                                    <div key={line} className="ml-4 rounded bg-muted px-2 py-1 text-xs">
                                        Line {line}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {breakpoints.size === 0 && (
                            <div className="text-xs text-muted-foreground">No breakpoints set</div>
                        )}
                    </div>
                )}

                {activeTab === "watch" && (
                    <div className="text-xs text-muted-foreground">
                        Add watch expressions here
                    </div>
                )}
            </div>
        </div>
    )
}
