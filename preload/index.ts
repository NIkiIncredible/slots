import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('gcm', {
  // Project
  saveProject: (config: unknown) => ipcRenderer.invoke('project:save', config) as Promise<boolean>,
  loadProject: () => ipcRenderer.invoke('project:load') as Promise<any>,
  exportProject: (config?: unknown) => ipcRenderer.invoke('project:export', config) as Promise<boolean>,
  importProject: () => ipcRenderer.invoke('project:import') as Promise<any>,

  // Quotas
  quotaLoad: () => ipcRenderer.invoke('quota:load') as Promise<any>,
  quotaSave: (payload: any) => ipcRenderer.invoke('quota:save', payload) as Promise<boolean>,
  quotaReset: () => ipcRenderer.invoke('quota:reset') as Promise<boolean>,
  onQuotaDidReset: (cb: () => void) => ipcRenderer.on('quota:didReset', cb as any),

  // Assets
  assetsList: () => ipcRenderer.invoke('assets:list') as Promise<any[]>,
  assetsAdd: (items: { name: string; dataBase64: string }[]) => ipcRenderer.invoke('assets:add', items) as Promise<boolean>,
  assetsRemove: (name: string) => ipcRenderer.invoke('assets:remove', name) as Promise<boolean>,
  assetsRename: (oldName: string, newName: string) => ipcRenderer.invoke('assets:rename', oldName, newName) as Promise<boolean>,

  // Buzzer
  onBuzzer: (cb: () => void) => ipcRenderer.on('buzzer:pressed', cb as any),
  offBuzzer: (cb: () => void) => ipcRenderer.off('buzzer:pressed', cb as any),
})

// Keep the simple ipcRenderer passthrough for compatibility if needed
declare global {
  interface Window {
    ipcRenderer: typeof ipcRenderer
  }
}

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...inner) => (listener as any)(event, ...inner))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})
