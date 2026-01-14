"use client"

import { useState } from "react"
import { Search, Replace, CaseSensitive, Regex, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface FindReplaceProps {
    onFind: (query: string, options: FindOptions) => void
    onReplace: (findText: string, replaceText: string, options: FindOptions) => void
    onReplaceAll: (findText: string, replaceText: string, options: FindOptions) => void
    onClose: () => void
}

export interface FindOptions {
    caseSensitive: boolean
    wholeWord: boolean
    regex: boolean
    searchInAllFiles: boolean
}

export function FindReplace({ onFind, onReplace, onReplaceAll, onClose }: FindReplaceProps) {
    const [findText, setFindText] = useState("")
    const [replaceText, setReplaceText] = useState("")
    const [showReplace, setShowReplace] = useState(false)
    const [options, setOptions] = useState<FindOptions>({
        caseSensitive: false,
        wholeWord: false,
        regex: false,
        searchInAllFiles: false,
    })

    const handleFind = () => {
        if (findText) {
            onFind(findText, options)
        }
    }

    const handleReplace = () => {
        if (findText && replaceText) {
            onReplace(findText, replaceText, options)
        }
    }

    const handleReplaceAll = () => {
        if (findText && replaceText) {
            onReplaceAll(findText, replaceText, options)
        }
    }

    return (
        <div className="border-b border-border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Find and Replace</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Find Input */}
            <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleFind()
                        }}
                        placeholder="Find"
                        className="h-8 pl-7 text-sm"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={handleFind}>
                    Find
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowReplace(!showReplace)}>
                    <Replace className="h-4 w-4" />
                </Button>
            </div>

            {/* Replace Input */}
            {showReplace && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative flex-1">
                        <Replace className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            placeholder="Replace"
                            className="h-8 pl-7 text-sm"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReplace}>
                        Replace
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReplaceAll}>
                        All
                    </Button>
                </div>
            )}

            {/* Options */}
            <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                        checked={options.caseSensitive}
                        onCheckedChange={(checked) =>
                            setOptions({ ...options, caseSensitive: checked as boolean })
                        }
                    />
                    <CaseSensitive className="h-3 w-3" />
                    <span className="text-xs">Match Case</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                        checked={options.wholeWord}
                        onCheckedChange={(checked) =>
                            setOptions({ ...options, wholeWord: checked as boolean })
                        }
                    />
                    <span className="text-xs">Whole Word</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                        checked={options.regex}
                        onCheckedChange={(checked) =>
                            setOptions({ ...options, regex: checked as boolean })
                        }
                    />
                    <Regex className="h-3 w-3" />
                    <span className="text-xs">Regex</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                        checked={options.searchInAllFiles}
                        onCheckedChange={(checked) =>
                            setOptions({ ...options, searchInAllFiles: checked as boolean })
                        }
                    />
                    <span className="text-xs">All Files</span>
                </label>
            </div>
        </div>
    )
}
