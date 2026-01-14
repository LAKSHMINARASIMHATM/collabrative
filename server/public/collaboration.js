class CollaborationClient {
    constructor(options = {}) {
        // Default configuration
        this.config = {
            serverUrl: 'ws://localhost:3001',
            reconnect: true,
            maxReconnectAttempts: 5,
            reconnectInterval: 3000,
            ...options
        };

        // State
        this.socket = null;
        this.reconnectAttempts = 0;
        this.connected = false;
        this.documentId = options.documentId || 'default-document';
        this.user = options.user || { id: `user-${Math.random().toString(36).substr(2, 9)}` };

        // Event handlers
        this.handlers = {
            connect: [],
            disconnect: [],
            error: [],
            message: [],
            document: []
        };

        // Initialize
        this.connect();
    }

    // Connect to WebSocket server
    connect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            console.warn('WebSocket is already connecting or connected');
            return;
        }

        try {
            this.socket = new WebSocket(this.config.serverUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.handleError(error);
            this.attemptReconnect();
        }
    }

    // Set up WebSocket event handlers
    setupEventHandlers() {
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.trigger('connect');
            
            // Join document room
            this.send({
                type: 'join',
                documentId: this.documentId,
                user: this.user
            });
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.trigger('message', data);
                
                // Handle different message types
                if (data.type === 'document') {
                    this.trigger('document', data);
                } else if (data.type === 'error') {
                    this.handleError(new Error(data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error processing message:', error);
                this.trigger('message', { type: 'raw', data: event.data });
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.connected = false;
            this.trigger('disconnect', { code: event.code, reason: event.reason });
            
            if (this.config.reconnect) {
                this.attemptReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleError(error);
        };
    }

    // Send a message to the server
    send(data) {
        if (!this.connected) {
            console.warn('Cannot send message: WebSocket is not connected');
            return false;
        }

        try {
            const message = typeof data === 'string' ? data : JSON.stringify({
                ...data,
                documentId: this.documentId,
                timestamp: new Date().toISOString()
            });
            
            this.socket.send(message);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            this.handleError(error);
            return false;
        }
    }

    // Disconnect from the server
    disconnect() {
        if (this.socket) {
            this.config.reconnect = false; // Prevent auto-reconnect
            this.socket.close();
            this.socket = null;
            this.connected = false;
        }
    }

    // Attempt to reconnect to the server
    attemptReconnect() {
        if (!this.config.reconnect || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.config.reconnectInterval * this.reconnectAttempts;
        
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts}) in ${delay}ms`);
        
        setTimeout(() => {
            if (!this.connected) {
                this.connect();
            }
        }, delay);
    }

    // Event handling
    on(event, callback) {
        if (!this.handlers[event]) {
            console.warn(`Unknown event: ${event}`);
            return;
        }
        this.handlers[event].push(callback);
    }

    off(event, callback) {
        if (!this.handlers[event]) return;
        
        if (callback) {
            this.handlers[event] = this.handlers[event].filter(handler => handler !== callback);
        } else {
            this.handlers[event] = [];
        }
    }

    trigger(event, ...args) {
        if (!this.handlers[event]) return;
        
        for (const handler of this.handlers[event]) {
            try {
                handler(...args);
            } catch (error) {
                console.error(`Error in ${event} handler:`, error);
            }
        }
    }

    // Error handling
    handleError(error) {
        console.error('Collaboration error:', error);
        this.trigger('error', error);
    }

    // Document operations
    updateDocument(update) {
        return this.send({
            type: 'update',
            update,
            documentId: this.documentId,
            user: this.user
        });
    }

    // Presence
    updatePresence(presence) {
        return this.send({
            type: 'presence',
            presence,
            documentId: this.documentId,
            user: this.user
        });
    }
}

// Export for CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationClient;
} else if (typeof define === 'function' && define.amd) {
    define([], () => CollaborationClient);
} else {
    window.CollaborationClient = CollaborationClient;
}
