export interface ProfileFrame {
  id: string;
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  selfTime: number;
  totalTime: number;
  callCount: number;
  children: ProfileFrame[];
  parent?: string;
  level: number;
}

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  details?: MemoryDetails;
}

export interface MemoryDetails {
  objects: number;
  arrays: number;
  strings: number;
  functions: number;
  other: number;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: MemorySnapshot;
  frameRate: number;
  networkRequests: number;
  renderTime: number;
  scriptTime: number;
  layoutTime: number;
  paintTime: number;
}

export class PerformanceProfiler {
  private isProfiling = false;
  private profileStartTime = 0;
  private profileEndTime = 0;
  private frames: Map<string, ProfileFrame> = new Map();
  private rootFrames: ProfileFrame[] = [];
  private currentFrameStack: ProfileFrame[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistorySize = 1000;
  private samplingInterval = 100; // ms
  private samplingTimer?: NodeJS.Timeout;

  // Start profiling
  startProfiling(): void {
    if (this.isProfiling) {
      return;
    }

    this.isProfiling = true;
    this.profileStartTime = performance.now();
    this.frames.clear();
    this.rootFrames = [];
    this.currentFrameStack = [];
    this.memorySnapshots = [];
    this.metricsHistory = [];

    // Start sampling
    this.startSampling();
  }

  // Stop profiling
  stopProfiling(): void {
    if (!this.isProfiling) {
      return;
    }

    this.isProfiling = false;
    this.profileEndTime = performance.now();
    this.stopSampling();

    // Calculate final durations
    this.calculateFinalDurations();
  }

  // Record function entry
  enterFunction(
    functionName: string,
    fileName: string,
    lineNumber: number,
    columnNumber: number
  ): ProfileFrame {
    const id = `${functionName}:${fileName}:${lineNumber}:${columnNumber}:${Date.now()}`;
    const startTime = performance.now();
    
    let frame: ProfileFrame;
    const existingFrame = this.frames.get(id);

    if (existingFrame) {
      // Update existing frame
      frame = existingFrame;
      frame.startTime = startTime;
      frame.endTime = undefined;
      frame.duration = undefined;
    } else {
      // Create new frame
      frame = {
        id,
        functionName,
        fileName,
        lineNumber,
        columnNumber,
        startTime,
        selfTime: 0,
        totalTime: 0,
        callCount: existingFrame ? existingFrame.callCount + 1 : 1,
        children: [],
        parent: this.currentFrameStack.length > 0 ? this.currentFrameStack[this.currentFrameStack.length - 1].id : undefined,
        level: this.currentFrameStack.length
      };

      this.frames.set(id, frame);

      // Add to parent's children or root frames
      if (frame.parent) {
        const parent = this.frames.get(frame.parent);
        if (parent) {
          parent.children.push(frame);
        }
      } else {
        this.rootFrames.push(frame);
      }
    }

    this.currentFrameStack.push(frame);
    return frame;
  }

  // Record function exit
  exitFunction(): ProfileFrame | undefined {
    if (this.currentFrameStack.length === 0) {
      return undefined;
    }

    const frame = this.currentFrameStack.pop();
    if (!frame) {
      return undefined;
    }

    const endTime = performance.now();
    frame.endTime = endTime;
    frame.duration = endTime - frame.startTime;
    frame.totalTime += frame.duration;

    // Update self time (subtract children's time)
    frame.selfTime = frame.duration - frame.children.reduce((sum, child) => sum + (child.duration || 0), 0);

    return frame;
  }

  // Get all frames
  getAllFrames(): ProfileFrame[] {
    return Array.from(this.frames.values());
  }

  // Get root frames
  getRootFrames(): ProfileFrame[] {
    return [...this.rootFrames];
  }

  // Get frames by function name
  getFramesByFunction(functionName: string): ProfileFrame[] {
    return this.getAllFrames().filter(frame => frame.functionName === functionName);
  }

  // Get frames by file
  getFramesByFile(fileName: string): ProfileFrame[] {
    return this.getAllFrames().filter(frame => frame.fileName === fileName);
  }

  // Get hottest functions (by total time)
  getHottestFunctions(limit = 10): ProfileFrame[] {
    return this.getAllFrames()
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  // Get slowest functions (by self time)
  getSlowestFunctions(limit = 10): ProfileFrame[] {
    return this.getAllFrames()
      .filter(frame => frame.selfTime > 0)
      .sort((a, b) => b.selfTime - a.selfTime)
      .slice(0, limit);
  }

  // Get most called functions
  getMostCalledFunctions(limit = 10): ProfileFrame[] {
    return this.getAllFrames()
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, limit);
  }

  // Take memory snapshot
  takeMemorySnapshot(): MemorySnapshot | undefined {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };

      this.memorySnapshots.push(snapshot);
      
      // Limit snapshots
      if (this.memorySnapshots.length > this.maxHistorySize) {
        this.memorySnapshots.shift();
      }

      return snapshot;
    }
    return undefined;
  }

  // Get memory snapshots
  getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  // Record performance metrics
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Limit history
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  // Get metrics history
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  // Get profiling statistics
  getStatistics(): {
    totalDuration: number;
    totalFrames: number;
    totalSamples: number;
    averageFrameTime: number;
    memoryGrowth: number;
    peakMemoryUsage: number;
    averageCpuUsage: number;
    averageFrameRate: number;
  } {
    const totalDuration = this.profileEndTime - this.profileStartTime;
    const totalFrames = this.frames.size;
    const totalSamples = this.metricsHistory.length;
    
    let averageFrameTime = 0;
    if (this.rootFrames.length > 0) {
      const totalTime = this.rootFrames.reduce((sum, frame) => sum + (frame.totalTime || 0), 0);
      averageFrameTime = totalTime / this.rootFrames.length;
    }

    let memoryGrowth = 0;
    let peakMemoryUsage = 0;
    if (this.memorySnapshots.length >= 2) {
      const first = this.memorySnapshots[0];
      const last = this.memorySnapshots[this.memorySnapshots.length - 1];
      memoryGrowth = last.usedJSHeapSize - first.usedJSHeapSize;
      peakMemoryUsage = Math.max(...this.memorySnapshots.map(s => s.usedJSHeapSize));
    }

    let averageCpuUsage = 0;
    let averageFrameRate = 0;
    if (this.metricsHistory.length > 0) {
      const totalCpu = this.metricsHistory.reduce((sum, m) => sum + m.cpuUsage, 0);
      const totalFps = this.metricsHistory.reduce((sum, m) => sum + m.frameRate, 0);
      averageCpuUsage = totalCpu / this.metricsHistory.length;
      averageFrameRate = totalFps / this.metricsHistory.length;
    }

    return {
      totalDuration,
      totalFrames,
      totalSamples,
      averageFrameTime,
      memoryGrowth,
      peakMemoryUsage,
      averageCpuUsage,
      averageFrameRate
    };
  }

  // Export profile data
  exportProfile(): string {
    const exportData = {
      profileStartTime: this.profileStartTime,
      profileEndTime: this.profileEndTime,
      frames: this.getAllFrames(),
      memorySnapshots: this.memorySnapshots,
      metricsHistory: this.metricsHistory,
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import profile data
  importProfile(jsonData: string): { imported: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.frames && Array.isArray(data.frames)) {
        this.frames.clear();
        data.frames.forEach((frame: ProfileFrame) => {
          this.frames.set(frame.id, frame);
        });
      }

      if (data.rootFrames && Array.isArray(data.rootFrames)) {
        this.rootFrames = data.rootFrames;
      }

      if (data.memorySnapshots && Array.isArray(data.memorySnapshots)) {
        this.memorySnapshots = data.memorySnapshots;
      }

      if (data.metricsHistory && Array.isArray(data.metricsHistory)) {
        this.metricsHistory = data.metricsHistory;
      }

      this.profileStartTime = data.profileStartTime || 0;
      this.profileEndTime = data.profileEndTime || 0;

      return { imported: true };
    } catch (error) {
      return { 
        imported: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON' 
      };
    }
  }

  // Clear all data
  clearAll(): void {
    this.frames.clear();
    this.rootFrames = [];
    this.currentFrameStack = [];
    this.memorySnapshots = [];
    this.metricsHistory = [];
    this.profileStartTime = 0;
    this.profileEndTime = 0;
  }

  // Private methods
  private startSampling(): void {
    this.samplingTimer = setInterval(() => {
      this.takeMemorySnapshot();
      this.collectMetrics();
    }, this.samplingInterval);
  }

  private stopSampling(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = undefined;
    }
  }

  private collectMetrics(): void {
    // In a real implementation, this would collect actual performance metrics
    const metrics: PerformanceMetrics = {
      cpuUsage: 0, // Would be calculated from actual CPU usage
      memoryUsage: this.memorySnapshots[this.memorySnapshots.length - 1] || {
        timestamp: Date.now(),
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0
      },
      frameRate: 60, // Would be calculated from actual frame rate
      networkRequests: 0, // Would be tracked
      renderTime: 0, // Would be measured
      scriptTime: 0, // Would be measured
      layoutTime: 0, // Would be measured
      paintTime: 0 // Would be measured
    };

    this.recordMetrics(metrics);
  }

  private calculateFinalDurations(): void {
    // Ensure all frames have calculated durations
    this.frames.forEach(frame => {
      if (frame.endTime && frame.startTime) {
        frame.duration = frame.endTime - frame.startTime;
      }
    });
  }

  // Set sampling interval
  setSamplingInterval(interval: number): void {
    this.samplingInterval = Math.max(10, interval);
    
    if (this.isProfiling) {
      this.stopSampling();
      this.startSampling();
    }
  }

  // Set maximum history size
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);
    
    // Trim histories if necessary
    while (this.memorySnapshots.length > this.maxHistorySize) {
      this.memorySnapshots.shift();
    }
    
    while (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  // Check if profiling is active
  isActive(): boolean {
    return this.isProfiling;
  }

  // Get current profiling duration
  getCurrentDuration(): number {
    if (this.isProfiling) {
      return performance.now() - this.profileStartTime;
    }
    return this.profileEndTime - this.profileStartTime;
  }
}
