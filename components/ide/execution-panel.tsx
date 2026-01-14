"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Play, Square } from "lucide-react"
import { ExecutionOutput } from "./execution-output"
import { getExecutionManager } from "@/lib/execution/execution-manager"
import type { ExecutionResult, ExecutionStatus, SupportedLanguage } from "@/lib/execution/types"
import { LANGUAGE_CONFIGS } from "@/lib/execution/types"

interface ExecutionPanelProps {
    code: string
    initialLanguage?: SupportedLanguage
    onLanguageChange?: (language: SupportedLanguage) => void
}

export function ExecutionPanel({ code, initialLanguage = 'javascript', onLanguageChange }: ExecutionPanelProps) {
    const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage)
    const [status, setStatus] = useState<ExecutionStatus>('idle')
    const [result, setResult] = useState<ExecutionResult | null>(null)

    const executionManager = getExecutionManager()

    const handleRun = async () => {
        if (!code.trim()) {
            setResult({
                status: 'error',
                stdout: '',
                stderr: 'No code to execute',
                output: 'No code to execute',
                exitCode: 1,
                executionTime: 0,
                error: 'No code to execute',
            })
            return
        }

        setStatus('running')
        setResult(null)

        try {
            const execResult = await executionManager.execute(code, language, {
                timeout: 30000,
            })

            setResult(execResult)
            setStatus(execResult.status)
        } catch (error) {
            setResult({
                status: 'error',
                stdout: '',
                stderr: error instanceof Error ? error.message : 'Execution failed',
                output: error instanceof Error ? error.message : 'Execution failed',
                exitCode: 1,
                executionTime: 0,
                error: error instanceof Error ? error.message : 'Execution failed',
            })
            setStatus('error')
        }
    }

    const handleStop = () => {
        executionManager.stop()
        setStatus('idle')
    }

    const handleClear = () => {
        setResult(null)
        setStatus('idle')
    }

    const handleLanguageChange = (newLanguage: string) => {
        const lang = newLanguage as SupportedLanguage
        setLanguage(lang)
        onLanguageChange?.(lang)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Controls */}
            <Card className="p-3 mb-2">
                <div className="flex items-center gap-3">
                    <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                    {config.icon} {config.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex-1" />

                    {status === 'running' ? (
                        <Button onClick={handleStop} variant="destructive" size="sm">
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                        </Button>
                    ) : (
                        <Button onClick={handleRun} variant="default" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Run Code
                        </Button>
                    )}
                </div>
            </Card>

            {/* Output */}
            <div className="flex-1 min-h-0">
                <ExecutionOutput
                    result={result}
                    status={status}
                    language={LANGUAGE_CONFIGS[language].name}
                    onClear={handleClear}
                    onStop={status === 'running' ? handleStop : undefined}
                />
            </div>
        </div>
    )
}

export default ExecutionPanel
