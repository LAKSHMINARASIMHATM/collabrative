"use client"

import { ChevronRight, Home, Folder } from "lucide-react"

interface BreadcrumbProps {
    path: string
    onNavigate: (path: string) => void
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
    const segments = path.split("/").filter(Boolean)

    return (
        <div className="flex items-center gap-1 border-b border-border bg-card px-4 py-1.5 text-xs">
            <button
                onClick={() => onNavigate("/")}
                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
                <Home className="h-3 w-3" />
            </button>

            {segments.map((segment, index) => {
                const segmentPath = "/" + segments.slice(0, index + 1).join("/")
                const isLast = index === segments.length - 1

                return (
                    <div key={segmentPath} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <button
                            onClick={() => onNavigate(segmentPath)}
                            className={`transition-colors ${isLast
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {segment}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
