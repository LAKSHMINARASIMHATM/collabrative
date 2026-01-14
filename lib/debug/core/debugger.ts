// Simple EventEmitter for browser environment
class SimpleEventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }
}

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  condition?: string;
  enabled: boolean;
  hitCount: number;
}

export interface DebugSession {
  id: string;
  state: 'running' | 'paused' | 'stopped';
  currentFile?: string;
  currentLine?: number;
  callStack: CallFrame[];
  variables: Variable[];
}

export interface CallFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column: number;
  scope: string;
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  scope: 'local' | 'global' | 'closure';
  children?: Variable[];
}

export interface DebugEvent {
  type: 'breakpoint' | 'step' | 'exception' | 'output' | 'session_start' | 'session_end';
  data: any;
}

export class Debugger extends SimpleEventEmitter {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private currentSession: DebugSession | null = null;
  private isDebugging = false;

  constructor() {
    super();
  }

  // Breakpoint Management
  addBreakpoint(file: string, line: number, column?: number, condition?: string): Breakpoint {
    const id = `${file}:${line}:${column || 0}`;
    const breakpoint: Breakpoint = {
      id,
      file,
      line,
      column,
      condition,
      enabled: true,
      hitCount: 0
    };

    this.breakpoints.set(id, breakpoint);
    this.emit('breakpoint_added', breakpoint);
    return breakpoint;
  }

  removeBreakpoint(id: string): boolean {
    const removed = this.breakpoints.delete(id);
    if (removed) {
      this.emit('breakpoint_removed', id);
    }
    return removed;
  }

  toggleBreakpoint(id: string): boolean {
    const breakpoint = this.breakpoints.get(id);
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      this.emit('breakpoint_toggled', breakpoint);
      return true;
    }
    return false;
  }

  getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  getBreakpointsForFile(file: string): Breakpoint[] {
    return this.getBreakpoints().filter(bp => bp.file === file);
  }

  // Session Management
  startDebugging(): DebugSession {
    if (this.currentSession) {
      this.stopDebugging();
    }

    this.currentSession = {
      id: `session_${Date.now()}`,
      state: 'running',
      callStack: [],
      variables: []
    };

    this.isDebugging = true;
    this.emit('session_start', this.currentSession);
    return this.currentSession;
  }

  stopDebugging(): void {
    if (this.currentSession) {
      this.emit('session_end', this.currentSession);
      this.currentSession = null;
    }
    this.isDebugging = false;
  }

  pauseDebugging(): void {
    if (this.currentSession && this.currentSession.state === 'running') {
      this.currentSession.state = 'paused';
      this.emit('debug_paused', this.currentSession);
    }
  }

  resumeDebugging(): void {
    if (this.currentSession && this.currentSession.state === 'paused') {
      this.currentSession.state = 'running';
      this.emit('debug_resumed', this.currentSession);
    }
  }

  // Step Controls
  stepOver(): void {
    if (this.currentSession) {
      this.emit('step_over', this.currentSession);
    }
  }

  stepInto(): void {
    if (this.currentSession) {
      this.emit('step_into', this.currentSession);
    }
  }

  stepOut(): void {
    if (this.currentSession) {
      this.emit('step_out', this.currentSession);
    }
  }

  // Variable Management
  updateVariables(variables: Variable[]): void {
    if (this.currentSession) {
      this.currentSession.variables = variables;
      this.emit('variables_updated', variables);
    }
  }

  setVariable(name: string, value: any): boolean {
    if (this.currentSession) {
      const variable = this.currentSession.variables.find(v => v.name === name);
      if (variable) {
        variable.value = value;
        this.emit('variable_changed', variable);
        return true;
      }
    }
    return false;
  }

  // Call Stack Management
  updateCallStack(callStack: CallFrame[]): void {
    if (this.currentSession) {
      this.currentSession.callStack = callStack;
      this.emit('call_stack_updated', callStack);
    }
  }

  // State Getters
  getCurrentSession(): DebugSession | null {
    return this.currentSession;
  }

  isDebuggingActive(): boolean {
    return this.isDebugging;
  }

  isPaused(): boolean {
    return this.currentSession?.state === 'paused';
  }

  // Utility Methods
  clearAllBreakpoints(): void {
    this.breakpoints.clear();
    this.emit('all_breakpoints_cleared');
  }

  exportBreakpoints(): string {
    return JSON.stringify(this.getBreakpoints(), null, 2);
  }

  importBreakpoints(breakpointsJson: string): number {
    try {
      const breakpoints: Breakpoint[] = JSON.parse(breakpointsJson);
      let imported = 0;
      
      breakpoints.forEach(bp => {
        this.breakpoints.set(bp.id, bp);
        imported++;
      });
      
      this.emit('breakpoints_imported', imported);
      return imported;
    } catch (error) {
      console.error('Failed to import breakpoints:', error);
      return 0;
    }
  }
}
