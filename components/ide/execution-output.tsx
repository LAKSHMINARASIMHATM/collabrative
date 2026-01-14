"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Copy, Trash2, PlayCircle, StopCircle, Clock } from "lucide-react"
import type { ExecutionResult, ExecutionStatus } from "@/lib/execution/types"

interface ExecutionOutputProps {
    result: ExecutionResult | null
    status: ExecutionStatus
    language?: string
    onClear?: () => void
    onStop?: () => void
}

export function ExecutionOutput({
    result,
    status,
    language,
    onClear,
    onStop
}: ExecutionOutputProps) {
    const outputRef = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)

    // Auto-scroll to bottom
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [result])

    const handleCopy = async () => {
        if (result?.output) {
            await navigator.clipboard.writeText(result.output)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const getStatusBadge = () => {
        switch (status) {
            case 'running':
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <PlayCircle className="h-3 w-3 mr-1 animate-pulse" />
                        Running
                    </Badge>
                )
            case 'success':
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        ✓ Success
                    </Badge>
                )
            case 'error':
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        ✗ Error
                    </Badge>
                )
            case 'timeout':
                return (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                        ⏱ Timeout
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                        Idle
                    </Badge>
                )
        }
    }

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(2)}s`
    }

    const formatMemory = (bytes?: number) => {
        if (!bytes) return null
        if (bytes < 1024) return `${bytes}B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
    }

    return (
        <div className="flex flex-col h-full bg-card border-t border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">Output</span>
                    {getStatusBadge()}
                    {language && (
                        <Badge variant="secondary" className="text-xs">
                            {language}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {result && result.executionTime > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(result.executionTime)}
                            {result.memory && (
                                <span className="ml-2">• {formatMemory(result.memory)}</span>
                            )}
                        </div>
                    )}

                    {status === 'running' && onStop && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onStop}
                            className="h-7 px-2 text-xs"
                        >
                            <StopCircle className="h-3 w-3 mr-1" />
                            Stop
                        </Button>
                    )}

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        disabled={!result?.output}
                        className="h-7 px-2 text-xs"
                    >
                        <Copy className="h-3 w-3 mr-1" />
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClear}
                        disabled={!result}
                        className="h-7 px-2 text-xs"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                    </Button>
                </div>
            </div>

            {/* Output Content */}
            <ScrollArea className="flex-1">
                <div ref={outputRef} className="p-4 font-mono text-sm">
                    {!result && status === 'idle' && (
                        <div className="text-muted-foreground italic">
                            No output yet. Click "Run" to execute your code.
                        </div>
                    )}

                    {status === 'running' && !result && (
                        <div className="flex items-center gap-2 text-blue-600">
                            <PlayCircle className="h-4 w-4 animate-pulse" />
                            Running...
                        </div>
                    )}

                    {result && (
                        <div className="space-y-2">
                            {/* Standard Output */}
                            {result.stdout && (
                                <div className="text-foreground whitespace-pre-wrap">
                                    {result.stdout}
                                </div>
                            )}

                            {/* Standard Error */}
                            {result.stderr && (
                                <div className="text-red-500 whitespace-pre-wrap">
                                    {result.stderr}
                                </div>
                            )}

                            {/* Exit Code */}
                            {result.exitCode !== 0 && (
                                <div className="text-orange-500 text-xs mt-2">
                                    Exit code: {result.exitCode}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer with Stats */}
            {result && (
                <div className="px-4 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                        Status: {result.status.toUpperCase()}
                    </span>
                    <span>
                        {result.executionTime && `Execution Time: ${formatTime(result.executionTime)}`}
                    </span>
                </div>
            )}
        </div>
    )
}

export default ExecutionOutput
