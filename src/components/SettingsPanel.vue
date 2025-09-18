<script setup lang="ts">
import { useConfigStore } from '../../store/configStore'
import { useQuotaStore } from '../../store/quotaStore'

const cfg = useConfigStore()
const quotas = useQuotaStore()

function resetQuotas() {
  quotas.resetAll()
}
</script>

<template>
  <div class="settings-panel">
    <h3>Einstellungen</h3>
    <div class="grid">
      <label>Theme
        <select v-model="cfg.config.ui.theme">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>
      <label><input type="checkbox" v-model="cfg.config.ui.fullscreen" /> Vollbild/Kiosk</label>
      <label><input type="checkbox" v-model="cfg.config.ui.kiosk" /> Kiosk-Modus</label>
      <label><input type="checkbox" v-model="cfg.config.ui.cursorHidden" /> Cursor verstecken</label>
    </div>

    <h4>Tages-Reset</h4>
    <div class="grid">
      <label>Zeitzone
        <input v-model="cfg.config.reset.timezone" placeholder="Europe/Berlin" />
      </label>
      <label>Reset-Zeit (HH:MM)
        <input v-model="cfg.config.reset.dailyResetTime" placeholder="04:00" />
      </label>
      <div>
        <button @click="resetQuotas">Kontingente manuell zurücksetzen</button>
      </div>
    </div>

    <h4>Assets</h4>
    <p>Assets werden im App-Datenordner gespeichert und per relativem Pfad (assets/...) referenziert.</p>
  </div>
</template>

<style scoped>
/*
.settings-panel { border: 1px solid #444; border-radius: 6px; padding: 8px; }
.grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); }

 */
</style>
