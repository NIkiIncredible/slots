import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import Store from 'electron-store'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { migrateToV2, validateConfigV2, type SlotConfig } from '../config/schema'
import { defaultConfig } from '../config/defaults'

const configStore = new Store<{ config: SlotConfig }>({
  name: 'gcm-config',
  defaults: { config: defaultConfig },
})

const quotaStore = new Store<{ consumed: Record<string, number>; lastResetISO: string }>({
  name: 'gcm-quotas',
  defaults: { consumed: {}, lastResetISO: '' },
})

function getAssetsDir(): string {
  const dir = path.join(app.getPath('userData'), 'assets')
  return dir
}

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }) } catch {}
}

function shouldResetNow(cfg: SlotConfig, lastISO: string): boolean {
  const [hh, mm] = cfg.reset.dailyResetTime.split(':').map(s => parseInt(s, 10))
  const now = new Date()
  const nowHH = now.getHours()
  const nowMM = now.getMinutes()
  const last = lastISO ? new Date(lastISO) : null
  const sameDay = last && now.toDateString() === last.toDateString()
  // Trigger reset when time matches target minute and not already reset this day
  return nowHH === hh && nowMM === mm && !sameDay
}

function scheduleDailyReset(getWindow: () => BrowserWindow | null) {
  setInterval(async () => {
    const cfg = configStore.get('config')
    const lastISO = quotaStore.get('lastResetISO')
    if (shouldResetNow(cfg, lastISO)) {
      quotaStore.set('consumed', {})
      const iso = new Date().toISOString()
      quotaStore.set('lastResetISO', iso)
      const win = getWindow()
      win?.webContents.send('quota:didReset')
    }
  }, 30000) // check every 30s
}

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  // Config
  ipcMain.handle('project:save', async (_e, cfg: unknown) => {
    const valid = validateConfigV2(cfg as any)
    configStore.set('config', valid)
    return true
  })

  ipcMain.handle('project:load', async () => {
    const cfg = configStore.get('config')
    try {
      return migrateToV2(cfg)
    } catch {
      return defaultConfig
    }
  })

  ipcMain.handle('project:export', async (_e, cfgMaybe?: unknown) => {
    try {
      const cfg = cfgMaybe ? validateConfigV2(cfgMaybe) : configStore.get('config')
      const win = getWindow()
      const { canceled, filePath } = await dialog.showSaveDialog(win ?? undefined, {
        title: 'Export Slot Config',
        defaultPath: 'config.gcmcfg',
        filters: [{ name: 'GCM Config', extensions: ['gcmcfg', 'json'] }],
      })
      if (canceled || !filePath) return false
      await fs.writeFile(filePath, JSON.stringify(cfg, null, 2), 'utf-8')
      return true
    } catch (e) {
      console.error('Export failed', e)
      return false
    }
  })

  ipcMain.handle('project:import', async () => {
    const win = getWindow()
    const { canceled, filePaths } = await dialog.showOpenDialog(win ?? undefined, {
      title: 'Import Slot Config',
      filters: [{ name: 'GCM Config', extensions: ['gcmcfg', 'json'] }],
      properties: ['openFile'],
    })
    if (canceled || !filePaths?.[0]) return null
    const raw = await fs.readFile(filePaths[0], 'utf-8')
    const data = JSON.parse(raw)
    const valid = migrateToV2(data)
    configStore.set('config', valid)
    return valid
  })

  // Quotas
  ipcMain.handle('quota:load', async () => {
    return { consumed: quotaStore.get('consumed'), lastResetISO: quotaStore.get('lastResetISO') }
  })
  ipcMain.handle('quota:save', async (_e, payload: { consumed: Record<string, number>; lastResetISO?: string }) => {
    quotaStore.set('consumed', payload.consumed || {})
    if (payload.lastResetISO) quotaStore.set('lastResetISO', payload.lastResetISO)
    return true
  })
  ipcMain.handle('quota:reset', async () => {
    quotaStore.set('consumed', {})
    const iso = new Date().toISOString()
    quotaStore.set('lastResetISO', iso)
    const win = getWindow()
    win?.webContents.send('quota:didReset')
    return true
  })

  // Assets
  ipcMain.handle('assets:list', async () => {
    const dir = getAssetsDir()
    await ensureDir(dir)
    const entries = await fs.readdir(dir)
    const list = await Promise.all(entries.map(async (name) => {
      const full = path.join(dir, name)
      const stat = await fs.stat(full)
      // Provide a file:// URL so renderer can load even when served from http dev server
      const fileUrl = pathToFileURL(full).toString()
      return { name, relPath: fileUrl, size: stat.size }
    }))
    return list
  })

  ipcMain.handle('assets:add', async (_e, items: { name: string; dataBase64: string }[]) => {
    const dir = getAssetsDir()
    await ensureDir(dir)
    for (const it of items) {
      const full = path.join(dir, it.name)
      const data = Buffer.from(it.dataBase64, 'base64')
      await fs.writeFile(full, data)
    }
    return true
  })

  ipcMain.handle('assets:remove', async (_e, name: string) => {
    const dir = getAssetsDir()
    await ensureDir(dir)
    const full = path.join(dir, name)
    try { await fs.unlink(full) } catch {}
    return true
  })

  ipcMain.handle('assets:rename', async (_e, oldName: string, newName: string) => {
    const dir = getAssetsDir()
    await ensureDir(dir)
    const from = path.join(dir, oldName)
    const to = path.join(dir, newName)
    await fs.rename(from, to)
    return true
  })

  // External buzzer event (or simulated) forwarded to renderer
  ipcMain.handle('buzzer:pressed', async () => {
    const win = getWindow()
    win?.webContents.send('buzzer:pressed')
    return true
  })

  scheduleDailyReset(getWindow)
}

export function getStoredConfig(): SlotConfig {
  try {
    return validateConfigV2(configStore.get('config'))
  } catch {
    return defaultConfig
  }
}
