"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("gcm", {
  // Project
  saveProject: (config) => electron.ipcRenderer.invoke("project:save", config),
  loadProject: () => electron.ipcRenderer.invoke("project:load"),
  exportProject: (config) => electron.ipcRenderer.invoke("project:export", config),
  importProject: () => electron.ipcRenderer.invoke("project:import"),
  // Quotas
  quotaLoad: () => electron.ipcRenderer.invoke("quota:load"),
  quotaSave: (payload) => electron.ipcRenderer.invoke("quota:save", payload),
  quotaReset: () => electron.ipcRenderer.invoke("quota:reset"),
  onQuotaDidReset: (cb) => electron.ipcRenderer.on("quota:didReset", cb),
  // Assets
  assetsList: () => electron.ipcRenderer.invoke("assets:list"),
  assetsAdd: (items) => electron.ipcRenderer.invoke("assets:add", items),
  assetsRemove: (name) => electron.ipcRenderer.invoke("assets:remove", name),
  assetsRename: (oldName, newName) => electron.ipcRenderer.invoke("assets:rename", oldName, newName),
  // Buzzer
  onBuzzer: (cb) => electron.ipcRenderer.on("buzzer:pressed", cb),
  offBuzzer: (cb) => electron.ipcRenderer.off("buzzer:pressed", cb)
});
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...inner) => listener(event, ...inner));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
