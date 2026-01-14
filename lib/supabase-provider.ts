import * as Y from "yjs"
import { Awareness, applyAwarenessUpdate, encodeAwarenessUpdate } from "y-protocols/awareness"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { MessageBatcher, AwarenessBatcher } from "@/lib/collaboration/message-batcher"
import { compressUpdate, decompressUpdate, shouldCompress } from "@/lib/collaboration/compression"
import { PresenceManager, type UserPresence } from "@/lib/collaboration/presence-manager"

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export class SupabaseProvider {
    public doc: Y.Doc
    public awareness: Awareness
    public presenceManager: PresenceManager
    private channel: RealtimeChannel
    private projectId: string
    private userId: string
    private userName: string
    private synced = false
    private connectionStatus: ConnectionStatus = 'connecting'
    private reconnectAttempts = 0
    private maxReconnectAttempts = 10
    private reconnectTimeout: NodeJS.Timeout | null = null
    private messageBatcher: MessageBatcher
    private awarenessBatcher: AwarenessBatcher
    private onSyncCallback?: (synced: boolean) => void
    private onStatusCallback?: (status: ConnectionStatus) => void
    private onPresenceCallback?: (users: UserPresence[]) => void

    constructor(projectId: string, userId: string, doc: Y.Doc, userName?: string) {
        this.doc = doc
        this.projectId = projectId
        this.userId = userId
        this.userName = userName || userId

        // Create awareness with proper y-protocols implementation
        this.awareness = new Awareness(doc)

        // Initialize presence manager
        this.presenceManager = new PresenceManager((users) => {
            this.onPresenceCallback?.(users)
        })

        // Set up Supabase Realtime channel
        const supabase = createClient()
        this.channel = supabase.channel(`project:${projectId}`, {
            config: {
                broadcast: {
                    self: false, // Don't receive our own broadcasts
                },
            },
        })

        // Initialize message batchers
        this.messageBatcher = new MessageBatcher(
            async (batch) => {
                for (const msg of batch) {
                    await this.channel.send({
                        type: msg.type,
                        event: msg.event,
                        payload: msg.payload,
                    })
                }
            },
            { batchInterval: 100, maxBatchSize: 50 }
        )

        this.awarenessBatcher = new AwarenessBatcher(
            async (batch) => {
                for (const msg of batch) {
                    await this.channel.send({
                        type: msg.type,
                        event: msg.event,
                        payload: msg.payload,
                    })
                }
            },
            { batchInterval: 50 }
        )

        this.setupRealtimeSync()
    }

    private setupRealtimeSync() {
        // Subscribe to document updates
        this.channel
            .on("broadcast", { event: "doc-update" }, ({ payload }) => {
                if (payload.userId !== this.userId) {
                    try {
                        // Decompress if compressed
                        const update = payload.compressed
                            ? decompressUpdate(payload.update)
                            : new Uint8Array(payload.update)
                        Y.applyUpdate(this.doc, update, this)
                    } catch (error) {
                        console.error('Failed to apply document update:', error)
                    }
                }
            })
            .on("broadcast", { event: "presence" }, ({ payload }) => {
                if (payload.userId !== this.userId) {
                    this.presenceManager.importPresence(payload)
                }
            })
            .on("broadcast", { event: "awareness" }, ({ payload }) => {
                if (payload.userId === this.userId) return
                try {
                    if (payload.update) {
                        applyAwarenessUpdate(this.awareness, new Uint8Array(payload.update), this)
                        return
                    }

                    if (payload.clientID && payload.states) {
                        const clientID = Number(payload.clientID)
                        const state = payload.states?.[clientID]
                        if (state && !isNaN(clientID)) {
                            this.awareness.states.set(clientID, state)
                        }
                    }
                } catch (error) {
                    console.error('Failed to update awareness:', error)
                }
            })
            .on("broadcast", { event: "request-state" }, async ({ payload }) => {
                if (!payload?.userId || payload.userId === this.userId) return
                try {
                    const update = Y.encodeStateAsUpdate(this.doc)
                    await this.channel.send({
                        type: "broadcast",
                        event: "sync-state",
                        payload: {
                            toUserId: payload.userId,
                            fromUserId: this.userId,
                            update: Array.from(update),
                        },
                    })
                } catch (error) {
                    console.error("Failed to respond to request-state:", error)
                }
            })
            .on("broadcast", { event: "sync-state" }, ({ payload }) => {
                if (!payload?.toUserId || payload.toUserId !== this.userId) return
                if (!payload.update) return
                try {
                    Y.applyUpdate(this.doc, new Uint8Array(payload.update), this)
                } catch (error) {
                    console.error("Failed to apply sync-state:", error)
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    this.reconnectAttempts = 0
                    this.updateConnectionStatus('connected')

                    // Request initial state from other clients
                    try {
                        await this.channel.send({
                            type: "broadcast",
                            event: "request-state",
                            payload: { userId: this.userId },
                        })

                        // Send our initial awareness state
                        const awarenessUpdate = encodeAwarenessUpdate(this.awareness, [this.awareness.clientID])
                        await this.channel.send({
                            type: "broadcast",
                            event: "awareness",
                            payload: {
                                userId: this.userId,
                                update: Array.from(awarenessUpdate),
                            },
                        })

                        this.synced = true
                        this.onSyncCallback?.(true)
                    } catch (error) {
                        console.error('Failed to send initial state:', error)
                    }
                } else if (status === "CHANNEL_ERROR") {
                    console.error('Channel error occurred')
                    this.updateConnectionStatus('error')
                    this.attemptReconnect()
                } else if (status === "TIMED_OUT") {
                    console.warn('Channel subscription timed out')
                    this.updateConnectionStatus('disconnected')
                    this.attemptReconnect()
                } else if (status === "CLOSED") {
                    console.warn('Channel closed')
                    this.updateConnectionStatus('disconnected')
                    this.attemptReconnect()
                }
            })

        // Listen for local document updates
        this.doc.on("update", (update: Uint8Array, origin: any) => {
            // Only broadcast if the update didn't come from remote
            if (origin !== this) {
                // Compress large updates
                const shouldCompressUpdate = shouldCompress(update)
                const payload = {
                    userId: this.userId,
                    update: shouldCompressUpdate ? compressUpdate(update) : Array.from(update),
                    compressed: shouldCompressUpdate,
                }

                // Use message batcher for efficiency
                this.messageBatcher.enqueue("broadcast", "doc-update", payload)
            }
        })

        // Listen for local awareness changes
        this.awareness.on("update", ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
            const changed = added.concat(updated).concat(removed)
            if (changed.length === 0) return

            const update = encodeAwarenessUpdate(this.awareness, changed)
            this.awarenessBatcher.enqueue("broadcast", "awareness", {
                userId: this.userId,
                update: Array.from(update),
            })
        })
    }

    private updateConnectionStatus(status: ConnectionStatus) {
        this.connectionStatus = status
        this.onStatusCallback?.(status)
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached')
            this.updateConnectionStatus('error')
            return
        }

        // Clear any existing timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, etc.
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
        this.reconnectAttempts++

        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)
        this.updateConnectionStatus('connecting')

        this.reconnectTimeout = setTimeout(() => {
            this.channel.subscribe()
        }, delay)
    }

    public on(event: "synced", callback: (synced: boolean) => void): void
    public on(event: "status", callback: (status: ConnectionStatus) => void): void
    public on(event: "presence", callback: (users: UserPresence[]) => void): void
    public on(event: string, callback: any): void {
        if (event === "synced") {
            this.onSyncCallback = callback
            if (this.synced) {
                callback(true)
            }
        } else if (event === "status") {
            this.onStatusCallback = callback
            // Immediately call with current status
            callback(this.connectionStatus)
        } else if (event === "presence") {
            this.onPresenceCallback = callback
            // Immediately call with current users
            callback(this.presenceManager.getActiveUsers())
        }
    }

    public getPresenceManager(): PresenceManager {
        return this.presenceManager
    }

    public getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus
    }

    public destroy() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }
        this.messageBatcher.destroy()
        this.awarenessBatcher.destroy()
        this.presenceManager.destroy()
        this.awareness.destroy()
        this.channel.unsubscribe()
    }
}

export default SupabaseProvider
