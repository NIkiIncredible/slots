import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { SlotConfig, Prize } from '../config/schema'
import { useConfigStore } from './configStore'

// IPC API expected from preload
type GcmQuotaApi = {
  quotaLoad: () => Promise<{ consumed: Record<string, number>; lastResetISO?: string } | null>
  quotaSave: (payload: { consumed: Record<string, number>; lastResetISO?: string }) => Promise<boolean>
  quotaReset: () => Promise<boolean>
  onQuotaDidReset?: (cb: () => void) => void
}

declare global {
  interface Window { gcm?: Partial<GcmQuotaApi> }
}

export const useQuotaStore = defineStore('quota', {
  state: () => ({
    consumed: reactive<Record<string, number>>({}),
    lastResetISO: '' as string,
  }),
  actions: {
    async init() {
      try {
        const loaded = await window.gcm?.quotaLoad?.()
        if (loaded) {
          Object.assign(this.consumed, loaded.consumed || {})
          this.lastResetISO = loaded.lastResetISO || ''
        }
        if (window.gcm?.onQuotaDidReset) {
          window.gcm.onQuotaDidReset(() => {
            this.resetLocal()
          })
        }
      } catch (e) {
        console.warn('quota: load failed', e)
      }
    },
    getRemaining(prizeId: string, cfg?: SlotConfig) {
      const config = cfg ?? useConfigStore().config
      const p = config.prizes.find(p => p.id === prizeId)
      if (!p) return 0
      const used = this.consumed[prizeId] || 0
      return Math.max(0, p.dailyMax - used)
    },
    consume(prizeId: string, n = 1, cfg?: SlotConfig) {
      const remaining = this.getRemaining(prizeId, cfg)
      if (remaining < n) return false
      this.consumed[prizeId] = (this.consumed[prizeId] || 0) + n
      // Persist async, fire and forget
      window.gcm?.quotaSave?.({ consumed: this.consumed, lastResetISO: this.lastResetISO })
      return true
    },
    resetLocal() {
      for (const k of Object.keys(this.consumed)) delete this.consumed[k]
      this.lastResetISO = new Date().toISOString()
    },
    async resetAll() {
      this.resetLocal()
      await window.gcm?.quotaReset?.()
    },
  },
})
