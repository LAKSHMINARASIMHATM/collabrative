import { CallFrame } from './debugger';

export interface CallStackEntry extends CallFrame {
  depth: number;
  parent?: string;
  children?: string[];
  executionTime?: number;
}

export interface StackFrame {
  id: string;
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  scopeChain: Scope[];
  thisObject?: any;
  returnValue?: any;
  source?: string;
}

export interface Scope {
  type: 'local' | 'closure' | 'global' | 'with' | 'catch';
  object: any;
  name?: string;
}

export class CallStackManager {
  private callStack: CallStackEntry[] = [];
  private currentFrameIndex = -1;
  private maxStackDepth = 100;
  private stackHistory: CallStackEntry[][] = [];
  private maxHistorySize = 50;

  // Add a new frame to the call stack
  pushFrame(frame: CallFrame, executionTime?: number): void {
    const entry: CallStackEntry = {
      ...frame,
      depth: this.callStack.length,
      parent: this.callStack.length > 0 ? this.callStack[this.callStack.length - 1].id : undefined,
      executionTime
    };

    // Update parent's children
    if (entry.parent) {
      const parent = this.callStack.find(f => f.id === entry.parent);
      if (parent) {
        parent.children = [...(parent.children || []), entry.id];
      }
    }

    this.callStack.push(entry);
    this.currentFrameIndex = this.callStack.length - 1;

    // Check stack depth limit
    if (this.callStack.length > this.maxStackDepth) {
      this.callStack.shift();
      this.currentFrameIndex--;
    }
  }

  // Remove the top frame from the call stack
  popFrame(): CallStackEntry | undefined {
    if (this.callStack.length > 0) {
      const frame = this.callStack.pop();
      this.currentFrameIndex = Math.min(this.currentFrameIndex, this.callStack.length - 1);
      return frame;
    }
    return undefined;
  }

  // Get the current call stack
  getCallStack(): CallStackEntry[] {
    return [...this.callStack];
  }

  // Get the current frame
  getCurrentFrame(): CallStackEntry | undefined {
    if (this.currentFrameIndex >= 0 && this.currentFrameIndex < this.callStack.length) {
      return this.callStack[this.currentFrameIndex];
    }
    return undefined;
  }

  // Set the current frame by index
  setCurrentFrame(index: number): boolean {
    if (index >= 0 && index < this.callStack.length) {
      this.currentFrameIndex = index;
      return true;
    }
    return false;
  }

  // Set the current frame by ID
  setCurrentFrameById(frameId: string): boolean {
    const index = this.callStack.findIndex(frame => frame.id === frameId);
    if (index !== -1) {
      this.currentFrameIndex = index;
      return true;
    }
    return false;
  }

  // Get frame by ID
  getFrameById(frameId: string): CallStackEntry | undefined {
    return this.callStack.find(frame => frame.id === frameId);
  }

  // Get frames by depth
  getFramesByDepth(depth: number): CallStackEntry[] {
    return this.callStack.filter(frame => frame.depth === depth);
  }

  // Get child frames of a parent
  getChildFrames(parentId: string): CallStackEntry[] {
    return this.callStack.filter(frame => frame.parent === parentId);
  }

  // Get the root frame (bottom of the stack)
  getRootFrame(): CallStackEntry | undefined {
    return this.callStack.length > 0 ? this.callStack[0] : undefined;
  }

  // Get the leaf frame (top of the stack)
  getLeafFrame(): CallStackEntry | undefined {
    return this.callStack.length > 0 ? this.callStack[this.callStack.length - 1] : undefined;
  }

  // Clear the call stack
  clearCallStack(): void {
    this.saveToHistory();
    this.callStack = [];
    this.currentFrameIndex = -1;
  }

  // Save current stack to history
  saveToHistory(): void {
    if (this.callStack.length > 0) {
      this.stackHistory.push([...this.callStack]);
      if (this.stackHistory.length > this.maxHistorySize) {
        this.stackHistory.shift();
      }
    }
  }

  // Get stack history
  getStackHistory(): CallStackEntry[][] {
    return [...this.stackHistory];
  }

  // Restore stack from history
  restoreFromHistory(index: number): boolean {
    if (index >= 0 && index < this.stackHistory.length) {
      this.callStack = [...this.stackHistory[index]];
      this.currentFrameIndex = this.callStack.length - 1;
      return true;
    }
    return false;
  }

  // Get call stack statistics
  getStatistics(): {
    maxDepth: number;
    currentDepth: number;
    totalFrames: number;
    averageExecutionTime?: number;
    slowestFrame?: CallStackEntry;
    historySize: number;
  } {
    const totalFrames = this.callStack.length;
    const currentDepth = this.currentFrameIndex + 1;
    
    let averageExecutionTime: number | undefined;
    let slowestFrame: CallStackEntry | undefined;
    
    const framesWithTime = this.callStack.filter(frame => frame.executionTime !== undefined);
    if (framesWithTime.length > 0) {
      const totalTime = framesWithTime.reduce((sum, frame) => sum + (frame.executionTime || 0), 0);
      averageExecutionTime = totalTime / framesWithTime.length;
      
      slowestFrame = framesWithTime.reduce((slowest, frame) => 
        (frame.executionTime || 0) > (slowest.executionTime || 0) ? frame : slowest
      );
    }

    return {
      maxDepth: this.maxStackDepth,
      currentDepth,
      totalFrames,
      averageExecutionTime,
      slowestFrame,
      historySize: this.stackHistory.length
    };
  }

  // Format call stack for display
  formatCallStack(): string[] {
    return this.callStack.map((frame, index) => {
      const prefix = index === this.currentFrameIndex ? '→ ' : '  ';
      const indent = '  '.repeat(frame.depth);
      const location = `${frame.file}:${frame.line}:${frame.column}`;
      const time = frame.executionTime ? ` (${frame.executionTime}ms)` : '';
      return `${prefix}${indent}${frame.name} at ${location}${time}`;
    });
  }

  // Export call stack
  exportCallStack(): string {
    const exportData = {
      callStack: this.callStack,
      currentFrameIndex: this.currentFrameIndex,
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import call stack
  importCallStack(jsonData: string): { imported: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.callStack && Array.isArray(data.callStack)) {
        this.callStack = data.callStack;
        this.currentFrameIndex = data.currentFrameIndex || this.callStack.length - 1;
        return { imported: true };
      } else {
        return { imported: false, error: 'Invalid call stack format' };
      }
    } catch (error) {
      return { 
        imported: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON' 
      };
    }
  }

  // Search call stack
  searchFrames(query: string): CallStackEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.callStack.filter(frame => 
      frame.name.toLowerCase().includes(lowerQuery) ||
      frame.file.toLowerCase().includes(lowerQuery) ||
      frame.scope.toLowerCase().includes(lowerQuery)
    );
  }

  // Get frames in a specific file
  getFramesInFile(fileName: string): CallStackEntry[] {
    return this.callStack.filter(frame => frame.file === fileName);
  }

  // Get execution path (ordered list of function names)
  getExecutionPath(): string[] {
    return this.callStack.map(frame => frame.name);
  }

  // Check if a function is in the call stack
  hasFunction(functionName: string): boolean {
    return this.callStack.some(frame => frame.name === functionName);
  }

  // Get the depth of a specific frame
  getFrameDepth(frameId: string): number {
    const frame = this.getFrameById(frameId);
    return frame ? frame.depth : -1;
  }

  // Clear history
  clearHistory(): void {
    this.stackHistory = [];
  }

  // Set maximum stack depth
  setMaxStackDepth(maxDepth: number): void {
    this.maxStackDepth = Math.max(1, maxDepth);
    
    // Trim current stack if necessary
    while (this.callStack.length > this.maxStackDepth) {
      this.callStack.shift();
    }
    this.currentFrameIndex = Math.min(this.currentFrameIndex, this.callStack.length - 1);
  }

  // Set maximum history size
  setMaxHistorySize(maxSize: number): void {
    this.maxHistorySize = Math.max(0, maxSize);
    
    // Trim history if necessary
    while (this.stackHistory.length > this.maxHistorySize) {
      this.stackHistory.shift();
    }
  }
}
