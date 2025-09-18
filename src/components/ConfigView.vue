<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfigStore } from '../../store/configStore'
import SlotPreview from './SlotPreview.vue'
import { spinReels } from '../../engine/slotEngine'
import AssetManager from './AssetManager.vue'
import ReelDesigner from './ReelDesigner.vue'
import PrizeDesigner from './PrizeDesigner.vue'
import SettingsPanel from './SettingsPanel.vue'

const cfg = useConfigStore()

const json = ref('')
const error = ref('')

function refreshJson() {
  json.value = JSON.stringify(cfg.config, null, 2)
}

watch(() => cfg.config, () => refreshJson(), { deep: true })
refreshJson()

async function onSave() { await cfg.saveConfig() }
async function onLoad() { await cfg.loadConfig(); refreshJson() }
async function onExport() { await cfg.exportConfig() }
async function onImport() { await cfg.importConfig(); refreshJson() }

function applyJson() {
  try {
    const obj = JSON.parse(json.value)
    cfg.updateConfig(obj)
    error.value = ''
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
}

// Live preview
const previewResult = ref<string[]>([])
function previewSpin() {
  const res = spinReels(cfg.config)
  previewResult.value = res.symbols
}
</script>

<template>
  <div class="config-view grid grid-cols-12">
    <div class="left col-span-8">
      <div class="panels">
        <AssetManager />
        <ReelDesigner />
        <PrizeDesigner />
        <SettingsPanel />
      </div>
      <div class="form">
        <div class="toolbar">
          <button @click="onSave">Speichern</button>
          <button @click="onLoad">Laden</button>
          <button @click="onImport">Importieren</button>
          <button @click="onExport">Exportieren</button>
        </div>
        <textarea v-model="json" @change="applyJson" spellcheck="false"></textarea>
        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>
    <div class="preview col-span-4">
      <div class="preview-toolbar">
        <button @click="previewSpin">Preview Spin</button>
      </div>
      <SlotPreview :reels="cfg.config.reels" :result="previewResult" :spinning="false" />
    </div>
  </div>
</template>

<style scoped>
.config-view { height: 100%; display: grid; grid-template-columns: 3fr 1fr; gap: 12px; padding: 12px; box-sizing: border-box; }
.left { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form { display: flex; flex-direction: column; min-width: 0; }
.toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
textarea { flex: 1; width: 100%; min-height: 260px; font-family: ui-monospace, monospace; font-size: 12px; background: transparent; color: inherit; border: 1px solid #444; border-radius: 6px; padding: 8px; }
.error { color: #e74c3c; margin-top: 6px; white-space: pre-wrap; }
.preview { min-width: 0; display: flex; flex-direction: column; }
.preview-toolbar { margin-bottom: 8px; }
</style>
