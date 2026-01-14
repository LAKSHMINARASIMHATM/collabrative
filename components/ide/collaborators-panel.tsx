import { useState, useEffect, useRef } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Circle, Eye, MousePointer2, Code, RefreshCw, Key } from "lucide-react"
import type { UserPresence } from "@/lib/collaboration/presence-manager"
import type { ChatMessage } from "@/lib/collaboration/types"
import { toast } from "sonner"
import { sendCollaborationLink } from "@/lib/collaboration/email-service"

interface User extends SupabaseUser {
  roomId?: string;
  roomPassword?: string;
}

interface RoomSettings {
  roomId: string;
  roomPassword: string;
}

interface EnhancedCollaboratorsPanelProps {
  user: User;
  activeUsers?: UserPresence[];
  onFollowUser?: (userId: string) => void;
  onSendMessage?: (content: string) => Promise<void>;
  onInviteCollaborator?: (email: string) => Promise<void>;
  messages?: ChatMessage[];
  onRoomSettingsChange?: (settings: RoomSettings) => void;
}

const DEFAULT_USERS: UserPresence[] = [];
const DEFAULT_MESSAGES: ChatMessage[] = [];

export function CollaboratorsPanel(props: EnhancedCollaboratorsPanelProps) {
  return <EnhancedCollaboratorsPanel {...props} />
}

export function EnhancedCollaboratorsPanel({
  user,
  activeUsers = DEFAULT_USERS,
  onFollowUser,
  onSendMessage,
  onInviteCollaborator,
  onRoomSettingsChange,
  messages: externalMessages = DEFAULT_MESSAGES,
}: EnhancedCollaboratorsPanelProps) {
  const [newMessage, setNewMessage] = useState("")
  const [followingUserId, setFollowingUserId] = useState<string | null>(null)
  console.log('EnhancedCollaboratorsPanel rendering with user:', user?.id);
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteSent, setInviteSent] = useState(false)
  const [editingRoom, setEditingRoom] = useState(false)
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({ roomId: 'default-room', roomPassword: '' })
  const [messages, setMessages] = useState<ChatMessage[]>(externalMessages)
  const [inviteUser, setInviteUser] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleRoomSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveRoomSettings = () => {
    if (onRoomSettingsChange) {
      onRoomSettingsChange(roomSettings);
    }
    setEditingRoom(false);
  };

  // Generate random room ID
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Create new room ID and password
  const createNewRoom = () => {
    console.log('createNewRoom function started');
    try {
      console.log('Step 1: Generating room ID');
      const newRoomId = generateRoomId();
      console.log('Step 2: Generated room ID:', newRoomId);
      
      console.log('Step 3: Generating password');
      const newPassword = generatePassword();
      console.log('Step 4: Generated password:', newPassword);
      
      console.log('Step 5: Creating new settings object');
      const newSettings = {
        roomId: newRoomId,
        roomPassword: newPassword
      };
      console.log('Step 6: Settings object created:', newSettings);
      
      console.log('Step 7: Updating room settings state');
      setRoomSettings(newSettings);
      
      console.log('Step 8: Checking if onRoomSettingsChange exists');
      if (onRoomSettingsChange) {
        console.log('Step 9: Calling onRoomSettingsChange');
        onRoomSettingsChange(newSettings);
        console.log('Step 10: onRoomSettingsChange called');
      } else {
        console.log('Step 9: onRoomSettingsChange is null/undefined');
      }
      
      console.log('Step 11: Showing success toast');
      toast.success('New room created! Room ID: ' + newRoomId);
      console.log('Step 12: createNewRoom completed successfully');
    } catch (error) {
      console.error('Error creating new room:', error);
      toast.error('Failed to create new room');
    }
  };

  // Simplified test version of createNewRoom
  const createNewRoomSimple = () => {
    console.log('createNewRoomSimple function started');
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let roomId = '';
      for (let i = 0; i < 8; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const chars2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars2.charAt(Math.floor(Math.random() * chars2.length));
      }
      
      console.log('Simple generated room:', roomId, password);
      alert(`Room ID: ${roomId}\nPassword: ${password}`);
      console.log('createNewRoomSimple completed successfully');
    } catch (error) {
      console.error('Error in createNewRoomSimple:', error);
      alert('Error creating room: ' + error);
    }
  };

  // Generate new password only
  const generateNewPassword = () => {
    console.log('generateNewPassword button clicked');
    try {
      const newPassword = generatePassword();
      console.log('Generated password:', newPassword);
      const newSettings = {
        ...roomSettings,
        roomPassword: newPassword
      };
      setRoomSettings(newSettings);
      if (onRoomSettingsChange) {
        onRoomSettingsChange(newSettings);
      }
      toast.success('New password generated!');
    } catch (error) {
      console.error('Error generating new password:', error);
      toast.error('Failed to generate new password');
    }
  };

  // Sync external messages
  useEffect(() => {
    setMessages(externalMessages)
  }, [externalMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    if (onSendMessage) {
      await onSendMessage(newMessage.trim())
    } else {
      // Fallback: local-only message
      const message: ChatMessage = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.email?.split("@")[0] || "You",
        content: newMessage.trim(),
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, message])
    }
    setNewMessage("")
  }

  const handleFollowUser = (userId: string) => {
    if (followingUserId === userId) {
      setFollowingUserId(null)
      onFollowUser?.("")
    } else {
      setFollowingUserId(userId)
      onFollowUser?.(userId)
    }
  }

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Online</Badge>
      case 'away':
        return <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Away</Badge>
      case 'offline':
        return <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-600 border-gray-500/20">Offline</Badge>
      default:
        return null
    }
  }

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'typing':
        return <Code className="h-3 w-3 animate-pulse" />
      case 'editing':
        return <Code className="h-3 w-3" />
      case 'viewing':
        return <Eye className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleInviteCollaborator = async () => {
    const email = inviteEmail.trim()

    // Validate email
    if (!email) {
      toast.error('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Check if inviting self
    if (email === user.email) {
      toast.error('You cannot invite yourself')
      return
    }

    try {
      if (onInviteCollaborator) {
        await onInviteCollaborator(email)
        toast.success(`Invitation sent to ${email}`)
      } else {
        // Send via email service
        const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'A collaborator'
        await sendCollaborationLink(email, user.id, userName, user.email || '')
        toast.success(`Invitation sent to ${email}`)
      }

      setInviteEmail('')
      setInviteSent(true)

      // Reset sent state and hide form after 2 seconds
      setTimeout(() => {
        setInviteSent(false)
        setShowInvite(false)
      }, 2000)
    } catch (error) {
      toast.error('Failed to send invitation')
      console.error('Invitation error:', error)
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#25591f' }}>
              Collaborators
            </span>
            <span className="text-xs text-muted-foreground ml-2">Your User ID: {user.id}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-xs">Room ID:</span>
              {editingRoom ? (
                <Input 
                  name="roomId"
                  value={roomSettings.roomId}
                  onChange={handleRoomSettingsChange}
                  className="h-7 text-xs w-32"
                />
              ) : (
                <div className="h-7 flex items-center px-2 text-xs bg-muted rounded w-32">
                {roomSettings.roomId}
              </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Password:</span>
              {editingRoom ? (
                <Input 
                  name="roomPassword"
                  type="password"
                  value={roomSettings.roomPassword}
                  onChange={handleRoomSettingsChange}
                  className="h-7 text-xs w-24"
                />
              ) : (
                <div className="h-7 flex items-center px-2 text-xs bg-muted rounded w-24">
                {roomSettings.roomPassword ? '••••••' : 'none'}
              </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={editingRoom ? saveRoomSettings : () => setEditingRoom(true)}
            >
              {editingRoom ? 'Save' : 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-red-500 text-white"
              onClick={() => {
                console.log('TEST BUTTON CLICKED - React events working!');
                alert('Test button clicked! If you see this, React events are working.');
              }}
              title="Test React events"
            >
              TEST
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-green-500 text-white"
              onClick={() => {
                console.log('SIMPLE ROOM BUTTON CLICKED');
                createNewRoomSimple();
              }}
              title="Create new room (simple version)"
            >
              SIMPLE
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                console.log('New Room button clicked directly', e);
                e.preventDefault();
                e.stopPropagation();
                try {
                  console.log('About to call createNewRoom');
                  createNewRoom();
                  console.log('createNewRoom called successfully');
                } catch (err) {
                  console.error('Error in button click handler:', err);
                }
              }}
              title="Create new room ID and password"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              New Room
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                console.log('New Password button clicked directly');
                generateNewPassword();
              }}
              title="Generate new password"
            >
              <Key className="h-3 w-3 mr-1" />
              New Password
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs bg-red-500 text-white"
              onClick={() => {
                console.log('TEST BUTTON CLICKED - React events working!');
                alert('Test button clicked!');
              }}
              title="Test React events"
            >
              TEST
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {activeUsers.length + 1}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowInvite(!showInvite)}
          >
            {showInvite ? 'Cancel' : '+ Invite'}
          </Button>
        </div>

        {/* Invite Section */}
        {showInvite && (
          <div className="mt-3 space-y-2">
            <Input
              type="email"
              placeholder="Enter email address..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInviteCollaborator()
                } else if (e.key === 'Escape') {
                  setInviteEmail('')
                  setShowInvite(false)
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={handleInviteCollaborator}
                disabled={!inviteEmail.trim() || inviteSent}
              >
                {inviteSent ? (
                  <>
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sent
                  </>
                ) : (
                  'Send Invite'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setInviteEmail('')
                  setShowInvite(false)
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Invite collaborators to join this session
            </p>
          </div>
        )}
      </div>

      {/* Share Link Section */}
      <div className="border-b border-border px-4 py-3 bg-muted/30">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Share Collaboration Link</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/collaborate/test-user-id` : ''}
              className="h-8 text-xs font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => {
                const link = typeof window !== 'undefined' ? `${window.location.origin}/collaborate/test-user-id` : ''
                navigator.clipboard.writeText(link)
                toast.success('Link copied to clipboard!')
              }}
              title="Copy link"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => {
                const link = typeof window !== 'undefined' ? `${window.location.origin}/collaborate/test-user-id` : ''
                const subject = 'Join my coding session'
                const body = `Join my real-time coding collaboration session:\n\n${link}\n\nClick the link to start collaborating!`
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
                toast.success('Opening email client...')
              }}
              title="Send via email"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Anyone with this link can join your session
          </p>
        </div>
      </div>

      {/* Collaboration Settings */}
      <div className="border-b border-border px-4 py-3 bg-muted/20">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-muted-foreground list-none">
            <span>Session Settings</span>
            <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-3 space-y-2">
            <label className="flex items-center justify-between text-xs">
              <span>Allow editing</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>Show cursors</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>Enable chat</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between text-xs">
              <span>Notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-7 text-xs mt-2"
              onClick={() => {
                if (confirm('End collaboration session for all users?')) {
                  toast.success('Session ended')
                }
              }}
            >
              End Session
            </Button>
          </div>
        </details>
      </div>
      <div className="border-b border-border h-48 overflow-auto">
        <div className="p-4 space-y-3">
          {/* Current User */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/5">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                  {user.email?.[0].toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">You</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
              Online
            </Badge>
          </div>

          {/* Other Users */}
          {activeUsers.map((collaborator) => (
            <div
              key={collaborator.userId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors group"
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    style={{ backgroundColor: collaborator.color }}
                    className="text-white text-xs font-medium"
                  >
                    {collaborator.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {collaborator.status === 'online' && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                )}
                {collaborator.status === 'away' && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-yellow-500 text-yellow-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{collaborator.userName}</span>
                  {getActivityIcon(collaborator.activity)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {collaborator.isTyping ? (
                    <span className="text-accent">typing...</span>
                  ) : collaborator.currentFile ? (
                    <span>{collaborator.currentFile}</span>
                  ) : (
                    <span>{collaborator.userEmail}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                {getStatusBadge(collaborator.status)}
                <Button
                  size="sm"
                  variant={followingUserId === collaborator.userId ? "default" : "ghost"}
                  className="h-6 px-2 text-xs"
                  onClick={() => handleFollowUser(collaborator.userId)}
                >
                  <MousePointer2 className="h-3 w-3 mr-1" />
                  {followingUserId === collaborator.userId ? "Following" : "Follow"}
                </Button>
              </div>
            </div>
          ))}

          {activeUsers.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No other collaborators online
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chat
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`text-sm ${message.userId === user.id ? 'text-right' : ''}`}
                >
                  <div className={`inline-block max-w-[85%] ${message.userId === user.id ? 'bg-accent text-accent-foreground' : 'bg-muted'} rounded-lg p-3`}>
                    {message.userId !== user.id && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs">{message.userName}</span>
                        <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
                      </div>
                    )}
                    <p className="text-sm break-words">{message.content}</p>
                    {message.userId === user.id && (
                      <div className="text-right mt-1">
                        <span className="text-xs opacity-60">{formatTime(message.timestamp)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="border-t border-border p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
