import { BrowserWindow } from 'electron'
import path from 'node:path'

export function createMainWindow(options: { preloadPath: string; iconPath?: string }) {
  const win = new BrowserWindow({
    icon: options.iconPath,
    webPreferences: {
      preload: options.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  return win
}
