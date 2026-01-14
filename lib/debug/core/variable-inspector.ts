import { Variable } from './debugger';

export interface VariableChange {
  name: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  scope: string;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: any;
  error?: string;
  enabled: boolean;
}

export class VariableInspector {
  private variables: Map<string, Variable> = new Map();
  private watchExpressions: Map<string, WatchExpression> = new Map();
  private changeHistory: VariableChange[] = [];
  private maxHistorySize = 500;

  // Update variables from debug session
  updateVariables(variables: Variable[]): VariableChange[] {
    // Detect changes
    const changes: VariableChange[] = [];
    
    variables.forEach(variable => {
      const existing = this.variables.get(`${variable.name}:${variable.scope}`);
      if (existing && existing.value !== variable.value) {
        changes.push({
          name: variable.name,
          oldValue: existing.value,
          newValue: variable.value,
          timestamp: Date.now(),
          scope: variable.scope
        });
      }
    });

    // Update variables
    this.variables.clear();
    variables.forEach(variable => {
      this.variables.set(`${variable.name}:${variable.scope}`, variable);
    });

    // Record changes
    changes.forEach(change => {
      this.changeHistory.push(change);
      if (this.changeHistory.length > this.maxHistorySize) {
        this.changeHistory.shift();
      }
    });

    return changes;
  }

  // Get all variables
  getAllVariables(): Variable[] {
    return Array.from(this.variables.values());
  }

  // Get variables by scope
  getVariablesByScope(scope: 'local' | 'global' | 'closure'): Variable[] {
    return this.getAllVariables().filter(variable => variable.scope === scope);
  }

  // Get variable by name and scope
  getVariable(name: string, scope?: string): Variable | undefined {
    if (scope) {
      return this.variables.get(`${name}:${scope}`);
    }
    
    // Search all scopes
    for (const [key, variable] of this.variables) {
      if (variable.name === name) {
        return variable;
      }
    }
    return undefined;
  }

  // Set variable value
  setVariable(name: string, value: any, scope: string): boolean {
    const key = `${name}:${scope}`;
    const existing = this.variables.get(key);
    
    if (existing) {
      const oldValue = existing.value;
      existing.value = value;
      
      // Record change
      this.changeHistory.push({
        name,
        oldValue,
        newValue: value,
        timestamp: Date.now(),
        scope
      });
      
      if (this.changeHistory.length > this.maxHistorySize) {
        this.changeHistory.shift();
      }
      
      return true;
    }
    return false;
  }

  // Add watch expression
  addWatchExpression(expression: string): WatchExpression {
    const id = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const watchExpression: WatchExpression = {
      id,
      expression,
      enabled: true
    };
    
    this.watchExpressions.set(id, watchExpression);
    return watchExpression;
  }

  // Remove watch expression
  removeWatchExpression(id: string): boolean {
    return this.watchExpressions.delete(id);
  }

  // Update watch expression value
  updateWatchExpression(id: string, value: any, error?: string): boolean {
    const watchExpression = this.watchExpressions.get(id);
    if (watchExpression) {
      watchExpression.value = value;
      watchExpression.error = error;
      return true;
    }
    return false;
  }

  // Get all watch expressions
  getWatchExpressions(): WatchExpression[] {
    return Array.from(this.watchExpressions.values());
  }

  // Evaluate watch expressions
  evaluateWatchExpressions(context: any): { [key: string]: any } {
    const results: { [key: string]: any } = {};
    
    this.watchExpressions.forEach(watch => {
      if (!watch.enabled) return;
      
      try {
        // Create a safe evaluation context
        const evalFunction = new Function('context', `with(context) { return ${watch.expression}; }`);
        const value = evalFunction(context);
        watch.value = value;
        watch.error = undefined;
        results[watch.id] = value;
      } catch (error) {
        watch.error = error instanceof Error ? error.message : 'Evaluation error';
        watch.value = undefined;
        results[watch.id] = { error: watch.error };
      }
    });
    
    return results;
  }

  // Get change history
  getChangeHistory(variableName?: string, scope?: string): VariableChange[] {
    let history = [...this.changeHistory];
    
    if (variableName) {
      history = history.filter(change => change.name === variableName);
    }
    
    if (scope) {
      history = history.filter(change => change.scope === scope);
    }
    
    return history;
  }

  // Clear change history
  clearChangeHistory(): void {
    this.changeHistory = [];
  }

  // Get variable statistics
  getVariableStatistics(): {
    total: number;
    byScope: { [key: string]: number };
    recentChanges: number;
    mostChanged: { name: string; count: number } | null;
  } {
    const variables = this.getAllVariables();
    const byScope: { [key: string]: number } = {};
    
    variables.forEach(variable => {
      byScope[variable.scope] = (byScope[variable.scope] || 0) + 1;
    });
    
    // Find most changed variable
    const changeCounts: { [key: string]: number } = {};
    this.changeHistory.forEach(change => {
      changeCounts[change.name] = (changeCounts[change.name] || 0) + 1;
    });
    
    let mostChanged = null;
    let maxChanges = 0;
    
    Object.entries(changeCounts).forEach(([name, count]) => {
      if (count > maxChanges) {
        maxChanges = count;
        mostChanged = { name, count };
      }
    });
    
    return {
      total: variables.length,
      byScope,
      recentChanges: this.changeHistory.length,
      mostChanged
    };
  }

  // Export variables and history
  exportData(): string {
    const exportData = {
      variables: this.getAllVariables(),
      watchExpressions: this.getWatchExpressions(),
      changeHistory: this.getChangeHistory(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import variables and history
  importData(jsonData: string): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(jsonData);
      
      if (data.variables && Array.isArray(data.variables)) {
        data.variables.forEach((variable: Variable) => {
          try {
            this.variables.set(`${variable.name}:${variable.scope}`, variable);
            imported++;
          } catch (error) {
            errors.push(`Failed to import variable ${variable.name}`);
          }
        });
      }

      if (data.watchExpressions && Array.isArray(data.watchExpressions)) {
        data.watchExpressions.forEach((watch: WatchExpression) => {
          this.watchExpressions.set(watch.id, watch);
        });
      }

      if (data.changeHistory && Array.isArray(data.changeHistory)) {
        this.changeHistory = data.changeHistory;
      }

    } catch (error) {
      errors.push('Invalid JSON format');
    }

    return { imported, errors };
  }

  // Format variable value for display
  formatVariableValue(value: any, maxDepth = 3, currentDepth = 0): string {
    if (currentDepth >= maxDepth) {
      return '...';
    }

    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    
    switch (type) {
      case 'string':
        return `"${value}"`;
      case 'number':
        return value.toString();
      case 'boolean':
        return value.toString();
      case 'function':
        return 'function()';
      case 'object':
        if (Array.isArray(value)) {
          const items = value.slice(0, 5).map(item => 
            this.formatVariableValue(item, maxDepth, currentDepth + 1)
          ).join(', ');
          return `[${items}${value.length > 5 ? '...' : ''}]`;
        } else {
          const keys = Object.keys(value).slice(0, 5);
          const items = keys.map(key => 
            `${key}: ${this.formatVariableValue(value[key], maxDepth, currentDepth + 1)}`
          ).join(', ');
          return `{ ${items}${keys.length > 5 ? '...' : ''} }`;
        }
      default:
        return String(value);
    }
  }

  // Clear all data
  clearAll(): void {
    this.variables.clear();
    this.watchExpressions.clear();
    this.changeHistory = [];
  }
}
