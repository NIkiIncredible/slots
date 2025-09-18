<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import OperatorView from './components/OperatorView.vue'
import ConfigView from './components/ConfigView.vue'
import { useConfigStore } from '../store/configStore'
import { useQuotaStore } from '../store/quotaStore'

const tab = ref<'operator' | 'config'>('operator')
const cfg = useConfigStore()
const quotas = useQuotaStore()

const themeClass = computed(() => cfg.theme === 'dark' ? 'dark' : 'light')
const fullscreenClass = computed(() => cfg.isFullscreen ? 'fullscreen' : '')

onMounted(() => {
  // Auto-load last config
  cfg.loadConfig()
  // Initialize quotas (load persisted state and subscribe to resets)
  quotas.init()
})
</script>

<template>
  <div :class="['app-root', themeClass, fullscreenClass]">
    <header class="topbar">
      <h1>GCM Slot Controller</h1>
      <nav>
        <button :class="{ active: tab==='operator' }" @click="tab='operator'">Operator</button>
        <button :class="{ active: tab==='config' }" @click="tab='config'">Config</button>
      </nav>
    </header>

    <main class="content text-c">
      <OperatorView v-if="tab==='operator'" />
      <ConfigView v-else />
    </main>
  </div>
</template>

<style scoped>
.app-root {
  @apply min-h-screen;
}
/*
.app-root { height: 100vh; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #444; }
.topbar h1 { font-size: 18px; margin: 0; }
.topbar nav button { margin-left: 8px; }
.content { flex: 1; overflow: scroll; }
.theme-dark { background: #111; color: #eee; }
.theme-light { background: #f8f8f8; color: #222; }
.fullscreen { cursor: none; }
button.active { font-weight: 700; text-decoration: underline; }
 */
</style>
