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
import { Copy, Eye, EyeOff, RefreshCw, Users, Link2 } from "lucide-react"
import { toast } from "sonner"

interface ShareDialogProps {
  projectId: string
  children: React.ReactNode
}

export function ShareDialog({ projectId, children }: ShareDialogProps) {
  const [roomId, setRoomId] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const generateNewCredentials = () => {
    const newRoomId = generateRoomId()
    const newPassword = generatePassword()
    setRoomId(newRoomId)
    setPassword(newPassword)
    toast.success('New room credentials generated!')
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copied to clipboard!`)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error(`Failed to copy ${type}`)
    }
  }

  const copyShareLink = async () => {
    if (!roomId || !password) {
      toast.error('Please generate room credentials first')
      return
    }
    
    const shareUrl = `${window.location.origin}/collaborate/${roomId}?password=${password}`
    await copyToClipboard(shareUrl, 'Share link')
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !roomId && !password) {
      generateNewCredentials()
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
            Share Workspace
          </DialogTitle>
          <DialogDescription>
            Generate room credentials to collaborate with others in real-time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Room ID Section */}
          <div className="space-y-2">
            <Label htmlFor="roomId" className="text-sm font-medium">
              Room ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="roomId"
                value={roomId}
                readOnly
                placeholder="Click generate to create room ID"
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(roomId, 'Room ID')}
                disabled={!roomId}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  value={password}
                  readOnly
                  placeholder="Click generate to create password"
                  className="font-mono pr-10"
                  type={showPassword ? "text" : "password"}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={!password}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(password, 'Password')}
                disabled={!password}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Share Link Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Link</Label>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={copyShareLink}
              disabled={!roomId || !password}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Copy Share Link
            </Button>
          </div>

          {/* Generate New Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={generateNewCredentials}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New Credentials
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
