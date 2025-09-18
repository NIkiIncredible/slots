<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {TextCursor, Trash} from "lucide-vue-next";

const assets = ref<{ name: string; relPath: string; size: number }[]>([])
const error = ref('')
const dragging = ref(false)
const renameMap = ref<Record<string, string>>({})

async function refresh() {
  try {
    assets.value = await (window.gcm?.assetsList?.() ?? Promise.resolve([]))
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  dragging.value = true
}

function onDragLeave() {
  dragging.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault();
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  await uploadFiles(files)
}

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  await uploadFiles(files)
  input.value = ''
}

async function uploadFiles(files: File[]) {
  try {
    const allowed = ['image/png', 'image/webp', 'image/svg+xml']
    const maxBytes = 2 * 1024 * 1024
    const items: { name: string; dataBase64: string }[] = []
    for (const f of files) {
      if (!allowed.includes(f.type)) throw new Error(`Ungültiges Format: ${f.name}`)
      if (f.size > maxBytes) throw new Error(`Datei zu groß (>2MB): ${f.name}`)
      const buf = await f.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      items.push({name: f.name, dataBase64: b64})
    }
    await window.gcm?.assetsAdd?.(items)
    await refresh()
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
}

async function removeAsset(name: string) {
  await window.gcm?.assetsRemove?.(name)
  await refresh()
}

async function renameAsset(oldName: string) {
  const newName = renameMap.value[oldName]?.trim()
  if (!newName || newName === oldName) return
  await window.gcm?.assetsRename?.(oldName, newName)
  await refresh()
}

onMounted(() => refresh())
</script>

<template>
  <Card class="asset-manager">
    <CardHeader>
      <CardTitle>
        Assets
      </CardTitle>
    </CardHeader>
    <CardContent class="grid">
      <div class="upload-wrapper">
        <div class="dropzone" :class="{ dragging }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
          <div>Drag&Drop PNG/SVG/WebP hierher oder <label class="pick">Dateien wählen<input type="file"
                                                                                            accept=".png,.webp,.svg"
                                                                                            multiple @change="onPick"
                                                                                            hidden></label></div>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div class="asset-list">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vorschau</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="a in assets" :key="a.name">
              <TableCell class="thumb"><img :src="a.relPath" alt=""/></TableCell>
              <TableCell>
                <div>{{ a.name }}</div>
                <input v-model="renameMap[a.name]" placeholder="Neuer Name.ext"/>
              </TableCell>
              <TableCell>{{ (a.size / 1024).toFixed(1) }} KB</TableCell>
              <TableCell>
                <div class="flex gap-2">
                  <Trash @click="removeAsset(a.name)" title="Löschen" class="cursor-pointer"/>
                  <TextCursor @click="renameAsset(a.name)" title="Umbenennen" class="cursor-pointer"/>
                </div>

                <!--                <button >Löschen</button>-->
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.dropzone { border: 2px dashed #666; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 8px; }
.dropzone.dragging { background: rgba(255,255,255,0.05); }
/*
.asset-manager { border: 1px solid #444; border-radius: 6px; padding: 8px; }
.pick { color: #3aa3ff; cursor: pointer; }
.list { max-height: 260px; overflow: auto; border-top: 1px solid #333; }
.row { display: grid; grid-template-columns: 80px 1fr 100px 200px; gap: 8px; align-items: center; padding: 6px 0; border-bottom: 1px solid #222; }
.row.head { font-weight: 700; position: sticky; top: 0; background: inherit; }
.thumb { width: 64px; height: 48px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.thumb img { max-width: 100%; max-height: 100%; }
.error { color: #e74c3c; margin: 6px 0; }
 */
</style>
