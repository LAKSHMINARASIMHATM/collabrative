# Real-time Collaboration Guide

Welcome to CodeSync's real-time collaboration feature! This document will guide you through setting up and using the collaborative editing capabilities.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [Usage](#usage)
5. [Troubleshooting](#troubleshooting)
6. [API Reference](#api-reference)

## Prerequisites

- Node.js 16.8 or later
- A Liveblocks account (get your API key from [Liveblocks Dashboard](https://liveblocks.io/dashboard))
- Basic understanding of React and Next.js

## Getting Started

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root and add your Liveblocks public key:

```env
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=your_public_key_here
```

### 2. Install Dependencies

```bash
pnpm install @liveblocks/client @liveblocks/react
```

## Features

- **Real-time Code Editing**: See changes from other users as they type
- **Multi-cursor Support**: View other users' cursors in real-time
- **User Presence**: See who else is in the document
- **Automatic Reconnection**: Handles network issues gracefully

## Usage

### Basic Implementation

1. **Wrap your app with LiveblocksProvider** (already done in `app/layout.tsx`)

2. **Use the CollaborativeEditor component**:

```tsx
import { CollaborativeEditor } from '@/components/collaborative-editor';

export default function CodePage() {
  return (
    <div className="h-screen">
      <CollaborativeEditor />
    </div>
  );
}
```

### Joining a Specific Room

By default, all users join the same room. To create separate rooms:

```tsx
function CodePage({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider roomId={roomId}>
      <CollaborativeEditor />
    </LiveblocksProvider>
  );
}
```

## Advanced Usage

### Customizing User Information

You can customize the user information by modifying the `LiveblocksProvider` in `providers/liveblocks-provider.tsx`:

```tsx
<RoomProvider 
  id={roomId}
  initialPresence={{
    cursor: null,
    selection: [],
    user: {
      name: currentUser.name, // Customize with your user's name
      color: currentUser.color, // Custom color
      avatar: currentUser.avatar, // Optional avatar URL
    },
  }}
>
```

### Handling User Presence

To show the list of connected users:

```tsx
import { useOthers } from '@/liveblocks.config';

function UserList() {
  const others = useOthers();
  
  return (
    <div className="user-list">
      {others.map(({ connectionId, presence }) => (
        <div key={connectionId} style={{ color: presence.user?.color }}>
          {presence.user?.name || 'Anonymous'}
        </div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Can't see other users' cursors**
   - Ensure all users are in the same room
   - Check that the Liveblocks public key is correctly set
   - Verify network connectivity

2. **Changes not syncing**
   - Check browser console for errors
   - Ensure you're using the latest version of the dependencies
   - Verify that the room ID is the same for all users

3. **Performance Issues**
   - For large files, consider implementing document chunking
   - Reduce the frequency of cursor position updates if needed

## API Reference

### Components

#### `CollaborativeEditor`

Props:
- `roomId`: (string) Optional custom room ID
- `onCodeChange`: (code: string) => void - Callback when code changes
- `initialCode`: (string) Initial code content

### Hooks

#### `useCollaboration()`

Returns:
- `code`: (string) Current code content
- `setCode`: (code: string) => void - Update the code
- `users`: (User[]) List of connected users
- `cursorPosition`: ({ x: number, y: number }) Current cursor position
- `setCursorPosition`: (position: { x: number, y: number }) => void - Update cursor position

## Best Practices

### 1. Room Management

#### Document-based Rooms
- **Unique Room IDs**: Generate unique room IDs for each document using a consistent pattern (e.g., `doc-{documentId}-{workspaceId}`)
- **Room Naming Conventions**: Use descriptive names that include the document type and purpose
  ```typescript
  // Example: Generate room ID
  const roomId = `doc-${documentId}-${workspaceId}`;
  ```

#### Resource Management
- **Cleanup on Unmount**: Always clean up resources when users leave a room
  ```typescript
  useEffect(() => {
    const room = client.room(roomId);
    
    // Setup room...
    
    return () => {
      room.leave();
    };
  }, [roomId]);
  ```
- **Connection Monitoring**: Track connection status and handle reconnections
  ```typescript
  room.subscribe('connection', (status) => {
    if (status === 'disconnected') {
      // Handle disconnection
    } else if (status === 'reconnected') {
      // Handle reconnection
    }
  });
  ```

### 2. Performance Optimization

#### State Management
- **Debounce Updates**: Prevent excessive state updates
  ```typescript
  import { debounce } from 'lodash';
  
  const debouncedUpdate = useCallback(
    debounce((code: string) => {
      // Update code in room storage
      room.getStorage().then((storage) => {
        storage.root.set('code', code);
      });
    }, 300),
    [room]
  );
  ```

#### Computation Handling
- **Web Workers**: Offload heavy computations
  ```typescript
  const worker = new Worker('/workers/code-processor.worker.js');
  worker.postMessage({ code: currentCode });
  worker.onmessage = (e) => {
    // Handle processed data
  };
  ```

#### Rendering Optimization
- **Virtual Scrolling**: For large documents
  ```typescript
  import { Virtuoso } from 'react-virtuoso';
  
  <Virtuoso
    style={{ height: '100%' }}
    data={linesOfCode}
    itemContent={(index) => (
      <div>{linesOfCode[index]}</div>
    )}
  />
  ```
- **Memoization**: Use `React.memo` and `useMemo` to prevent unnecessary re-renders

### 3. Security

#### Authentication & Authorization
- **JWT Authentication**: Implement proper auth flow
  ```typescript
  const client = createClient({
    publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
    authEndpoint: '/api/auth',
  });
  ```
- **Room Access Control**: Verify user permissions before joining
  ```typescript
  // In your auth endpoint
  if (!userHasAccess(user, roomId)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }
  ```

#### Data Validation
- **Input Sanitization**: Clean all user inputs
  ```typescript
  import DOMPurify from 'dompurify';
  
  const sanitizedInput = DOMPurify.sanitize(userInput);
  ```
- **Schema Validation**: Validate data with Zod or similar
  ```typescript
  import { z } from 'zod';
  
  const codeSchema = z.object({
    content: z.string().max(10000),
    language: z.enum(['javascript', 'typescript', 'python']),
  });
  ```

#### API Security
- **Environment Variables**: Never expose sensitive keys
  ```env
  # .env.local
  LIVEBLOCKS_SECRET_KEY=your_secret_key_here
  ```
- **Rate Limiting**: Protect your endpoints
  ```typescript
  import rateLimit from 'express-rate-limit';
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  ```

### 4. Error Handling

#### Graceful Degradation
- **Offline Support**: Implement local storage fallback
  ```typescript
  try {
    await room.connect();
  } catch (error) {
    console.error('Connection failed, using offline mode');
    // Fallback to local storage
  }
  ```

#### Error Boundaries
```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={(error) => {
    // Log error to your error tracking service
    logErrorToService(error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## Support

### Getting Help
- **Documentation**: [docs.codesync.example.com](https://docs.codesync.example.com)
- **Community Forum**: [community.codesync.example.com](https://community.codesync.example.com)
- **Email Support**: support@codesync.example.com
- **Status Page**: [status.codesync.example.com](https://status.codesync.example.com)

### Reporting Issues
When reporting issues, please include:
1. Steps to reproduce
2. Expected vs. actual behavior
3. Browser/OS version
4. Any error messages or logs

### Feature Requests
Submit feature requests through our [feature request portal](https://feedback.codesync.example.com)

### Emergency Support
For critical production issues, call our 24/7 support line: +1-XXX-XXX-XXXX
