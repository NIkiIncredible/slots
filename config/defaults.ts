import type { SlotConfig } from './schema'

// Default config for v2 schema
// 3 Reels, 6 Symbols, basic prizes with daily quotas, fallback enabled
export const defaultConfig: SlotConfig = {
  version: 2,
  symbols: [
    { id: 'cherry', name: 'Cherry', assetPath: 'assets/cherry.png', weight: 3 },
    { id: 'lemon', name: 'Lemon', assetPath: 'assets/lemon.png', weight: 3 },
    { id: 'orange', name: 'Orange', assetPath: 'assets/orange.png', weight: 3 },
    { id: 'bell', name: 'Bell', assetPath: 'assets/bell.png', weight: 2 },
    { id: 'bar', name: 'BAR', assetPath: 'assets/bar.png', weight: 2 },
    { id: 'seven', name: 'Seven', assetPath: 'assets/seven.png', weight: 1 },
  ],
  reels: [
    ['cherry','lemon','orange','bell','bar','seven'],
    ['lemon','orange','cherry','bell','bar','seven'],
    ['orange','cherry','lemon','bell','bar','seven'],
  ],
  prizes: [
    { id: 'p-two', label: '2 Gleiche', type: 'TWO_OF_A_KIND', dailyMax: 100 },
    { id: 'p-three', label: '3 Gleiche', type: 'THREE_OF_A_KIND', dailyMax: 20 },
    { id: 'p-combo', label: 'Combo: Bell+BAR+Seven', type: 'SPECIAL_COMBO', dailyMax: 5, special: { symbols: ['bell','bar','seven'], matchMode: 'ANY_ORDER' } },
  ],
  allowLosers: true,
  fallback: { enabled: true, prefer: 'TWO_OF_A_KIND' },
  ui: { theme: 'dark', fullscreen: false, kiosk: false, cursorHidden: false },
  animation: { reelCount: 3, spinMinMs: 500, spinMaxMs: 900, reelStaggerMs: 200, easing: 'easeOut' },
  reset: { timezone: 'Europe/Berlin', dailyResetTime: '04:00' },
  sounds: {},
}
