<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '../../store/configStore'
import { useQuotaStore } from '../../store/quotaStore'

const cfg = useConfigStore()
const quotas = useQuotaStore()

const prizes = computed(() => cfg.config.prizes)

function addPrize() {
  cfg.config.prizes.push({ id: `p-${Date.now()}`, label: 'Neuer Gewinn', type: 'TWO_OF_A_KIND', dailyMax: 10 })
}
function removePrize(idx: number) {
  cfg.config.prizes.splice(idx, 1)
}
</script>

<template>
  <div class="prize-designer">
    <h3>Gewinne & Kontingente</h3>
    <div class="toolbar">
      <button @click="addPrize">Gewinn hinzufügen</button>
      <label><input type="checkbox" v-model="cfg.config.allowLosers" /> Nieten erlauben</label>
    </div>
    <div class="prizelist">
      <div class="row head">
        <div>Bezeichnung</div>
        <div>Typ</div>
        <div>Spezial (optional)</div>
        <div>Tageskontingent</div>
        <div>Verfügbar heute</div>
        <div>Aktionen</div>
      </div>
      <div v-for="(p, i) in prizes" :key="p.id" class="row">
        <input v-model="p.label" />
        <select v-model="p.type">
          <option value="TWO_OF_A_KIND">2 Gleiche</option>
          <option value="THREE_OF_A_KIND">3 Gleiche</option>
          <option value="SPECIAL_COMBO">Spezial</option>
        </select>
        <div>
          <input v-if="p.type==='SPECIAL_COMBO'" :value="(p.special?.symbols||[]).join(',')" @input="(e:any)=>{ const v= e.target.value.split(',').map((s:string)=>s.trim()).filter(Boolean); p.special = { matchMode:'ANY_ORDER', symbols: v } }" placeholder="IDs, Komma-getrennt" />
        </div>
        <input type="number" min="0" v-model.number="p.dailyMax" style="width: 100px;" />
        <div>{{ quotas.getRemaining(p.id, cfg.config) }}</div>
        <div><button @click="removePrize(i)">Löschen</button></div>
      </div>
    </div>

    <div class="fallback">
      <h4>Fallback-Regel</h4>
      <label><input type="checkbox" v-model="cfg.config.fallback.enabled" /> Fallback aktiv</label>
      <label>
        Bevorzugt:
        <select v-model="cfg.config.fallback.prefer">
          <option value="TWO_OF_A_KIND">2 Gleiche</option>
          <option value="NONE">Niete</option>
        </select>
      </label>
    </div>
  </div>
</template>

<style scoped>
/*
.prize-designer { border: 1px solid #444; border-radius: 6px; padding: 8px; }
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.prizelist { border-top: 1px solid #333; }
.row { display: grid; grid-template-columns: 1.5fr 1fr 1.5fr 140px 140px 120px; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #222; }
.row.head { font-weight: 700; position: sticky; top: 0; background: inherit; }
.fallback { margin-top: 12px; }

 */
</style>
