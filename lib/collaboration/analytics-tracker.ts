/**
 * Performance Analytics Tracker
 * 
 * Monitors and tracks collaboration performance metrics including
 * latency, bandwidth, connection quality, and sync performance.
 */

export interface PerformanceMetrics {
    // Connection metrics
    latency: number // milliseconds
    jitter: number // latency variation
    packetLoss: number // percentage
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'

    // Bandwidth metrics
    bandwidthUsed: number // bytes
    messagesPerSecond: number
    bytesPerSecond: number

    // Compression metrics
    compressionRatio: number // percentage
    bytesSaved: number

    // Sync metrics
    syncLatency: number // time to sync
    conflictCount: number
    updatesPending: number
}

export interface MetricsSample {
    timestamp: Date
    metrics: PerformanceMetrics
}

export class AnalyticsTracker {
    private samples: MetricsSample[] = []
    private maxSamples = 1000
    private sampleInterval = 1000 // 1 second
    private sampleTimer: NodeJS.Timeout | null = null

    // Real-time counters
    private messageCount = 0
    private bytesTransferred = 0
    private latencyMeasurements: number[] = []
    private lastSampleTime = Date.now()

    private onMetricsUpdate?: (metrics: PerformanceMetrics) => void

    constructor() {
        this.startSampling()
    }

    /**
     * Start automatic sampling
     */
    private startSampling(): void {
        this.sampleTimer = setInterval(() => {
            const metrics = this.getCurrentMetrics()
            this.recordSample(metrics)
            this.onMetricsUpdate?.(metrics)
            this.resetCounters()
        }, this.sampleInterval)
    }

    /**
     * Record a message sent/received
     */
    recordMessage(bytes: number): void {
        this.messageCount++
        this.bytesTransferred += bytes
    }

    /**
     * Record latency measurement
     */
    recordLatency(latency: number): void {
        this.latencyMeasurements.push(latency)

        // Keep only recent measurements
        if (this.latencyMeasurements.length > 100) {
            this.latencyMeasurements.shift()
        }
    }

    /**
     * Measure round-trip time
     */
    async measureRTT(sendPing: () => Promise<void>): Promise<number> {
        const start = Date.now()
        await sendPing()
        const rtt = Date.now() - start
        this.recordLatency(rtt)
        return rtt
    }

    /**
     * Get current metrics
     */
    getCurrentMetrics(): PerformanceMetrics {
        const now = Date.now()
        const duration = (now - this.lastSampleTime) / 1000 // seconds

        const avgLatency = this.calculateAverageLatency()
        const jitter = this.calculateJitter()

        return {
            latency: avgLatency,
            jitter,
            packetLoss: 0, // Would need WebRTC DataChannel stats for real value
            connectionQuality: this.determineConnectionQuality(avgLatency, jitter),

            bandwidthUsed: this.bytesTransferred,
            messagesPerSecond: this.messageCount / duration,
            bytesPerSecond: this.bytesTransferred / duration,

            compressionRatio: 0, // Set by compression module
            bytesSaved: 0,

            syncLatency: avgLatency,
            conflictCount: 0, // Set by sync manager
            updatesPending: 0,
        }
    }

    /**
     * Calculate average latency
     */
    private calculateAverageLatency(): number {
        if (this.latencyMeasurements.length === 0) return 0

        const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0)
        return sum / this.latencyMeasurements.length
    }

    /**
     * Calculate jitter (latency variation)
     */
    private calculateJitter(): number {
        if (this.latencyMeasurements.length < 2) return 0

        let jitter = 0
        for (let i = 1; i < this.latencyMeasurements.length; i++) {
            jitter += Math.abs(this.latencyMeasurements[i] - this.latencyMeasurements[i - 1])
        }

        return jitter / (this.latencyMeasurements.length - 1)
    }

    /**
     * Determine connection quality rating
     */
    private determineConnectionQuality(
        latency: number,
        jitter: number
    ): 'excellent' | 'good' | 'fair' | 'poor' {
        if (latency < 50 && jitter < 10) return 'excellent'
        if (latency < 100 && jitter < 20) return 'good'
        if (latency < 200 && jitter < 50) return 'fair'
        return 'poor'
    }

    /**
     * Record a metrics sample
     */
    private recordSample(metrics: PerformanceMetrics): void {
        this.samples.push({
            timestamp: new Date(),
            metrics,
        })

        // Keep only recent samples
        if (this.samples.length > this.maxSamples) {
            this.samples.shift()
        }
    }

    /**
     * Reset per-interval counters
     */
    private resetCounters(): void {
        this.messageCount = 0
        this.bytesTransferred = 0
        this.lastSampleTime = Date.now()
    }

    /**
     * Get historical samples
     */
    getSamples(count?: number): MetricsSample[] {
        const samples = [...this.samples]
        if (count) {
            return samples.slice(-count)
        }
        return samples
    }

    /**
     * Get average metrics over time period
     */
    getAverageMetrics(minutes: number = 5): PerformanceMetrics {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000)
        const recentSamples = this.samples.filter(s => s.timestamp >= cutoff)

        if (recentSamples.length === 0) {
            return this.getCurrentMetrics()
        }

        // Calculate averages
        const sum = recentSamples.reduce((acc, sample) => {
            const m = sample.metrics
            return {
                latency: acc.latency + m.latency,
                jitter: acc.jitter + m.jitter,
                bandwidthUsed: acc.bandwidthUsed + m.bandwidthUsed,
                messagesPerSecond: acc.messagesPerSecond + m.messagesPerSecond,
                bytesPerSecond: acc.bytesPerSecond + m.bytesPerSecond,
            }
        }, { latency: 0, jitter: 0, bandwidthUsed: 0, messagesPerSecond: 0, bytesPerSecond: 0 })

        const count = recentSamples.length
        const avgLatency = sum.latency / count
        const avgJitter = sum.jitter / count

        return {
            latency: avgLatency,
            jitter: avgJitter,
            packetLoss: 0,
            connectionQuality: this.determineConnectionQuality(avgLatency, avgJitter),
            bandwidthUsed: sum.bandwidthUsed / count,
            messagesPerSecond: sum.messagesPerSecond / count,
            bytesPerSecond: sum.bytesPerSecond / count,
            compressionRatio: 0,
            bytesSaved: 0,
            syncLatency: avgLatency,
            conflictCount: 0,
            updatesPending: 0,
        }
    }

    /**
     * Listen for metrics updates
     */
    onMetrics(callback: (metrics: PerformanceMetrics) => void): void {
        this.onMetricsUpdate = callback
    }

    /**
     * Export metrics data
     */
    exportData(): string {
        return JSON.stringify({
            samples: this.samples.map(s => ({
                timestamp: s.timestamp.toISOString(),
                metrics: s.metrics,
            })),
        }, null, 2)
    }

    /**
     * Generate performance report
     */
    generateReport(): string {
        const recent = this.getAverageMetrics(5)
        const overall = this.getAverageMetrics(60)

        return `
# Performance Report

## Recent (5 min)
- Latency: ${recent.latency.toFixed(1)}ms
- Connection Quality: ${recent.connectionQuality}
- Messages/sec: ${recent.messagesPerSecond.toFixed(1)}
- Bandwidth: ${(recent.bytesPerSecond / 1024).toFixed(2)} KB/s

## Overall (1 hour)
- Average Latency: ${overall.latency.toFixed(1)}ms
- Average Jitter: ${overall.jitter.toFixed(1)}ms
- Connection Quality: ${overall.connectionQuality}
- Total Samples: ${this.samples.length}

## Details
- Sample Interval: ${this.sampleInterval}ms
- Max Samples Stored: ${this.maxSamples}
- Current Sample Count: ${this.samples.length}
    `.trim()
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.sampleTimer) {
            clearInterval(this.sampleTimer)
            this.sampleTimer = null
        }
        this.samples = []
        this.latencyMeasurements = []
    }
}

export default AnalyticsTracker
