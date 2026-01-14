
"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { Send, Bot, User as UserIcon, Loader2, FileCode, X, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface AIAssistantPanelProps {
    activeFileContent?: string
    activeFileName?: string
    onClose: () => void
}

export function AIAssistantPanel({ activeFileContent, activeFileName, onClose }: AIAssistantPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [input, setInput] = useState('')

    const safeContext = useMemo(() => {
        try {
            if (!activeFileContent) return undefined;
            const safeFileName = (typeof activeFileName === 'string' ? activeFileName.trim() : 'untitled') || 'untitled';
            const safeContent = typeof activeFileContent === 'string' ? activeFileContent : '';
            return `File: ${safeFileName}\n\n${safeContent}`;
        } catch (err) {
            console.error('Error creating context:', err);
            return undefined;
        }
    }, [activeFileContent, activeFileName]);

    const { 
        messages = [], 
        status,
        sendMessage,
        stop 
    } = useChat({
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('AI Chat Error:', errorMessage);
            setError(`AI Error: ${errorMessage}`);
        }
    })

    const isLoading = status === 'streaming'

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (input.trim()) {
            sendMessage({ text: input })
            setInput('')
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value)
    }

    
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className={cn("flex h-full flex-col bg-sidebar border-l border-border", isExpanded ? "w-full" : "w-full")}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-accent" />
                    <h2 className="font-semibold">AI Assistant</h2>
                </div>
                <div className="flex items-center gap-1">
                    {/* 
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          */}
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:text-destructive">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Context Indicator */}
            {activeFileName && (
                <div className="bg-muted/30 px-4 py-2 text-xs flex items-center gap-2 border-b border-border">
                    <FileCode className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">Context: {activeFileName}</span>
                </div>
            )}

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground space-y-2">
                            <Bot className="h-8 w-8 opacity-50" />
                            <p className="text-sm">How can I help you code today?</p>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} className={cn("flex gap-3", m.role === 'user' ? "justify-end" : "justify-start")}>
                            {m.role !== 'user' && (
                                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-accent" />
                                </div>
                            )}

                            <div className={cn(
                                "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                                m.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                            )}>
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                                    {(m as any).content || JSON.stringify(m)}
                                </div>
                            </div>

                            {m.role === 'user' && (
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <UserIcon className="h-4 w-4 text-primary-foreground" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-accent" />
                            </div>
                            <div className="bg-muted rounded-lg px-3 py-2 flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border mt-auto">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask about your code..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    {isLoading ? (
                        <Button type="button" size="icon" variant="destructive" onClick={() => stop()}>
                            <X className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit" size="icon" disabled={!input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    )
}
