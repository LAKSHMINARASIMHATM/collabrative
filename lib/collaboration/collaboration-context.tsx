'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
// Basic User interface compatible with previous usage
interface User {
  id?: string;
  info?: any;
  [key: string]: any;
}

type Collaborator = User & { id: string | number };

interface CollaborationContextType {
  users: Collaborator[];
  code: string;
  setCode: (code: string) => void;
  cursorPosition: { x: number; y: number };
  setCursorPosition: (position: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  room: any;
  provider: WebsocketProvider | null;
  doc: Y.Doc | null;
  yText: Y.Text | null;
  chatMessages: ChatMessage[];
  sendMessage: (content: string, user: any) => void;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

import type { ChatMessage } from './types';

interface CollaborationProviderProps {
  children: ReactNode;
  roomId: string;
  roomPassword?: string;
  initialCode?: string;
  onAuthError?: (error: string) => void;
  user?: { id: string } | null;
}

export function CollaborationProvider({
  children,
  roomId: roomId,
  roomPassword: roomPassword = '',
  initialCode = '',
  onAuthError,
  user
}: CollaborationProviderProps) {
  const [users, setUsers] = useState<Collaborator[]>([]);
  const [code, setCode] = useState(initialCode); // Local mirror
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [doc] = useState<Y.Doc>(() => new Y.Doc());
  const yText = useRef<Y.Text>(new Y.Text());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatArrayRef = useRef<Y.Array<any> | null>(null);

  // Awareness state
  const [cursorPosition, setCursorInfo] = useState({ x: 0, y: 0 });

  // Initialize Y.Text with initial code
  useEffect(() => {
    if (initialCode && yText.current) {
      const text = yText.current;
      text.delete(0, text.length);
      text.insert(0, initialCode);
    }
  }, [initialCode]);

  // Memoize dependencies to avoid TypeScript parsing issues
  const memoizedRoomId = useMemo(() => roomId, [roomId]);
  const memoizedRoomPassword = useMemo(() => roomPassword, [roomPassword]);
  const memoizedUserId = useMemo(() => user?.id, [user?.id]);
  const memoizedOnAuthError = useMemo(() => onAuthError, [onAuthError]);

  // Initialize Yjs and WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let wsProvider: WebsocketProvider | null = null;
    let connectionTimeout: NodeJS.Timeout | null = null;

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const attemptConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Collaboration server runs on port 3001
        const wsUrl = `${wsProtocol}//${window.location.hostname}:3001`;

        console.log(`Attempting WebSocket connection to: ${wsUrl} (Attempt ${retryCount + 1}/${maxRetries})`);

        // Initialize WebSocket provider with authentication
        wsProvider = new WebsocketProvider(wsUrl, memoizedRoomId, doc, {
          connect: true,
          params: {
            password: memoizedRoomPassword,
            userId: memoizedUserId || 'anonymous',
          },
        });

        // Add connection timeout
        connectionTimeout = setTimeout(() => {
          if (!isConnected) {
            console.warn('WebSocket connection timeout - server may be unavailable');
            if (retryCount < maxRetries - 1) {
              retryCount++;
              console.log(`Retrying connection in ${retryDelay}ms... (${retryCount}/${maxRetries})`);
              setTimeout(attemptConnection, retryDelay);
            } else {
              setError('WebSocket connection timeout after multiple attempts. Collaboration features will be disabled.');
              setIsLoading(false);
              console.log('Entering fallback mode - collaboration disabled');
            }
          }
        }, 10000); // 10 second timeout

        wsProvider.on('status', (event: { status: string }) => {
          const connected = event.status === 'connected';
          setIsConnected(connected);
          setConnectionStatus(event.status as any);

          if (connected) {
            setIsLoading(false);
            setError(null);
          }
        });

        wsProvider.on('connection-close', (event: any) => {
          // Only log abnormal closures to reduce console noise
          if (event && event.code === 1006) {
            console.warn('WebSocket connection closed abnormally - server may be down');
          }
          setIsConnected(false);
          setConnectionStatus('disconnected');

          if (event && event.code === 1006) { // Connection closed abnormally
            const errorMsg = 'WebSocket server unavailable. Please ensure the server is running.';
            setError(errorMsg);
            onAuthError?.(errorMsg);
          } else if (event && event.code === 1000) { // Normal closure
            setError(null); // Clear error on normal closure
          }
        });

        wsProvider.on('connection-error', (event: any) => {
          // Reduce console noise by only logging on first attempt or final failure
          if (retryCount === 0 || retryCount === maxRetries - 1) {
            console.warn('WebSocket connection error - server unavailable');
          }
          setIsConnected(false);

          let errorMsg = 'Failed to connect to WebSocket server.';

          // Check for specific error types
          if (event?.error?.message?.includes('WebSocket is closed before the connection is established')) {
            errorMsg = 'WebSocket server is not running or not accessible.';
          } else if (event?.error?.message?.includes('ECONNREFUSED')) {
            errorMsg = 'Connection refused. Please ensure the WebSocket server is running on port 3001.';
          } else if (event?.error?.message?.includes('Network error')) {
            errorMsg = 'Network error. Please check your connection and server availability.';
          } else {
            errorMsg = 'Failed to connect to WebSocket server.';
          }

          if (retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`Retrying connection in ${retryDelay}ms... (${retryCount}/${maxRetries})`);
            setTimeout(attemptConnection, retryDelay);
          } else {
            errorMsg += ' Collaboration features will be disabled until the server is available.';
            setError(errorMsg);
            onAuthError?.(errorMsg);
            setIsLoading(false);
            console.log('Entering fallback mode - collaboration disabled');
          }
        });

        setProvider(wsProvider);
      } catch (err) {
        // Reduce console noise - only log on first attempt or final failure
        if (retryCount === 0 || retryCount === maxRetries - 1) {
          console.warn('WebSocket setup failed - server may be unavailable');
        }
        let errorMsg = 'Failed to connect to room';

        if (err instanceof Error) {
          if (err.message.includes('WebSocket is closed before the connection is established')) {
            errorMsg = 'WebSocket server is not running.';
          } else {
            errorMsg = err.message;
          }
        }

        if (retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`Retrying connection in ${retryDelay}ms... (${retryCount}/${maxRetries})`);
          setTimeout(attemptConnection, retryDelay);
        } else {
          errorMsg += ' Collaboration features will be disabled until the server is available.';
          setError(errorMsg);
          onAuthError?.(errorMsg);
          setIsLoading(false);
          console.log('Entering fallback mode - collaboration disabled');
        }
      }
    };

    // Start the connection process
    attemptConnection();

    return () => {
      if (wsProvider) {
        wsProvider.destroy();
      }
      // Clear any pending timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [memoizedRoomId, memoizedRoomPassword, memoizedUserId, memoizedOnAuthError]);

  // Cursor handling wrapper
  const setCursorPosition = (pos: { x: number; y: number }) => {
    setCursorInfo(pos);
    if (provider) {
      provider.awareness.setLocalStateField('cursor', pos);
    }
  };

  // Undo/Redo - usually handled by Y.UndoManager attached to editor
  // We can expose simple wrappers or letting the editor handle it.
  // For now, no-op or basic implementation if we had UndoManager here.
  const undo = () => { };
  const redo = () => { };

  // Compatibility setCode - imperfect for concurrent edits if not bound via MonacoBinding
  // Use this only for initialization or non-editor updates
  const handleCodeChange = (newCode: string) => {
    if (yText.current && yText.current.toString() !== newCode) {
      const text = yText.current;
      text.delete(0, text.length);
      text.insert(0, newCode);
    }
  };

  // --- Send chat message ---
  const sendMessage = (content: string, user: any) => {
    if (!chatArrayRef.current) return;
    const msg = {
      id: Date.now().toString(),
      userId: user.id || 'anonymous',
      userName: user.name || user.email || 'User',
      content,
      timestamp: new Date().toISOString(),
    };
    chatArrayRef.current.push([msg]);
  };

  // Get Y.Text for Monaco binding
  const sharedText = useMemo(() => doc.getText('monaco'), [doc]);

  const contextValue: CollaborationContextType = {
    users,
    code,
    setCode: handleCodeChange,
    cursorPosition,
    setCursorPosition,
    undo,
    redo,
    canUndo: false,
    canRedo: false,
    room: null,
    provider,
    doc,
    yText: sharedText,
    chatMessages,
    sendMessage,
    isConnected,
    isLoading,
    error,
    retry: () => {
      setError(null);
      setIsLoading(true);
      // Reconnect logic will be triggered by the effect
    },
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
      <div className={`fixed bottom-4 right-4 p-2 rounded-md text-sm ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
        Status: {connectionStatus}
      </div>
    </CollaborationContext.Provider>
  );
}

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);

  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }

  return context;
};

export const ClientSideSuspense = ({ children }: any) => {
  return <>{children}</>;
};

