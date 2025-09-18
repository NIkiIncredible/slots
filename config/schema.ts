import { z } from "zod"

// =========================
// Schema v2 for quota-first
// =========================

export const ReelSymbolSchema = z.object({
  id: z.string(),             // eindeutige Symbol-ID
  name: z.string(),           // Anzeigename
  assetPath: z.string(),      // relativer Pfad zum Icon
  weight: z.number().min(1).default(1), // optional, primär für Mapping
})
export type ReelSymbol = z.infer<typeof ReelSymbolSchema>

export const PrizeTypeEnum = z.enum(["TWO_OF_A_KIND","THREE_OF_A_KIND","SPECIAL_COMBO","NONE"])
export type PrizeType = z.infer<typeof PrizeTypeEnum>

export const SpecialComboSchema = z.object({
  symbols: z.array(z.string()).min(2), // z.B. ["a","b","c"] Reihenfolge egal
  matchMode: z.enum(["ANY_ORDER"]).default("ANY_ORDER"),
})
export type SpecialCombo = z.infer<typeof SpecialComboSchema>

export const PrizeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: PrizeTypeEnum,
  // für SPECIAL_COMBO erforderlich:
  special: SpecialComboSchema.optional(),
  dailyMax: z.number().int().min(0),   // Tageskontingent
  // Laufzeitfelder (werden nicht exportiert, separat im quotaStore persistiert):
  _consumedToday: z.number().int().min(0).optional(),
})
export type Prize = z.infer<typeof PrizeSchema>

export const FallbackSchema = z.object({
  enabled: z.boolean().default(true),
  prefer: z.enum(["TWO_OF_A_KIND","NONE"]).default("TWO_OF_A_KIND"),
})
export type FallbackConfig = z.infer<typeof FallbackSchema>

export const UISchema = z.object({
  theme: z.enum(["dark","light"]).default("dark"),
  fullscreen: z.boolean().default(false),
  kiosk: z.boolean().default(false),
  cursorHidden: z.boolean().default(false),
})
export type UIConfig = z.infer<typeof UISchema>

export const AnimationSchema = z.object({
  reelCount: z.number().int().min(3).max(6).default(3),
  spinMinMs: z.number().int().min(300).default(500),
  spinMaxMs: z.number().int().min(500).default(900),
  reelStaggerMs: z.number().int().min(0).default(150),
  easing: z.enum(["linear","easeOut"]).default("easeOut"),
})
export type AnimationConfig = z.infer<typeof AnimationSchema>

export const ResetSchema = z.object({
  timezone: z.string().default("Europe/Berlin"),
  dailyResetTime: z.string().regex(/^\d{2}:\d{2}$/).default("04:00"), // HH:MM
})
export type ResetConfig = z.infer<typeof ResetSchema>

export const SlotConfigSchema = z.object({
  version: z.literal(2),
  symbols: z.array(ReelSymbolSchema),
  reels: z.array(z.array(z.string())).min(3), // Arrays von Symbol-IDs je Reel
  prizes: z.array(PrizeSchema),
  allowLosers: z.boolean().default(true), // "Gibt Nieten?"
  fallback: FallbackSchema,
  ui: UISchema,
  animation: AnimationSchema,
  reset: ResetSchema,
  sounds: z.object({
    start: z.string().optional(),
    stop: z.string().optional(),
    win: z.string().optional(),
  }).default({}),
})
export type SlotConfig = z.infer<typeof SlotConfigSchema>

// Validation + Migration helper
export function validateConfigV2(data: unknown): SlotConfig {
  const parsed = SlotConfigSchema.safeParse(data)
  if (!parsed.success) {
    const message = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid slot config (v2):\n${message}`)
  }
  return parsed.data
}

export function migrateToV2(data: any): SlotConfig {
  try {
    // If already v2 and valid, return as-is
    return validateConfigV2(data)
  } catch {
    // attempt migration from legacy v1 used in this repo
    if (data && data.version === 1 && Array.isArray(data.reels)) {
      const symSet = new Map<string, { id: string; name: string; weight: number }>()
      for (const reel of data.reels) {
        for (const cell of reel) {
          const id = String(cell.symbol)
          if (!symSet.has(id)) symSet.set(id, { id, name: id, weight: Math.max(1, Number(cell.weight)||1) })
        }
      }
      const symbols = Array.from(symSet.values()).map(s => ({ id: s.id, name: s.name, assetPath: `assets/${s.id}.png`, weight: s.weight }))
      const reels = data.reels.map((reel: any[]) => reel.map(cell => String(cell.symbol)))
      const prizes = [
        { id: 'p_two', label: '2 Gleiche', type: 'TWO_OF_A_KIND', dailyMax: 50 },
        { id: 'p_three', label: '3 Gleiche', type: 'THREE_OF_A_KIND', dailyMax: 10 },
      ]
      const cfg: SlotConfig = {
        version: 2,
        symbols,
        reels,
        prizes,
        allowLosers: true,
        fallback: { enabled: true, prefer: 'TWO_OF_A_KIND' },
        ui: { theme: 'dark', fullscreen: false, kiosk: false, cursorHidden: false },
        animation: { reelCount: Math.max(3, reels.length), spinMinMs: 500, spinMaxMs: 900, reelStaggerMs: 150, easing: 'easeOut' },
        reset: { timezone: 'Europe/Berlin', dailyResetTime: '04:00' },
        sounds: {},
      }
      return cfg
    }
    // Fallback to defaults will be handled by caller
    throw new Error('Cannot migrate config to v2')
  }
}
