<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import gsap from 'gsap'
import { useConfigStore } from '../../store/configStore'

const props = defineProps<{
  reels: string[][]
  result: string[]
  spinning: boolean
}>()

const cfg = useConfigStore()
const symById = computed(() => Object.fromEntries(cfg.config.symbols.map(s => [s.id, s])))

function getSrc(id: string) { return symById.value[id]?.assetPath || '' }
function getName(id: string) { return symById.value[id]?.name || id }

const columns = ref<HTMLElement[]>([])

onMounted(() => {
  // init positions
})

watch(() => props.spinning, (val) => {
  if (val) {
    // Start simple spin animation on each column
    columns.value.forEach((el, i) => {
      gsap.to(el, { y: -el.scrollHeight, duration: 2, yoyo: true, repeat: 0, ease: 'power1.inOut', delay: i * 0.05 })
    })
  } else {
    // Stop and reset
    columns.value.forEach((el) => gsap.killTweensOf(el))
    gsap.to(columns.value, { y: 0, duration: 0.2 })
  }
})

function shuffleArray(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
</script>

<template>
  <div class="slots-wrapper">
    <div class="slots-column" v-for="(reel, i) in reels" :key="i" ref="columns">
      <div class="slot-col-item h-full" v-for="(symId, j) in reel" :key="j">
        <img class="icon" :src="getSrc(symId)" alt="" />
        <span class="label">{{ getName(symId) }}</span>
      </div>
    </div>
  </div>

  <div class="slot-preview">
    <div class="reel" v-for="(reel, i) in reels" :key="i">
      <div class="col">
        <div class="cell" v-for="(symId, j) in shuffleArray(reel)" :key="j">
          <img class="icon" :src="getSrc(symId)" alt="" />
          <span class="label">{{ getName(symId) }}</span>
        </div>
      </div>
      <div class="indicator" :class="{ hit: result[i] }">{{ result[i] || '' }}</div>
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/css/style.css';

.slots-wrapper {
  @apply w-full
  flex justify-evenly
  border-2 border-gray-200
  overflow-hidden rounded-lg
}

.slots-column {
  @apply max-h-full grow;

  .slot-col-item {
    @apply flex items-center justify-center;
  }
}
/*
.slot-preview { display: flex; gap: 12px; padding: 12px; border: 1px solid #444; border-radius: 8px; min-height: 240px; }
.reel { width: 140px; position: relative; display: flex; flex-direction: column; align-items: center; }
.col { border: 1px solid #555; border-radius: 6px; overflow: hidden; height: 200px; width: 100%; display: flex; flex-direction: column; align-items: stretch; }
.cell { flex: 1; display: flex; align-items: center; justify-content: flex-start; gap: 8px; border-bottom: 1px solid #333; min-height: 48px; padding: 0 6px; }
.icon { width: 28px; height: 28px; object-fit: contain; background: #111; border: 1px solid #222; border-radius: 4px; }
.label { opacity: 0.9; font-size: 12px; }
.indicator { margin-top: 8px; font-weight: 700; font-size: 18px; }
.indicator.hit { color: #f1c40f; text-shadow: 0 0 6px rgba(241, 196, 15, 0.6); }

 */
</style>
