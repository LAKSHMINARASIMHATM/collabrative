# Local File Import Guide

Complete guide to importing and working with local files in CodeSync IDE.

---

## 🎯 Three Ways to Import Local Files

### 1. Open Folder (Recommended)
**Best for**: Opening entire project directories

**Steps:**
1. Click the 📂 **folder icon** in the File Explorer sidebar (top-left)
2. Browser will prompt: "View files from [folder name]?"
3. Click **"View files"**
4. Your entire folder structure appears in the file explorer
5. All file changes auto-save to your local disk

**Features:**
- ✅ Full directory access
- ✅ Auto-saves to disk
- ✅ Detects external file changes
- ✅ Recent workspaces tracking
- ✅ Persistent across sessions

**Browser Support:**
- ✅ Chrome 86+
- ✅ Edge 86+
- ⚠️ Firefox: Limited support
- ❌ Safari: Not supported

---

### 2. Drag & Drop Files
**Best for**: Quick single file imports

**Steps:**
1. Open File Explorer / Finder on your computer
2. Drag one or more files into the IDE window
3. Files appear as new tabs in the editor
4. Edit and save normally

**Features:**
- ✅ Instant import
- ✅ Multiple file support
- ✅ Visual drop zone feedback
- ⚠️ Changes saved in browser only (not to disk)

**Supported File Types:**
- Text files: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.cpp`, `.c`, `.go`, `.rs`, `.php`
- Web files: `.html`, `.css`, `.json`, `.md`
- Config files: `.txt`, `.yaml`, `.yml`, `.env`
- Binary files: Displays as data URL

---

### 3. Clipboard Paste
**Best for**: Code snippets

**Steps:**
1. Copy code from anywhere
2. Create new file in IDE
3. Paste with `Ctrl+V` / `Cmd+V`
4. Save the file

---

## 🔧 File System Access API Setup

### First-Time Permission
When you click "Open Folder" for the first time:

```
┌─────────────────────────────────────┐
│ example.com wants to:               │
│ View files from "my-project"?       │
│                                     │
│  [Cancel]  [View files]             │
└─────────────────────────────────────┘
```

Click **"View files"** to grant access.

### Permission Levels

**Read Permission:**
- View file contents
- Navigate directory structure
- List all files

**Write Permission (automatic):**
- Edit files
- Create new files
- Delete files
- Rename files

### Revoking Access

**Chrome/Edge:**
1. Click 🔒 lock icon in address bar
2. Site settings → Permissions
3. Find "File System" → Reset
4. Reload page

---

## 📁 Workspace Features

### Auto-Save to Disk
All changes automatically save to your local files when using "Open Folder":

```typescript
// Edit any file
function hello() {
  console.log("Hello!")  // Changes save immediately
}
```

### File Watcher
Detects external changes and notifies you:

```
┌─────────────────────────────────────┐
│ ℹ️ config.js was modified externally │
└─────────────────────────────────────┘
```

**When triggered:**
- File edited in VS Code
- File modified by build tool
- Git pull updates files

### Recent Workspaces
Recently opened folders are tracked:

```typescript
workspaceManager.getRecentWorkspaces()
// Returns: [
//   { name: "my-app", path: "/Users/...", lastOpened: 1234567890 },
//   { name: "website", path: "/Users/...", lastOpened: 1234567880 }
// ]
```

---

## 🎨 Usage Examples

### Example 1: Opening React Project

1. Click 📂 folder icon
2. Navigate to `~/projects/my-react-app`
3. Click "Select Folder"
4. File tree appears:
```
my-react-app/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   └── components/
├── public/
├── package.json
└── README.md
```
5. Click any file to edit
6. Changes save automatically

### Example 2: Quick Python Script

1. Drag `script.py` from desktop into IDE
2. File opens in new tab
3. Edit code:
```python
import numpy as np

data = [1, 2, 3, 4, 5]
print(f"Mean: {np.mean(data)}")
```
4. Click ▶ **Run** button
5. Output appears in terminal

### Example 3: Multi-File Project

**Drag multiple files at once:**
```
Select in File Explorer:
- index.html
- styles.css  
- app.js

Drag all → IDE
```

All three files open as tabs!

---

## ⚙️ Advanced Features

### File Operations API

```typescript
// Read file
const content = await workspaceManager.readFile("src/App.tsx")

// Write file  
await workspaceManager.writeFile("src/App.tsx", newContent)

// Create file
await workspaceManager.createFile("src/NewComponent.tsx", content)

// Delete file
await workspaceManager.deleteFile("src/OldComponent.tsx")

// List directory
const files = await workspaceManager.listDirectory("src/")
```

### Programmatic Folder Opening

```typescript
import { WorkspaceManager } from "@/lib/workspace-manager"

const manager = new WorkspaceManager()

// Open folder
const workspace = await manager.openFolder()
console.log(workspace.name)  // "my-project"
console.log(workspace.files)  // FileNode[]

// Check if workspace is open
if (manager.isWorkspaceOpen()) {
  // Do work
}
```

### File Watcher Integration

```typescript
import { FileWatcher } from "@/lib/file-watcher"

const watcher = new FileWatcher()

// Start watching
await watcher.watch(directoryHandle)

// Listen for changes
watcher.onChange((changes) => {
  changes.forEach(change => {
    console.log(`${change.type}: ${change.path}`)
    // Output: "modified: src/App.tsx"
  })
})

// Stop watching
watcher.stop()
```

---

## 🐛 Troubleshooting

### "Permission denied" Error

**Cause**: Browser doesn't have file system permissions

**Fix:**
1. Refresh the page
2. Try opening folder again
3. Click "View files" when prompted

### Files Don't Appear

**Cause**: Hidden files or .gitignore

**Check:**
- `.git` folders are hidden by default
- `node_modules` are excluded
- Files starting with `.` may be hidden

**Fix**: These are intentionally excluded for performance

### External Changes Not Detected

**Cause**: File watcher polling interval

**Fix**: File watcher checks every 2 seconds. Wait a moment, or:
```typescript
// Adjust polling interval
await watcher.watch(dirHandle, 1000) // Check every 1s
```

### "Files saved in browser only"

**Cause**: Using drag-drop instead of Open Folder

**Fix**: Use 📂 **Open Folder** for persistent disk access

---

## 🔒 Security & Privacy

### What the IDE Can Access
✅ Only folders you explicitly select  
✅ Only while the tab is open  
❌ No access to other files/folders  
❌ No background access  

### Data Storage
- **Open Folder**: Changes save to YOUR disk
- **Drag & Drop**: Changes saved in browser memory only
- **No Cloud Upload**: All data stays local

### Permissions Reset
Browser forgets permissions when:
- You close all IDE tabs
- You clear browser data
- You manually revoke access

---

## 📊 Feature Comparison

| Feature | Open Folder | Drag & Drop | Clipboard |
|---------|-------------|-------------|-----------|
| Full directory | ✅ Yes | ❌ No | ❌ No |
| Auto-save to disk | ✅ Yes | ❌ No | ❌ No |
| File watcher | ✅ Yes | ❌ No | ❌ No |
| Multiple files | ✅ Yes | ✅ Yes | ❌ No |
| Persistent | ✅ Yes | ❌ No | ❌ No |
| Browser support | Chrome/Edge | All browsers | All browsers |

---

## 🎯 Best Practices

### 1. Use Open Folder for Projects
Always use the 📂 folder button for real project work. This ensures:
- Changes persist to disk
- File watcher detects external changes
- Full project structure available

### 2. Drag & Drop for Experiments
Use drag & drop for:
- Quick tests
- Reading files without editing
- Temporary work

### 3. Regular Saves
Even with auto-save, use `Ctrl+S` to ensure changes are written.

### 4. Check Browser Compatibility
Verify your browser supports File System Access API:
```javascript
if ('showDirectoryPicker' in window) {
  console.log('✅ Supported!')
} else {
  console.log('❌ Use Chrome or Edge')
}
```

---

## 🚀 Quick Start

**Import Your First Project:**

1. **Open the IDE** at `http://localhost:3000/test-editor`

2. **Click 📂** in file explorer

3. **Select your project folder**

4. **Start coding!** All changes auto-save

**That's it!** Your local files are now accessible in the IDE with full read/write access.

---

## 💡 Pro Tips

- **Keyboard Shortcut**: `Ctrl/Cmd + O` opens folder picker (if configured)
- **Recent Files**: Use the recent workspaces feature to quickly reopen projects
- **Drag Zone Visual**: Watch for highlight when dragging files over IDE
- **File Icons**: Different file types show different icons in explorer
- **Auto-detect Language**: File extension automatically sets syntax highlighting

---

## 📞 Need Help?

**File System API not available?**
→ Switch to Chrome or Edge browser

**Files not saving?**
→ Check browser console for permission errors

**Performance issues with large projects?**
→ `node_modules` is automatically excluded for better performance
