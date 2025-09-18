<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfigStore } from '../../store/configStore'

const cfg = useConfigStore()
const selectedReel = ref(0)

const symbols = computed(() => cfg.config.symbols)

function ensureReelCount(n: number) {
  while (cfg.config.reels.length < n) cfg.config.reels.push([])
  while (cfg.config.reels.length > n) cfg.config.reels.pop()
}

function addReel() { cfg.config.reels.push([]) }
function removeReel(i: number) { if (cfg.config.reels.length > 3) cfg.config.reels.splice(i, 1) }

function addSymbolToReel(symId: string, reelIdx: number) {
  cfg.config.reels[reelIdx].push(symId)
}
function removeSymbolFromReel(reelIdx: number, pos: number) {
  cfg.config.reels[reelIdx].splice(pos, 1)
}

function changeWeight(symId: string, delta: number) {
  const s = cfg.config.symbols.find(s => s.id === symId)
  if (!s) return
  s.weight = Math.max(1, (s.weight || 1) + delta)
}
</script>

<template>
  <div class="reel-designer">
    <h3>Reels</h3>
    <div class="toolbar">
      <button @click="addReel">Reel hinzufügen</button>
    </div>
    <div class="grid">
      <div v-for="(reel, i) in cfg.config.reels" :key="i" class="reel">
        <div class="reel-head">
          <div>Reel {{ i+1 }}</div>
          <button @click="removeReel(i)" :disabled="cfg.config.reels.length<=3">Löschen</button>
        </div>
        <div class="reel-body">
          <div class="cell" v-for="(symId, j) in reel" :key="j">
            <span>{{ symId }}</span>
            <button class="x" @click="removeSymbolFromReel(i,j)">×</button>
          </div>
        </div>
        <div class="add-area">
          <label>Symbol hinzufügen:</label>
          <select @change="(e:any)=> addSymbolToReel(e.target.value, i)">
            <option value="">-- wählen --</option>
            <option v-for="s in symbols" :key="s.id" :value="s.id">{{ s.name }} ({{ s.id }})</option>
          </select>
        </div>
      </div>
    </div>

    <h3>Symbole & Gewichte</h3>
    <div class="symbols">
      <div v-for="s in symbols" :key="s.id" class="sym">
        <img :src="s.assetPath" alt="" />
        <div class="info">
          <div class="name">{{ s.name }} ({{ s.id }})</div>
          <div class="path">{{ s.assetPath }}</div>
        </div>
        <div class="weight">
          <button @click="changeWeight(s.id, -1)">-</button>
          <span>{{ s.weight }}</span>
          <button @click="changeWeight(s.id, +1)">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
.reel-designer { border: 1px solid #444; border-radius: 6px; padding: 8px; }
.toolbar { margin-bottom: 8px; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.reel { border: 1px solid #333; border-radius: 8px; padding: 8px; }
.reel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.reel-body { min-height: 80px; border: 1px dashed #555; border-radius: 6px; padding: 6px; display: flex; flex-wrap: wrap; gap: 4px; }
.cell { background: #222; border: 1px solid #444; border-radius: 4px; padding: 2px 6px; display: inline-flex; gap: 6px; align-items: center; }
.cell .x { background: transparent; border: none; color: #f66; cursor: pointer; }
.add-area { margin-top: 6px; }
.symbols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 8px; margin-top: 8px; }
.sym { display: flex; gap: 8px; align-items: center; border: 1px solid #333; border-radius: 6px; padding: 6px; }
.sym img { width: 48px; height: 48px; object-fit: contain; background: #111; border: 1px solid #222; border-radius: 4px; }
.sym .info { flex: 1; }
.weight { display: flex; gap: 6px; align-items: center; }
 */
</style>
