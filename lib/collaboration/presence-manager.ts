/**
 * Presence Management System
 * 
 * Tracks and manages real-time presence information for all collaborators
 * including online status, cursor positions, selections, and activity.
 */

export interface CursorPosition {
    line: number
    column: number
    file?: string
}

export interface TextSelection {
    start: { line: number; column: number }
    end: { line: number; column: number }
    file?: string
}

export type UserStatus = 'online' | 'away' | 'offline'
export type ActivityType = 'typing' | 'idle' | 'viewing' | 'editing'

export interface UserPresence {
    userId: string
    userName: string
    userEmail: string
    avatar?: string
    color: string
    status: UserStatus
    activity: ActivityType
    lastSeen: Date
    cursor?: CursorPosition
    selection?: TextSelection
    isTyping: boolean
    currentFile?: string
}

export interface PresenceUpdate {
    userId: string
    cursor?: CursorPosition
    selection?: TextSelection
    activity?: ActivityType
    currentFile?: string
    isTyping?: boolean
}

/**
 * Color palette for user cursors
 */
const USER_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
]

export class PresenceManager {
    private users = new Map<string, UserPresence>()
    private userColorIndex = 0
    private activityTimers = new Map<string, NodeJS.Timeout>()
    private awayTimeout = 5 * 60 * 1000 // 5 minutes
    private offlineTimeout = 15 * 60 * 1000 // 15 minutes

    private onChange?: (users: UserPresence[]) => void

    constructor(onChange?: (users: UserPresence[]) => void) {
        this.onChange = onChange
    }

    /**
     * Add or update a user's presence
     */
    addUser(
        userId: string,
        userName: string,
        userEmail: string,
        avatar?: string
    ): void {
        if (!this.users.has(userId)) {
            const user: UserPresence = {
                userId,
                userName,
                userEmail,
                avatar,
                color: this.assignColor(),
                status: 'online',
                activity: 'viewing',
                lastSeen: new Date(),
                isTyping: false,
            }
            this.users.set(userId, user)
            this.scheduleInactivityCheck(userId)
            this.notifyChange()
        }
    }

    /**
     * Remove a user from presence tracking
     */
    removeUser(userId: string): void {
        this.users.delete(userId)
        this.clearActivityTimer(userId)
        this.notifyChange()
    }

    /**
     * Update user's presence information
     */
    updatePresence(update: PresenceUpdate): void {
        const user = this.users.get(update.userId)
        if (!user) return

        // Update fields
        if (update.cursor) user.cursor = update.cursor
        if (update.selection) user.selection = update.selection
        if (update.activity) user.activity = update.activity
        if (update.currentFile !== undefined) user.currentFile = update.currentFile
        if (update.isTyping !== undefined) user.isTyping = update.isTyping

        // Update last seen and status
        user.lastSeen = new Date()
        if (user.status !== 'online') {
            user.status = 'online'
        }

        // Reset inactivity timer
        this.scheduleInactivityCheck(update.userId)
        this.notifyChange()
    }

    /**
     * Update user's cursor position
     */
    updateCursor(userId: string, cursor: CursorPosition): void {
        this.updatePresence({ userId, cursor })
    }

    /**
     * Update user's text selection
     */
    updateSelection(userId: string, selection: TextSelection): void {
        this.updatePresence({ userId, selection })
    }

    /**
     * Set user's typing indicator
     */
    setTyping(userId: string, isTyping: boolean): void {
        this.updatePresence({ userId, isTyping, activity: isTyping ? 'typing' : 'editing' })
    }

    /**
     * Update user's current file
     */
    updateCurrentFile(userId: string, file: string): void {
        this.updatePresence({ userId, currentFile: file })
    }

    /**
     * Get all active users
     */
    getActiveUsers(): UserPresence[] {
        return Array.from(this.users.values()).filter(u => u.status !== 'offline')
    }

    /**
     * Get all users (including offline)
     */
    getAllUsers(): UserPresence[] {
        return Array.from(this.users.values())
    }

    /**
     * Get a specific user's presence
     */
    getUser(userId: string): UserPresence | undefined {
        return this.users.get(userId)
    }

    /**
     * Get online user count
     */
    getOnlineCount(): number {
        return Array.from(this.users.values()).filter(u => u.status === 'online').length
    }

    /**
     * Assign a unique color to a user
     */
    private assignColor(): string {
        const color = USER_COLORS[this.userColorIndex % USER_COLORS.length]
        this.userColorIndex++
        return color
    }

    /**
     * Schedule inactivity check for a user
     */
    private scheduleInactivityCheck(userId: string): void {
        this.clearActivityTimer(userId)

        const timer = setTimeout(() => {
            const user = this.users.get(userId)
            if (!user) return

            const now = Date.now()
            const timeSinceLastSeen = now - user.lastSeen.getTime()

            if (timeSinceLastSeen >= this.offlineTimeout) {
                user.status = 'offline'
                this.notifyChange()
            } else if (timeSinceLastSeen >= this.awayTimeout) {
                user.status = 'away'
                this.notifyChange()
                // Schedule another check for offline
                this.scheduleInactivityCheck(userId)
            }
        }, this.awayTimeout)

        this.activityTimers.set(userId, timer)
    }

    /**
     * Clear activity timer for a user
     */
    private clearActivityTimer(userId: string): void {
        const timer = this.activityTimers.get(userId)
        if (timer) {
            clearTimeout(timer)
            this.activityTimers.delete(userId)
        }
    }

    /**
     * Notify listeners of presence changes
     */
    private notifyChange(): void {
        this.onChange?.(this.getActiveUsers())
    }

    /**
     * Export presence data for transmission
     */
    exportPresence(userId: string): any {
        const user = this.users.get(userId)
        if (!user) return null

        return {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            avatar: user.avatar,
            color: user.color,
            status: user.status,
            activity: user.activity,
            cursor: user.cursor,
            selection: user.selection,
            isTyping: user.isTyping,
            currentFile: user.currentFile,
            lastSeen: user.lastSeen.toISOString(),
        }
    }

    /**
     * Import presence data from remote
     */
    importPresence(data: any): void {
        if (!data || !data.userId) return

        const user: UserPresence = {
            userId: data.userId,
            userName: data.userName || 'Unknown',
            userEmail: data.userEmail || '',
            avatar: data.avatar,
            color: data.color || this.assignColor(),
            status: data.status || 'online',
            activity: data.activity || 'viewing',
            lastSeen: data.lastSeen ? new Date(data.lastSeen) : new Date(),
            cursor: data.cursor,
            selection: data.selection,
            isTyping: data.isTyping || false,
            currentFile: data.currentFile,
        }

        this.users.set(user.userId, user)
        this.scheduleInactivityCheck(user.userId)
        this.notifyChange()
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.activityTimers.forEach(timer => clearTimeout(timer))
        this.activityTimers.clear()
        this.users.clear()
    }
}

/**
 * Hook for easier integration with React components
 */
export function createPresenceManager(
    onChange?: (users: UserPresence[]) => void
): PresenceManager {
    return new PresenceManager(onChange)
}
