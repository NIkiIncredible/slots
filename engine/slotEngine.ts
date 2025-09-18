import type { SlotConfig, Prize, PrizeType } from '../config/schema'
import { PrizeTypeEnum } from '../config/schema'
import { synthesizeStopsForPrize } from './mapping'

export type SpinPlan = {
  stops: number[]
  prize: Prize | null
  type: PrizeType
}

export type QuotaAccessor = {
  getRemaining: (prizeId: string) => number
  consume: (prizeId: string, n?: number) => boolean
}

// Lightweight runtime spin result used by Operator/Config views
export type SpinResult = { symbols: string[] }

function prioritize(prizes: Prize[]): Prize[] {
  const score = (p: Prize) => {
    switch (p.type) {
      case 'SPECIAL_COMBO': return 3
      case 'THREE_OF_A_KIND': return 2
      case 'TWO_OF_A_KIND': return 1
      default: return 0
    }
  }
  return [...prizes].sort((a,b) => score(b)-score(a))
}

export function planSpin(config: SlotConfig, quota: QuotaAccessor): SpinPlan {
  const available = prioritize(config.prizes.filter(p => quota.getRemaining(p.id) > 0))

  // Try to map available prizes in priority order
  for (const p of available) {
    const stops = synthesizeStopsForPrize(config, p)
    if (stops) {
      quota.consume(p.id, 1)
      return { stops, prize: p, type: p.type }
    }
  }

  // No quota prizes possible -> fallback
  if (config.fallback.enabled && config.fallback.prefer === 'TWO_OF_A_KIND') {
    const stops = synthesizeStopsForPrize(config, { type: 'TWO_OF_A_KIND' as PrizeType })
    if (stops) return { stops, prize: null, type: 'TWO_OF_A_KIND' }
  }

  if (config.allowLosers) {
    const stops = synthesizeStopsForPrize(config, { type: 'NONE' as PrizeType })
    if (stops) return { stops, prize: null, type: 'NONE' }
  }

  // As a last resort, try to produce two-of-a-kind deterministically
  const stops = synthesizeStopsForPrize(config, { type: 'TWO_OF_A_KIND' as PrizeType })
  return { stops: stops ?? new Array(config.reels.length).fill(0), prize: null, type: 'TWO_OF_A_KIND' }
}

// --- Compatibility helpers for early UI wiring ---
// Simple random spin that picks a random symbol from each reel list
export function spinReels(config: SlotConfig): SpinResult {
  const symbols = config.reels.map(reel => {
    const idx = Math.floor(Math.random() * Math.max(1, reel.length))
    return reel[idx] ?? ''
  })
  return { symbols }
}

// Naive client-side win check for preview/demo purposes
export function checkWin(result: SpinResult, _config: SlotConfig): { win: boolean; prize?: { name: string; payout: number } } {
  const s = result.symbols.filter(Boolean)
  if (s.length < 2) return { win: false }
  const counts = new Map<string, number>()
  for (const sym of s) counts.set(sym, (counts.get(sym) || 0) + 1)
  // three of a kind
  for (const [sym, n] of counts) {
    if (n >= 3) return { win: true, prize: { name: `3 of ${sym}`, payout: 10 } }
  }
  // two of a kind
  for (const [sym, n] of counts) {
    if (n >= 2) return { win: true, prize: { name: `2 of ${sym}`, payout: 2 } }
  }
  return { win: false }
}
