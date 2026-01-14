import { Breakpoint } from './debugger';

export interface BreakpointCondition {
  expression: string;
  enabled: boolean;
}

export interface BreakpointHit {
  breakpoint: Breakpoint;
  timestamp: number;
  variables?: Record<string, any>;
}

export class BreakpointManager {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private hitHistory: BreakpointHit[] = [];
  private maxHistorySize = 1000;

  // Add a new breakpoint
  addBreakpoint(file: string, line: number, column?: number, condition?: string): Breakpoint {
    const id = this.generateBreakpointId(file, line, column);
    
    if (this.breakpoints.has(id)) {
      throw new Error(`Breakpoint already exists at ${file}:${line}`);
    }

    const breakpoint: Breakpoint = {
      id,
      file,
      line,
      column: column || 0,
      condition,
      enabled: true,
      hitCount: 0
    };

    this.breakpoints.set(id, breakpoint);
    return breakpoint;
  }

  // Remove a breakpoint
  removeBreakpoint(id: string): boolean {
    return this.breakpoints.delete(id);
  }

  // Toggle breakpoint enabled state
  toggleBreakpoint(id: string): boolean {
    const breakpoint = this.breakpoints.get(id);
    if (breakpoint) {
      breakpoint.enabled = !breakpoint.enabled;
      return true;
    }
    return false;
  }

  // Update breakpoint condition
  updateBreakpointCondition(id: string, condition: string): boolean {
    const breakpoint = this.breakpoints.get(id);
    if (breakpoint) {
      breakpoint.condition = condition;
      return true;
    }
    return false;
  }

  // Get all breakpoints
  getAllBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  // Get breakpoints for a specific file
  getBreakpointsForFile(file: string): Breakpoint[] {
    return this.getAllBreakpoints().filter(bp => bp.file === file);
  }

  // Get enabled breakpoints only
  getEnabledBreakpoints(): Breakpoint[] {
    return this.getAllBreakpoints().filter(bp => bp.enabled);
  }

  // Check if there's a breakpoint at a specific location
  hasBreakpointAt(file: string, line: number, column?: number): boolean {
    const id = this.generateBreakpointId(file, line, column);
    return this.breakpoints.has(id);
  }

  // Get breakpoint at specific location
  getBreakpointAt(file: string, line: number, column?: number): Breakpoint | undefined {
    const id = this.generateBreakpointId(file, line, column);
    return this.breakpoints.get(id);
  }

  // Record a breakpoint hit
  recordHit(breakpointId: string, variables?: Record<string, any>): void {
    const breakpoint = this.breakpoints.get(breakpointId);
    if (breakpoint) {
      breakpoint.hitCount++;
      
      const hit: BreakpointHit = {
        breakpoint,
        timestamp: Date.now(),
        variables
      };

      this.hitHistory.push(hit);
      
      // Limit history size
      if (this.hitHistory.length > this.maxHistorySize) {
        this.hitHistory.shift();
      }
    }
  }

  // Get hit history for a breakpoint
  getHitHistory(breakpointId: string): BreakpointHit[] {
    return this.hitHistory.filter(hit => hit.breakpoint.id === breakpointId);
  }

  // Get all hit history
  getAllHitHistory(): BreakpointHit[] {
    return [...this.hitHistory];
  }

  // Clear hit history
  clearHitHistory(): void {
    this.hitHistory = [];
  }

  // Clear all breakpoints
  clearAllBreakpoints(): void {
    this.breakpoints.clear();
    this.hitHistory = [];
  }

  // Export breakpoints to JSON
  exportBreakpoints(): string {
    const exportData = {
      breakpoints: this.getAllBreakpoints(),
      hitHistory: this.getAllHitHistory(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import breakpoints from JSON
  importBreakpoints(jsonData: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(jsonData);
      
      if (data.breakpoints && Array.isArray(data.breakpoints)) {
        data.breakpoints.forEach((bp: any) => {
          try {
            const breakpoint: Breakpoint = {
              id: bp.id,
              file: bp.file,
              line: bp.line,
              column: bp.column || 0,
              condition: bp.condition,
              enabled: bp.enabled !== false,
              hitCount: bp.hitCount || 0
            };

            this.breakpoints.set(bp.id, breakpoint);
            imported++;
          } catch (error) {
            errors.push(`Failed to import breakpoint at ${bp.file}:${bp.line}`);
          }
        });
      }

      if (data.hitHistory && Array.isArray(data.hitHistory)) {
        this.hitHistory = data.hitHistory;
      }

    } catch (error) {
      errors.push('Invalid JSON format');
    }

    return { imported, errors };
  }

  // Validate breakpoint condition
  validateCondition(condition: string): { valid: boolean; error?: string } {
    if (!condition) {
      return { valid: true };
    }

    try {
      // Basic syntax validation
      // In a real implementation, this would be more sophisticated
      new Function(`return (${condition})`);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid condition' 
      };
    }
  }

  // Get breakpoint statistics
  getStatistics(): {
    total: number;
    enabled: number;
    disabled: number;
    withConditions: number;
    totalHits: number;
    mostHit: Breakpoint | null;
  } {
    const breakpoints = this.getAllBreakpoints();
    const total = breakpoints.length;
    const enabled = breakpoints.filter(bp => bp.enabled).length;
    const disabled = total - enabled;
    const withConditions = breakpoints.filter(bp => bp.condition).length;
    const totalHits = breakpoints.reduce((sum, bp) => sum + bp.hitCount, 0);
    
    const mostHit = breakpoints.reduce((max, bp) => 
      (bp.hitCount > (max?.hitCount || 0)) ? bp : max, null as Breakpoint | null);

    return {
      total,
      enabled,
      disabled,
      withConditions,
      totalHits,
      mostHit
    };
  }

  // Private helper method
  private generateBreakpointId(file: string, line: number, column?: number): string {
    return `${file}:${line}:${column || 0}`;
  }
}
