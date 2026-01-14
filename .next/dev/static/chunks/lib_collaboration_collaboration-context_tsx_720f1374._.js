(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/collaboration/collaboration-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ClientSideSuspense",
    ()=>ClientSideSuspense,
    "CollaborationProvider",
    ()=>CollaborationProvider,
    "useCollaboration",
    ()=>useCollaboration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.7_@babel+core@7.2_37aa62a12a629c79ec0e1f9665a79769/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.7_@babel+core@7.2_37aa62a12a629c79ec0e1f9665a79769/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$yjs$40$13$2e$6$2e$27$2f$node_modules$2f$yjs$2f$dist$2f$yjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/yjs@13.6.27/node_modules/yjs/dist/yjs.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$y$2d$websocket$40$3$2e$0$2e$0_yjs$40$13$2e$6$2e$27$2f$node_modules$2f$y$2d$websocket$2f$src$2f$y$2d$websocket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/y-websocket@3.0.0_yjs@13.6.27/node_modules/y-websocket/src/y-websocket.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const CollaborationContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function CollaborationProvider({ children, roomId: roomId, roomPassword: roomPassword = '', initialCode = '', onAuthError, user }) {
    _s();
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [code, setCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialCode); // Local mirror
    const [provider, setProvider] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [doc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "CollaborationProvider.useState": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$yjs$40$13$2e$6$2e$27$2f$node_modules$2f$yjs$2f$dist$2f$yjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Doc"]()
    }["CollaborationProvider.useState"]);
    const yText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$yjs$40$13$2e$6$2e$27$2f$node_modules$2f$yjs$2f$dist$2f$yjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"]());
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [connectionStatus, setConnectionStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('disconnected');
    // Chat state
    const [chatMessages, setChatMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const chatArrayRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Awareness state
    const [cursorPosition, setCursorInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    // Initialize Y.Text with initial code
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CollaborationProvider.useEffect": ()=>{
            if (initialCode && yText.current) {
                const text = yText.current;
                text.delete(0, text.length);
                text.insert(0, initialCode);
            }
        }
    }["CollaborationProvider.useEffect"], [
        initialCode
    ]);
    // Memoize dependencies to avoid TypeScript parsing issues
    const memoizedRoomId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CollaborationProvider.useMemo[memoizedRoomId]": ()=>roomId
    }["CollaborationProvider.useMemo[memoizedRoomId]"], [
        roomId
    ]);
    const memoizedRoomPassword = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CollaborationProvider.useMemo[memoizedRoomPassword]": ()=>roomPassword
    }["CollaborationProvider.useMemo[memoizedRoomPassword]"], [
        roomPassword
    ]);
    const memoizedUserId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CollaborationProvider.useMemo[memoizedUserId]": ()=>user?.id
    }["CollaborationProvider.useMemo[memoizedUserId]"], [
        user?.id
    ]);
    const memoizedOnAuthError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CollaborationProvider.useMemo[memoizedOnAuthError]": ()=>onAuthError
    }["CollaborationProvider.useMemo[memoizedOnAuthError]"], [
        onAuthError
    ]);
    // Initialize Yjs and WebSocket connection
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CollaborationProvider.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            let wsProvider = null;
            let connectionTimeout = null;
            let retryCount = 0;
            const maxRetries = 3;
            const retryDelay = 2000; // 2 seconds
            const attemptConnection = {
                "CollaborationProvider.useEffect.attemptConnection": async ()=>{
                    try {
                        setIsLoading(true);
                        setError(null);
                        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        // Collaboration server runs on port 3001
                        const wsUrl = `${wsProtocol}//${window.location.hostname}:3001`;
                        console.log(`Attempting WebSocket connection to: ${wsUrl} (Attempt ${retryCount + 1}/${maxRetries})`);
                        // Initialize WebSocket provider with authentication
                        wsProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$y$2d$websocket$40$3$2e$0$2e$0_yjs$40$13$2e$6$2e$27$2f$node_modules$2f$y$2d$websocket$2f$src$2f$y$2d$websocket$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebsocketProvider"](wsUrl, memoizedRoomId, doc, {
                            connect: true,
                            params: {
                                password: memoizedRoomPassword,
                                userId: memoizedUserId || 'anonymous'
                            }
                        });
                        // Add connection timeout
                        connectionTimeout = setTimeout({
                            "CollaborationProvider.useEffect.attemptConnection": ()=>{
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
                            }
                        }["CollaborationProvider.useEffect.attemptConnection"], 10000); // 10 second timeout
                        wsProvider.on('status', {
                            "CollaborationProvider.useEffect.attemptConnection": (event)=>{
                                const connected = event.status === 'connected';
                                setIsConnected(connected);
                                setConnectionStatus(event.status);
                                if (connected) {
                                    setIsLoading(false);
                                    setError(null);
                                }
                            }
                        }["CollaborationProvider.useEffect.attemptConnection"]);
                        wsProvider.on('connection-close', {
                            "CollaborationProvider.useEffect.attemptConnection": (event)=>{
                                // Only log abnormal closures to reduce console noise
                                if (event && event.code === 1006) {
                                    console.warn('WebSocket connection closed abnormally - server may be down');
                                }
                                setIsConnected(false);
                                setConnectionStatus('disconnected');
                                if (event && event.code === 1006) {
                                    const errorMsg = 'WebSocket server unavailable. Please ensure the server is running.';
                                    setError(errorMsg);
                                    onAuthError?.(errorMsg);
                                } else if (event && event.code === 1000) {
                                    setError(null); // Clear error on normal closure
                                }
                            }
                        }["CollaborationProvider.useEffect.attemptConnection"]);
                        wsProvider.on('connection-error', {
                            "CollaborationProvider.useEffect.attemptConnection": (event)=>{
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
                            }
                        }["CollaborationProvider.useEffect.attemptConnection"]);
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
                }
            }["CollaborationProvider.useEffect.attemptConnection"];
            // Start the connection process
            attemptConnection();
            return ({
                "CollaborationProvider.useEffect": ()=>{
                    if (wsProvider) {
                        wsProvider.destroy();
                    }
                    // Clear any pending timeout
                    if (connectionTimeout) {
                        clearTimeout(connectionTimeout);
                    }
                }
            })["CollaborationProvider.useEffect"];
        }
    }["CollaborationProvider.useEffect"], [
        memoizedRoomId,
        memoizedRoomPassword,
        memoizedUserId,
        memoizedOnAuthError
    ]);
    // Cursor handling wrapper
    const setCursorPosition = (pos)=>{
        setCursorInfo(pos);
        if (provider) {
            provider.awareness.setLocalStateField('cursor', pos);
        }
    };
    // Undo/Redo - usually handled by Y.UndoManager attached to editor
    // We can expose simple wrappers or letting the editor handle it.
    // For now, no-op or basic implementation if we had UndoManager here.
    const undo = ()=>{};
    const redo = ()=>{};
    // Compatibility setCode - imperfect for concurrent edits if not bound via MonacoBinding
    // Use this only for initialization or non-editor updates
    const handleCodeChange = (newCode)=>{
        if (yText.current && yText.current.toString() !== newCode) {
            const text = yText.current;
            text.delete(0, text.length);
            text.insert(0, newCode);
        }
    };
    // --- Send chat message ---
    const sendMessage = (content, user)=>{
        if (!chatArrayRef.current) return;
        const msg = {
            id: Date.now().toString(),
            userId: user.id || 'anonymous',
            userName: user.name || user.email || 'User',
            content,
            timestamp: new Date().toISOString()
        };
        chatArrayRef.current.push([
            msg
        ]);
    };
    // Get Y.Text for Monaco binding
    const sharedText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CollaborationProvider.useMemo[sharedText]": ()=>doc.getText('monaco')
    }["CollaborationProvider.useMemo[sharedText]"], [
        doc
    ]);
    const contextValue = {
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
        retry: ()=>{
            setError(null);
            setIsLoading(true);
        // Reconnect logic will be triggered by the effect
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CollaborationContext.Provider, {
        value: contextValue,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `fixed bottom-4 right-4 p-2 rounded-md text-sm ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`,
                children: [
                    "Status: ",
                    connectionStatus
                ]
            }, void 0, true, {
                fileName: "[project]/lib/collaboration/collaboration-context.tsx",
                lineNumber: 311,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/lib/collaboration/collaboration-context.tsx",
        lineNumber: 309,
        columnNumber: 5
    }, this);
}
_s(CollaborationProvider, "RuOkwOFjs6hJihl3r9k8E8my+oY=");
_c = CollaborationProvider;
const useCollaboration = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(CollaborationContext);
    if (!context) {
        throw new Error('useCollaboration must be used within a CollaborationProvider');
    }
    return context;
};
_s1(useCollaboration, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const ClientSideSuspense = ({ children })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$babel$2b$core$40$7$2e$2_37aa62a12a629c79ec0e1f9665a79769$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
};
_c1 = ClientSideSuspense;
var _c, _c1;
__turbopack_context__.k.register(_c, "CollaborationProvider");
__turbopack_context__.k.register(_c1, "ClientSideSuspense");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=lib_collaboration_collaboration-context_tsx_720f1374._.js.map