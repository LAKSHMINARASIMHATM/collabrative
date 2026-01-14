/**
 * Message Batching System
 * 
 * Batches multiple small WebSocket messages into single transmissions
 * to reduce network overhead and improve performance.
 */

interface QueuedMessage {
    type: string
    event: string
    payload: any
    timestamp: number
}

export interface BatcherConfig {
    batchInterval?: number // milliseconds
    maxBatchSize?: number  // maximum messages per batch
    maxWaitTime?: number   // maximum time to wait before forcing flush
}

export class MessageBatcher {
    private queue: QueuedMessage[] = []
    protected timer: NodeJS.Timeout | null = null
    protected config: Required<BatcherConfig>
    protected sendCallback: (batch: QueuedMessage[]) => void | Promise<void>

    constructor(
        sendCallback: (batch: QueuedMessage[]) => void | Promise<void>,
        config: BatcherConfig = {}
    ) {
        this.sendCallback = sendCallback
        this.config = {
            batchInterval: config.batchInterval ?? 100,
            maxBatchSize: config.maxBatchSize ?? 50,
            maxWaitTime: config.maxWaitTime ?? 1000,
        }
    }

    /**
     * Enqueue a message for batched transmission
     */
    enqueue(type: string, event: string, payload: any): void {
        const message: QueuedMessage = {
            type,
            event,
            payload,
            timestamp: Date.now(),
        }

        this.queue.push(message)

        // Check if we should flush immediately
        if (this.queue.length >= this.config.maxBatchSize) {
            this.flush()
            return
        }

        // Check if oldest message is too old
        const oldestMessage = this.queue[0]
        if (oldestMessage && Date.now() - oldestMessage.timestamp >= this.config.maxWaitTime) {
            this.flush()
            return
        }

        // Schedule a flush if not already scheduled
        if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.config.batchInterval)
        }
    }

    /**
     * Force flush all queued messages immediately
     */
    async flush(): Promise<void> {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        if (this.queue.length === 0) return

        const batch = [...this.queue]
        this.queue = []

        try {
            await this.sendCallback(batch)
        } catch (error) {
            console.error('Failed to send message batch:', error)
            // Re-queue failed messages
            this.queue.unshift(...batch)
        }
    }

    /**
     * Get current queue size
     */
    getQueueSize(): number {
        return this.queue.length
    }

    /**
     * Clear all queued messages
     */
    clear(): void {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
        this.queue = []
    }

    /**
     * Destroy the batcher and clean up resources
     */
    destroy(): void {
        this.clear()
    }
}

/**
 * Optimized batcher for awareness updates
 * Only keeps the latest state per client to avoid redundant updates
 */
export class AwarenessBatcher extends MessageBatcher {
    private latestStates = new Map<number, any>()

    enqueue(type: string, event: string, payload: any): void {
        if (event === 'awareness' && payload.clientID) {
            // Only keep latest state per client
            this.latestStates.set(payload.clientID, payload)

            // Schedule flush if not already scheduled
            if (!this.timer) {
                this.timer = setTimeout(() => this.flushAwareness(), this.config.batchInterval)
            }
        } else {
            // For non-awareness messages, use standard batching
            super.enqueue(type, event, payload)
        }
    }

    private async flushAwareness(): Promise<void> {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }

        if (this.latestStates.size === 0) return

        // Combine all latest states into single message
        const combinedPayload = {
            states: Object.fromEntries(this.latestStates),
            timestamp: Date.now(),
        }

        this.latestStates.clear()

        try {
            await this.sendCallback([{
                type: 'broadcast',
                event: 'awareness',
                payload: combinedPayload,
                timestamp: Date.now(),
            }])
        } catch (error) {
            console.error('Failed to send awareness batch:', error)
        }
    }

    clear(): void {
        super.clear()
        this.latestStates.clear()
    }
}
