const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // File System
    openDirectory: () => ipcRenderer.invoke('open-directory'),
    readFile: (filepath) => ipcRenderer.invoke('read-file', filepath),
    writeFile: (filepath, content) => ipcRenderer.invoke('write-file', filepath, content),
    readDirectory: (dirpath) => ipcRenderer.invoke('read-directory', dirpath),
    createFile: (filepath, content) => ipcRenderer.invoke('create-file', filepath, content),
    deleteFile: (filepath) => ipcRenderer.invoke('delete-file', filepath),

    // Native Commands
    executeCommand: (command, cwd) => ipcRenderer.invoke('execute-command', command, cwd),

    // Platform info
    platform: process.platform,
    isElectron: true,
})
