<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue'
import {useConfigStore} from '../../store/configStore'
import {useQuotaStore} from '../../store/quotaStore'
import SlotPreview from './SlotPreview.vue'
import {planSpin, type SpinResult} from '../../engine/slotEngine'
import {Howl} from 'howler'

const cfg = useConfigStore()
const quotas = useQuotaStore()
const lastResult = ref<SpinResult | null>(null)
const logs = ref<string[]>([])
const spinning = ref(false)

let startSound: Howl | null = null
let stopSound: Howl | null = null
let winSound: Howl | null = null

function ensureSounds() {
  const s = cfg.config.sounds
  startSound = s.start ? new Howl({src: [s.start]}) : null
  stopSound = s.stop ? new Howl({src: [s.stop]}) : null
  winSound = s.win ? new Howl({src: [s.win]}) : null
}

function log(msg: string) {
  logs.value.unshift(`${new Date().toLocaleTimeString()} ${msg}`)
  logs.value = logs.value.slice(0, 100)
}

async function startSpin() {
  if (spinning.value) return
  spinning.value = true
  ensureSounds()
  startSound?.play()

  // Simulate spin delay
  setTimeout(() => {
    // Use quota-first engine planning
    const plan = planSpin(cfg.config, {
      getRemaining: (id: string) => quotas.getRemaining(id, cfg.config),
      consume: (id: string, n = 1) => quotas.consume(id, n, cfg.config),
    })
    const symbols = cfg.config.reels.map((reel, i) => reel[plan.stops[i]] ?? '')
    const res: SpinResult = {symbols}
    lastResult.value = res

    stopSound?.play()
    if (plan.prize) {
      log(`WIN: ${plan.prize.label} [${plan.type}]`)
      winSound?.play()
    } else if (plan.type !== 'NONE') {
      log(`Result: ${plan.type}`)
    } else {
      log('No win')
    }
    spinning.value = false
  }, 800)
}

function onBuzzer() {
  startSpin()
}

onMounted(() => {
  window.gcm?.onBuzzer(onBuzzer)
})

onUnmounted(() => {
  window.gcm?.offBuzzer(onBuzzer)
})
</script>

<template>
  <div class="slots-view h-screen w-full flex items-center justify-center">
    <div class="slots-wrapper h-[50%] max-w-sm w-full flex grow justify-evenly border-2 overflow-hidden rounded-lg border-gray-200">
      <div class="slots-col max-h-full grow">
        <div class="slot-col-item h-full">
          A
        </div>
        <div class="slot-col-item h-full">
          B
        </div>
        <div class="slot-col-item h-full">
          C
        </div>
      </div>
      <div class="slots-col grow">
        <div class="slot-col-item">
          A
        </div>
        <div class="slot-col-item">
          B
        </div>
        <div class="slot-col-item">
          C
        </div>
      </div>
      <div class="slots-col grow">
        <div class="slot-col-item">
          A
        </div>
        <div class="slot-col-item">
          B
        </div>
        <div class="slot-col-item">
          C
        </div>
      </div>
    </div>
  </div>
  <div class="operator-view">
    <div class="left">
      <button class="start" :disabled="spinning" @click="startSpin">{{ spinning ? 'Spinning...' : 'START' }}</button>
      <div class="result" v-if="lastResult">Result: {{ lastResult.symbols.join(' | ') }}</div>
      <div class="quotas">
        <h3>Kontingente heute</h3>
        <div class="qlist">
          <div v-for="p in cfg.config.prizes" :key="p.id" class="qrow">
            <span class="plabel">{{ p.label }}</span>
            <span class="pval">{{ quotas.getRemaining(p.id, cfg.config) }} / {{ p.dailyMax }}</span>
          </div>
        </div>
      </div>
      <div class="logs">
        <h3>Logs</h3>
        <div class="loglist">
          <div v-for="(l, i) in logs" :key="i" class="log">{{ l }}</div>
        </div>
      </div>
    </div>
    <div class="right">
      <SlotPreview :reels="cfg.config.reels" :result="lastResult?.symbols || []" :spinning="spinning"/>
    </div>
  </div>
</template>

<style scoped>
.slots-col {
  @apply grow;
  .slot-col-item {
    @apply flex items-center justify-center;
  }
}
/*.operator-view { display: flex; gap: 16px; height: 100%; padding: 12px; box-sizing: border-box; }
.left { width: 320px; display: flex; flex-direction: column; gap: 12px; }
.start { font-size: 32px; padding: 20px; }
.result { font-size: 18px; }
.logs { flex: 1; overflow: hidden; border: 1px solid #444; border-radius: 6px; padding: 8px; }
.loglist { height: 100%; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; }
.right { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; }

 */
</style>
