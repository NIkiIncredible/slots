// mapping.ts
// Maps target prize definitions to concrete stop indices per reel
// README: synthesizeStopsForPrize returns an array of indices (length = reel count)
// for the given config and prize goal. Fallbacks should be handled by the caller
// if this returns null.

import type { SlotConfig, Prize, PrizeType } from '../config/schema'

function indexReels(reels: string[]) {
  const map = new Map<string, number[]>()
  reels.forEach((symId, idx) => {
    if (!map.has(symId)) map.set(symId, [])
    map.get(symId)!.push(idx)
  })
  return map
}

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Choose a symbol id that exists on all provided maps
function findCommonSymbol(maps: Map<string, number[]>[]): string | null {
  if (maps.length === 0) return null
  const [first, ...rest] = maps
  for (const key of first.keys()) {
    if (rest.every(m => m.has(key))) return key
  }
  return null
}

export function synthesizeStopsForPrize(config: SlotConfig, prize: Prize | { type: PrizeType; special?: Prize['special'] }): number[] | null {
  const reels = config.reels
  const reelMaps = reels.map(r => indexReels(r))

  if (prize.type === 'THREE_OF_A_KIND') {
    // Require 3 or more reels
    if (reels.length < 3) return null
    const sym = findCommonSymbol(reelMaps)
    if (!sym) return null
    return reelMaps.map((m) => randPick(m.get(sym)!))
  }

  if (prize.type === 'TWO_OF_A_KIND') {
    // Find any symbol common to at least two reels
    // Strategy: try each pair of reels
    for (let i = 0; i < reelMaps.length; i++) {
      for (let j = i + 1; j < reelMaps.length; j++) {
        for (const sym of reelMaps[i].keys()) {
          if (reelMaps[j].has(sym)) {
            const stops: number[] = new Array(reels.length)
            stops[i] = randPick(reelMaps[i].get(sym)!)
            stops[j] = randPick(reelMaps[j].get(sym)!)
            // For remaining reels choose a symbol index that tries to avoid accidental 3-kind
            for (let k = 0; k < reelMaps.length; k++) {
              if (k === i || k === j) continue
              const keys = Array.from(reelMaps[k].keys())
              const nonMatching = keys.filter(id => id !== sym)
              const chosenSym = (nonMatching.length ? randPick(nonMatching) : randPick(keys))
              stops[k] = randPick(reelMaps[k].get(chosenSym)!)
            }
            return stops
          }
        }
      }
    }
    return null
  }

  if (prize.type === 'SPECIAL_COMBO') {
    const wanted = prize.special?.symbols ?? []
    if (wanted.length === 0) return null
    // ANY_ORDER: assign symbols to reels greedily
    const stops: number[] = new Array(reels.length)
    const remaining = new Set(wanted)
    // First pass: try to place each desired symbol onto a distinct reel that has it
    const usedReels = new Set<number>()
    for (const sym of remaining) {
      let placed = false
      for (let i = 0; i < reelMaps.length; i++) {
        if (usedReels.has(i)) continue
        if (reelMaps[i].has(sym)) {
          stops[i] = randPick(reelMaps[i].get(sym)!)
          usedReels.add(i)
          placed = true
          break
        }
      }
      if (!placed) return null // cannot place this symbol anywhere
    }
    // Fill any remaining reels with any symbol (avoid increasing a match class inadvertently)
    for (let i = 0; i < reels.length; i++) {
      if (stops[i] === undefined) {
        const keys = Array.from(reelMaps[i].keys())
        const chosen = randPick(keys)
        stops[i] = randPick(reelMaps[i].get(chosen)!)
      }
    }
    return stops
  }

  if (prize.type === 'NONE') {
    // Choose random stops, trying to avoid two-of-a-kind if possible
    const stops: number[] = new Array(reels.length)
    const chosenSymbols: string[] = []
    for (let i = 0; i < reels.length; i++) {
      const m = reelMaps[i]
      const keys = Array.from(m.keys())
      const nonMatching = keys.filter(k => !chosenSymbols.includes(k))
      const chosen = (nonMatching.length ? randPick(nonMatching) : randPick(keys))
      chosenSymbols.push(chosen)
      stops[i] = randPick(m.get(chosen)!)
    }
    return stops
  }

  return null
}
