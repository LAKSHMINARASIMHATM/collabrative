export interface ConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  content: string;
  timestamp: number;
  source?: string;
  stackTrace?: string;
  variables?: Record<string, any>;
}

export interface ConsoleCommand {
  id: string;
  command: string;
  result: any;
  error?: string;
  timestamp: number;
  executionTime?: number;
}

export interface ConsoleFilter {
  types: ConsoleMessage['type'][];
  sources: string[];
  searchText?: string;
  timeRange?: { start: number; end: number };
}

export class DebugConsole {
  private messages: ConsoleMessage[] = [];
  private commands: ConsoleCommand[] = [];
  private maxMessages = 1000;
  private maxCommands = 100;
  private filters: ConsoleFilter = {
    types: ['log', 'error', 'warn', 'info', 'debug', 'trace'],
    sources: []
  };
  private subscribers: Map<string, (message: ConsoleMessage) => void> = new Map();

  // Add a message to the console
  addMessage(
    type: ConsoleMessage['type'],
    content: string,
    source?: string,
    stackTrace?: string,
    variables?: Record<string, any>
  ): ConsoleMessage {
    const message: ConsoleMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
      source,
      stackTrace,
      variables
    };

    this.messages.push(message);
    
    // Limit message count
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => callback(message));

    return message;
  }

  // Execute a console command
  async executeCommand(
    command: string,
    context?: any
  ): Promise<ConsoleCommand> {
    const startTime = Date.now();
    const commandEntry: ConsoleCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      command,
      result: null,
      timestamp: startTime
    };

    try {
      // Create safe execution context
      const safeContext = {
        ...context,
        console: {
          log: (...args: any[]) => this.addMessage('log', args.join(' '), 'command'),
          error: (...args: any[]) => this.addMessage('error', args.join(' '), 'command'),
          warn: (...args: any[]) => this.addMessage('warn', args.join(' '), 'command'),
          info: (...args: any[]) => this.addMessage('info', args.join(' '), 'command'),
          debug: (...args: any[]) => this.addMessage('debug', args.join(' '), 'command')
        }
      };

      // Execute command
      const evalFunction = new Function('context', `
        with(context) {
          try {
            return eval(${JSON.stringify(command)});
          } catch (error) {
            return { error: error.message };
          }
        }
      `);

      const result = await evalFunction(safeContext);
      commandEntry.result = result;
      
      if (result && typeof result === 'object' && result.error) {
        commandEntry.error = result.error;
        this.addMessage('error', `Command error: ${result.error}`, 'command');
      } else {
        this.addMessage('info', `Command result: ${JSON.stringify(result)}`, 'command');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      commandEntry.error = errorMessage;
      this.addMessage('error', `Command failed: ${errorMessage}`, 'command');
    }

    commandEntry.executionTime = Date.now() - startTime;
    
    this.commands.push(commandEntry);
    if (this.commands.length > this.maxCommands) {
      this.commands.shift();
    }

    return commandEntry;
  }

  // Get filtered messages
  getMessages(): ConsoleMessage[] {
    return this.messages.filter(message => this.matchesFilter(message));
  }

  // Get all messages (unfiltered)
  getAllMessages(): ConsoleMessage[] {
    return [...this.messages];
  }

  // Get command history
  getCommands(): ConsoleCommand[] {
    return [...this.commands];
  }

  // Clear console
  clear(): void {
    this.messages = [];
    this.commands = [];
  }

  // Clear messages only
  clearMessages(): void {
    this.messages = [];
  }

  // Clear commands only
  clearCommands(): void {
    this.commands = [];
  }

  // Set filters
  setFilters(filters: Partial<ConsoleFilter>): void {
    this.filters = { ...this.filters, ...filters };
  }

  // Get current filters
  getFilters(): ConsoleFilter {
    return { ...this.filters };
  }

  // Check if message matches current filters
  private matchesFilter(message: ConsoleMessage): boolean {
    // Type filter
    if (!this.filters.types.includes(message.type)) {
      return false;
    }

    // Source filter
    if (this.filters.sources.length > 0 && !this.filters.sources.includes(message.source || '')) {
      return false;
    }

    // Text search
    if (this.filters.searchText) {
      const searchText = this.filters.searchText.toLowerCase();
      const content = message.content.toLowerCase();
      if (!content.includes(searchText)) {
        return false;
      }
    }

    // Time range filter
    if (this.filters.timeRange) {
      const { start, end } = this.filters.timeRange;
      if (message.timestamp < start || message.timestamp > end) {
        return false;
      }
    }

    return true;
  }

  // Subscribe to new messages
  subscribe(id: string, callback: (message: ConsoleMessage) => void): void {
    this.subscribers.set(id, callback);
  }

  // Unsubscribe from messages
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  // Export console data
  exportData(): string {
    const exportData = {
      messages: this.messages,
      commands: this.commands,
      filters: this.filters,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Import console data
  importData(jsonData: string): { imported: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.messages && Array.isArray(data.messages)) {
        this.messages = data.messages;
      }
      
      if (data.commands && Array.isArray(data.commands)) {
        this.commands = data.commands;
      }
      
      if (data.filters) {
        this.filters = data.filters;
      }
      
      return { imported: true };
    } catch (error) {
      return { 
        imported: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON' 
      };
    }
  }

  // Get console statistics
  getStatistics(): {
    totalMessages: number;
    messagesByType: { [key: string]: number };
    messagesBySource: { [key: string]: number };
    totalCommands: number;
    averageExecutionTime?: number;
    oldestMessage?: number;
    newestMessage?: number;
  } {
    const messagesByType: { [key: string]: number } = {};
    const messagesBySource: { [key: string]: number } = {};
    let oldestMessage: number | undefined;
    let newestMessage: number | undefined;

    this.messages.forEach(message => {
      // Count by type
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;
      
      // Count by source
      const source = message.source || 'unknown';
      messagesBySource[source] = (messagesBySource[source] || 0) + 1;
      
      // Track timestamps
      if (!oldestMessage || message.timestamp < oldestMessage) {
        oldestMessage = message.timestamp;
      }
      if (!newestMessage || message.timestamp > newestMessage) {
        newestMessage = message.timestamp;
      }
    });

    // Calculate average execution time for commands
    let averageExecutionTime: number | undefined;
    const commandsWithTime = this.commands.filter(cmd => cmd.executionTime !== undefined);
    if (commandsWithTime.length > 0) {
      const totalTime = commandsWithTime.reduce((sum, cmd) => sum + (cmd.executionTime || 0), 0);
      averageExecutionTime = totalTime / commandsWithTime.length;
    }

    return {
      totalMessages: this.messages.length,
      messagesByType,
      messagesBySource,
      totalCommands: this.commands.length,
      averageExecutionTime,
      oldestMessage,
      newestMessage
    };
  }

  // Search messages
  searchMessages(query: string): ConsoleMessage[] {
    const lowerQuery = query.toLowerCase();
    return this.messages.filter(message => 
      message.content.toLowerCase().includes(lowerQuery) ||
      (message.source && message.source.toLowerCase().includes(lowerQuery))
    );
  }

  // Get messages in time range
  getMessagesInTimeRange(start: number, end: number): ConsoleMessage[] {
    return this.messages.filter(message => 
      message.timestamp >= start && message.timestamp <= end
    );
  }

  // Set maximum messages
  setMaxMessages(max: number): void {
    this.maxMessages = Math.max(1, max);
    
    // Trim messages if necessary
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  // Set maximum commands
  setMaxCommands(max: number): void {
    this.maxCommands = Math.max(1, max);
    
    // Trim commands if necessary
    while (this.commands.length > this.maxCommands) {
      this.commands.shift();
    }
  }

  // Format message for display
  formatMessage(message: ConsoleMessage): string {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const source = message.source ? `[${message.source}]` : '';
    const prefix = `${timestamp} ${source}`;
    
    switch (message.type) {
      case 'error':
        return `${prefix} ERROR: ${message.content}`;
      case 'warn':
        return `${prefix} WARN: ${message.content}`;
      case 'info':
        return `${prefix} INFO: ${message.content}`;
      case 'debug':
        return `${prefix} DEBUG: ${message.content}`;
      case 'trace':
        return `${prefix} TRACE: ${message.content}`;
      default:
        return `${prefix} LOG: ${message.content}`;
    }
  }

  // Get message with full details
  getMessageDetails(id: string): ConsoleMessage | undefined {
    return this.messages.find(message => message.id === id);
  }

  // Delete specific message
  deleteMessage(id: string): boolean {
    const index = this.messages.findIndex(message => message.id === id);
    if (index !== -1) {
      this.messages.splice(index, 1);
      return true;
    }
    return false;
  }

  // Delete specific command
  deleteCommand(id: string): boolean {
    const index = this.commands.findIndex(command => command.id === id);
    if (index !== -1) {
      this.commands.splice(index, 1);
      return true;
    }
    return false;
  }
}
