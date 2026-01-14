"use client"

import { useEffect, useState } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import dynamic from "next/dynamic"

// Dynamically import IDEWorkspace with no SSR to prevent Monaco Editor errors
const IDEWorkspace = dynamic(
    () => import("@/components/ide/ide-workspace").then(mod => ({ default: mod.IDEWorkspace })),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="text-muted-foreground">Loading IDE...</p>
                </div>
            </div>
        )
    }
)

export default function TestEditorPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                // Use mock user for testing
                const mockUser = {
                    id: "test-user-id",
                    email: "test@example.com",
                    aud: "authenticated",
                    role: "authenticated",
                    app_metadata: {},
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                } as User
                setUser(mockUser)
            } else {
                setUser(user)
            }
            setLoading(false)
        })
    }, [])

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return <IDEWorkspace projectId="test-project" user={user} />
}
