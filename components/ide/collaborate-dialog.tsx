"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Eye, EyeOff, Link2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CollaborateDialogProps {
  projectId: string
  children: React.ReactNode
}

export function CollaborateDialog({ projectId, children }: CollaborateDialogProps) {
  const [roomId, setRoomId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const parseShareLink = (link: string) => {
    try {
      const url = new URL(link)
      const pathParts = url.pathname.split('/')
      const roomIdFromPath = pathParts[pathParts.length - 1]
      const passwordFromParams = url.searchParams.get('password')
      
      if (roomIdFromPath && passwordFromParams) {
        setRoomId(roomIdFromPath)
        setPassword(passwordFromParams)
        toast.success('Room credentials extracted from share link!')
      }
    } catch (error) {
      toast.error('Invalid share link format')
    }
  }

  const handleJoinRoom = async () => {
    if (!roomId.trim() || !password.trim()) {
      toast.error('Please enter both room ID and password')
      return
    }

    setIsJoining(true)
    
    try {
      // Navigate to collaboration page with credentials
      const collaborateUrl = `/collaborate/${roomId}?password=${encodeURIComponent(password)}`
      
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push(collaborateUrl)
      toast.success('Joining collaboration room...')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to join room:', error)
      toast.error('Failed to join room. Please check credentials.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleShareLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value
    if (link.includes('collaborate')) {
      parseShareLink(link)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset form when closing
      setRoomId("")
      setPassword("")
      setShowPassword(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Collaboration Room
          </DialogTitle>
          <DialogDescription>
            Enter room ID and password to join a collaboration session, or paste a share link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Share Link Input */}
          <div className="space-y-2">
            <Label htmlFor="shareLink" className="text-sm font-medium">
              Share Link (Optional)
            </Label>
            <Input
              id="shareLink"
              placeholder="Paste share link here to auto-fill credentials"
              onChange={handleShareLinkPaste}
              className="font-mono text-sm"
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          {/* Room ID Input */}
          <div className="space-y-2">
            <Label htmlFor="roomId" className="text-sm font-medium">
              Room ID
            </Label>
            <Input
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room ID"
              className="font-mono"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                className="font-mono pr-10"
                type={showPassword ? "text" : "password"}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Join Button */}
          <Button
            className="w-full"
            onClick={handleJoinRoom}
            disabled={!roomId.trim() || !password.trim() || isJoining}
          >
            {isJoining ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Joining Room...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Join Room
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
