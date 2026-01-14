# Advanced Collaboration Features

## Overview
The IDE now includes comprehensive collaboration tools for real-time teamwork.

## Features

### 1. **Screen Sharing**
- Share your screen with collaborators
- Uses WebRTC for peer-to-peer streaming
- Click "Screen Share" button to start
- Browser permission required

**How to use:**
```typescript
// Automatically handled by the button
navigator.mediaDevices.getDisplayMedia({ video: true })
```

### 2. **Video Calls**
- Integrated with Google Meet
- Opens new video call window
- Share link with collaborators
- Alternative: Zoom, Microsoft Teams

**Integration options:**
- Google Meet (default)
- Zoom API
- Daily.co
- Jitsi Meet (self-hosted)

### 3. **Voice Chat**
- Real-time voice communication
- Low latency audio
- Push-to-talk option
- Coming soon feature

### 4. **Whiteboard**
- Collaborative drawing
- Sketch ideas and diagrams
- Annotate code concepts
- Coming soon feature

### 5. **Session Settings**
Control collaboration permissions:
- **Allow editing** - Let others edit code
- **Show cursors** - Display collaborator cursors
- **Enable chat** - Allow text messaging
- **Notifications** - Get alerts for changes
- **End Session** - Terminate collaboration

## Collaboration Tools Grid

```
┌─────────────┬─────────────┐
│ Screen Share│ Video Call  │
├─────────────┼─────────────┤
│ Voice Chat  │ Whiteboard  │
└─────────────┴─────────────┘
```

## Integration Guide

### Screen Sharing Setup

1. **Browser Support:**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari: Requires user permission

2. **Implementation:**
```typescript
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    cursor: 'always',
    displaySurface: 'monitor'
  }
})
```

### Video Call Integration

**Option 1: Google Meet**
```typescript
// Create instant meeting
window.open('https://meet.google.com/new', '_blank')
```

**Option 2: Zoom**
```typescript
// Requires Zoom SDK
import ZoomVideo from '@zoom/videosdk'
const client = ZoomVideo.createClient()
await client.join(sessionName, token, userName)
```

**Option 3: Daily.co**
```typescript
// Install: npm install @daily-co/daily-js
import DailyIframe from '@daily-co/daily-js'
const callFrame = DailyIframe.createFrame()
await callFrame.join({ url: 'https://your-domain.daily.co/room' })
```

### Voice Chat Setup

**Using WebRTC:**
```typescript
const peerConnection = new RTCPeerConnection()
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream)
})
```

**Using Agora:**
```typescript
// Install: npm install agora-rtc-sdk-ng
import AgoraRTC from 'agora-rtc-sdk-ng'
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
await client.join(appId, channel, token, uid)
```

## Session Permissions

### Permission Levels

1. **Owner** (Host)
   - Full control
   - Can end session
   - Manage permissions
   - Invite/remove users

2. **Editor**
   - Edit code
   - View all files
   - Use chat
   - Share screen

3. **Viewer**
   - Read-only access
   - View code
   - Use chat
   - Cannot edit

### Managing Permissions

```typescript
interface SessionSettings {
  allowEditing: boolean      // Can collaborators edit?
  showCursors: boolean       // Display cursor positions?
  enableChat: boolean        // Allow messaging?
  notifications: boolean     // Send change alerts?
}
```

## Best Practices

### 1. **Before Starting**
- Test screen share permissions
- Check microphone/camera
- Share collaboration link
- Set appropriate permissions

### 2. **During Collaboration**
- Use chat for quick questions
- Screen share for complex explanations
- Video call for discussions
- Whiteboard for diagrams

### 3. **Security**
- Use unique session IDs
- Set expiring links
- Control edit permissions
- End sessions when done

## Troubleshooting

### Screen Share Not Working
- Check browser permissions
- Allow screen capture in settings
- Try different browser
- Restart browser

### Video Call Issues
- Check internet connection
- Allow camera/microphone
- Update browser
- Clear cache

### Audio Problems
- Check microphone permissions
- Test audio input
- Adjust volume levels
- Use headphones to avoid echo

## Future Enhancements

- [ ] Built-in video chat (no external service)
- [ ] Collaborative whiteboard
- [ ] Code annotations
- [ ] Session recording
- [ ] Breakout rooms
- [ ] Hand raising
- [ ] Polls and voting
- [ ] File sharing
- [ ] Screen annotation
- [ ] Remote control

## API Reference

### Start Screen Share
```typescript
startScreenShare(): Promise<MediaStream>
```

### Join Video Call
```typescript
joinVideoCall(roomId: string): Promise<void>
```

### Enable Voice Chat
```typescript
enableVoiceChat(): Promise<void>
```

### Update Permissions
```typescript
updatePermissions(settings: SessionSettings): void
```

### End Session
```typescript
endSession(): Promise<void>
```
