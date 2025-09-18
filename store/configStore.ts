import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { SlotConfig } from '../config/schema'
import { defaultConfig } from '../config/defaults'
import { migrateToV2, validateConfigV2 } from '../config/schema'

// Types for preload API
// Extended via preload to include quota/assets methods as well, but we only type what's used here
type GcmApi = {
  saveProject: (cfg: SlotConfig) => Promise<boolean>
  loadProject: () => Promise<any>
  exportProject: (cfg?: SlotConfig) => Promise<boolean>
  importProject: () => Promise<any>
  onBuzzer: (cb: () => void) => void
  offBuzzer: (cb: () => void) => void
}

declare global {
  interface Window {
    gcm?: GcmApi
  }
}

export const useConfigStore = defineStore('config', {
  state: () => ({
    config: reactive<SlotConfig>({ ...defaultConfig }),
  }),
  getters: {
    theme: (state) => state.config.ui.theme,
    isFullscreen: (state) => state.config.ui.fullscreen,
  },
  actions: {
    async loadConfig() {
      try {
        const loaded = await window.gcm?.loadProject()
        if (loaded) this.updateConfig(migrateToV2(loaded))
        else this.updateConfig(defaultConfig)
      } catch (e) {
        console.warn('Failed to load config, using defaults', e)
        this.updateConfig(defaultConfig)
      }
    },
    async saveConfig() {
      try {
        await window.gcm?.saveProject(validateConfigV2(this.config))
        return true
      } catch (e) {
        console.error('Failed to save config', e)
        return false
      }
    },
    async exportConfig() {
      try {
        return await (window.gcm?.exportProject(validateConfigV2(this.config)) ?? Promise.resolve(false))
      } catch (e) {
        console.error('Failed to export config', e)
        return false
      }
    },
    async importConfig() {
      try {
        const imported = await window.gcm?.importProject()
        if (imported) this.updateConfig(migrateToV2(imported))
        return !!imported
      } catch (e) {
        console.error('Failed to import config', e)
        return false
      }
    },
    updateConfig(newCfg: SlotConfig) {
      Object.assign(this.config, newCfg)
    },
  },
})
