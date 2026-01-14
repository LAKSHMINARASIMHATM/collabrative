"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CollaborativeEditor } from "@/components/ide/collaborative-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowLeft, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

function CollaborativeIDEContent() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const password = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('password') : null
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Use mock user for testing
        const mockUser = {
          id: "collab-user-id",
          email: "collab@example.com",
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

  const copyShareLink = async () => {
    if (!roomId || !password) return

    const shareUrl = `${window.location.origin}/collaborate/${roomId}?password=${password}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Share link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const leaveRoom = () => {
    router.push('/test-editor')
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading collaborative workspace...</p>
        </div>
      </div>
    )
  }

  if (!password) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Invalid Room Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              This room requires a password. Please use a valid share link.
            </p>
            <Button onClick={() => router.push('/test-editor')} className="w-full">
              Return to IDE
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Collaborative Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={leaveRoom}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Room
          </Button>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Room: {roomId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>

          <div className="flex items-center gap-2 px-3 py-1 bg-accent rounded-md">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-accent-foreground">Connected</span>
          </div>
        </div>
      </header>

      {/* Collaborative Editor */}
      <div className="flex-1">
        <CollaborativeEditor
          roomId={roomId}
          user={user}
          language="javascript"
          theme="vs-dark"
        />
      </div>
    </div>
  )
}

export default function CollaborativeIDEPage() {
  return (
    <CollaborativeIDEContent />
  )
}
