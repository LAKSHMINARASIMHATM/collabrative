"use client"

import { createClient } from "@liveblocks/client"
import { createLiveblocksContext } from "@liveblocks/react"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"

// Liveblocks client setup
const liveblocksClient = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "",
  throttle: 16,
})

// Create Liveblocks context
export const LiveblocksProvider = createLiveblocksContext(liveblocksClient)

// Room management utilities
export class CollaborativeRoomManager {
  private client: ReturnType<typeof createClient>
  private supabase: ReturnType<typeof createSupabaseClient>

  constructor() {
    this.client = liveblocksClient
    this.supabase = createSupabaseClient()
  }

  // Join a collaborative room
  async joinRoom(roomId: string, password: string, user: any) {
    try {
      // Verify room password (you'd implement this check with your backend)
      const isValid = await this.verifyRoomPassword(roomId, password)
      if (!isValid) {
        throw new Error("Invalid room credentials")
      }

      // Enter the Liveblocks room
      const room = this.client.enter(roomId, {
        userInfo: {
          name: user.email?.split("@")[0] || "Anonymous",
          color: this.getUserColor(user.id),
          avatar: user.user_metadata?.avatar_url || "",
        },
      })

      return room
    } catch (error) {
      console.error("Failed to join room:", error)
      throw error
    }
  }

  // Create a new collaborative room
  async createRoom(user: any) {
    try {
      const roomId = this.generateRoomId()
      const password = this.generatePassword()

      // Store room info in your database (optional)
      await this.storeRoomInfo(roomId, password, user.id)

      // Enter the room as the creator
      const room = this.client.enter(roomId, {
        userInfo: {
          name: user.email?.split("@")[0] || "Anonymous",
          color: this.getUserColor(user.id),
          avatar: user.user_metadata?.avatar_url || "",
        },
      })

      return { room, roomId, password }
    } catch (error) {
      console.error("Failed to create room:", error)
      throw error
    }
  }

  // Leave a room
  async leaveRoom(roomId: string) {
    try {
      await this.client.leave(roomId)
    } catch (error) {
      console.error("Failed to leave room:", error)
    }
  }

  // Generate random room ID
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Generate random password
  private generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Get user color based on ID
  private getUserColor(userId: string): string {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"
    ]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Verify room password (implement with your backend)
  private async verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
    // This is a mock implementation - you'd verify against your database
    // For now, we'll accept any 8-char room ID and 12-char password
    return roomId.length === 8 && password.length >= 8
  }

  // Store room information (implement with your backend)
  private async storeRoomInfo(roomId: string, password: string, userId: string) {
    // This would store room info in your database
    // For now, we'll just log it
    console.log(`Room created: ${roomId} by user ${userId}`)
  }
}

// Hook for collaborative functionality
export function useCollaborativeRoom() {
  const roomManager = new CollaborativeRoomManager()
  
  return {
    joinRoom: roomManager.joinRoom.bind(roomManager),
    createRoom: roomManager.createRoom.bind(roomManager),
    leaveRoom: roomManager.leaveRoom.bind(roomManager),
  }
}
