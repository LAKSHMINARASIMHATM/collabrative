const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs').promises

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        title: 'CodeSync IDE',
    })

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000')
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../out/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})

// IPC Handlers

// File System Operations
ipcMain.handle('open-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })

    if (result.canceled) {
        return null
    }

    return result.filePaths[0]
})

ipcMain.handle('read-file', async (_, filepath) => {
    try {
        return await fs.readFile(filepath, 'utf-8')
    } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`)
    }
})

ipcMain.handle('write-file', async (_, filepath, content) => {
    try {
        await fs.writeFile(filepath, content, 'utf-8')
        return true
    } catch (error) {
        throw new Error(`Failed to write file: ${error.message}`)
    }
})

ipcMain.handle('read-directory', async (_, dirpath) => {
    try {
        const entries = await fs.readdir(dirpath, { withFileTypes: true })
        return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            path: path.join(dirpath, entry.name)
        }))
    } catch (error) {
        throw new Error(`Failed to read directory: ${error.message}`)
    }
})

ipcMain.handle('create-file', async (_, filepath, content = '') => {
    try {
        await fs.writeFile(filepath, content, 'utf-8')
        return true
    } catch (error) {
        throw new Error(`Failed to create file: ${error.message}`)
    }
})

ipcMain.handle('delete-file', async (_, filepath) => {
    try {
        await fs.unlink(filepath)
        return true
    } catch (error) {
        throw new Error(`Failed to delete file: ${error.message}`)
    }
})

// Native command execution
ipcMain.handle('execute-command', async (_, command, cwd) => {
    const { spawn } = require('child_process')

    return new Promise((resolve, reject) => {
        const process = spawn(command, {
            shell: true,
            cwd: cwd || app.getPath('home')
        })

        let stdout = ''
        let stderr = ''

        process.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        process.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        process.on('close', (code) => {
            resolve({ stdout, stderr, exitCode: code })
        })

        process.on('error', (error) => {
            reject(error)
        })
    })
})
