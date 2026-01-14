/**
 * Collaboration Type Definitions
 * 
 * Centralized types for the collaboration system
 */

import type { UserPresence, CursorPosition, TextSelection } from './presence-manager'

export type { UserPresence, CursorPosition, TextSelection }

/**
 * Chat message types
 */
export interface ChatMessage {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    content: string
    timestamp: Date
    edited?: boolean
    reactions?: MessageReaction[]
}

export interface MessageReaction {
    emoji: string
    userId: string
    userName: string
}

/**
 * Collaboration events
 */
export type CollaborationEvent =
    | 'user-joined'
    | 'user-left'
    | 'cursor-moved'
    | 'selection-changed'
    | 'file-opened'
    | 'typing-started'
    | 'typing-stopped'
    | 'message-sent'

export interface CollaborationEventData {
    event: CollaborationEvent
    userId: string
    data?: any
    timestamp: Date
}

/**
 * File activity tracking
 */
export interface FileActivity {
    fileId: string
    fileName: string
    activeUsers: string[] // user IDs
    lastModified: Date
    modifiedBy?: string
}

/**
 * Sync status
 */
export type SyncStatus = 'synced' | 'syncing' | 'conflict' | 'error'

export interface SyncState {
    status: SyncStatus
    lastSynced?: Date
    pendingChanges: number
    conflictCount: number
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    latency: number // milliseconds
    bandwidthUsed: number // bytes
    messagesPerSecond: number
    compressionRatio: number
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
}

/**
 * Collaboration session
 */
export interface CollaborationSession {
    sessionId: string
    projectId: string
    startedAt: Date
    participants: UserPresence[]
    messagesExchanged: number
    documentsEdited: string[]
}
