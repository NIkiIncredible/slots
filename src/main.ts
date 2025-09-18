import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import './assets/css/style.css'

const app = createApp(App)
app.use(createPinia())

app.mount('#app').$nextTick(() => {
    // Keep sample event logger
    if (window.ipcRenderer) {
        window.ipcRenderer.on('main-process-message', (_event: any, message: string) => {
            console.log(message)
        })
    }
})
