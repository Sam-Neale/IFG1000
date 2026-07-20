import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import {
  IPC_CHANNELS,
  type AvionicsEvent,
  type ComputerEvent,
  type DesktopApi,
} from "@ifg1000/shared";

const api: DesktopApi = {
  getSnapshot: () => ipcRenderer.invoke(IPC_CHANNELS.getSnapshot),
  getConnectionStatus: () => ipcRenderer.invoke(IPC_CHANNELS.getConnectionStatus),
  getRendererContext: () => ipcRenderer.invoke(IPC_CHANNELS.getRendererContext),
  sendPanelInput: (input) => ipcRenderer.invoke(IPC_CHANNELS.sendPanelInput, input),
  startDiscovery: () => ipcRenderer.invoke(IPC_CHANNELS.startDiscovery),
  stopDiscovery: () => ipcRenderer.invoke(IPC_CHANNELS.stopDiscovery),
  onAvionicsEvent: (listener) => {
    const handler = (_event: IpcRendererEvent, event: AvionicsEvent): void => {
      listener(event);
    };

    ipcRenderer.on(IPC_CHANNELS.avionicsEvent, handler);

    return () => {
      ipcRenderer.off(IPC_CHANNELS.avionicsEvent, handler);
    };
  },
  onComputerEvent: (listener) => {
    const handler = (_event: IpcRendererEvent, event: ComputerEvent): void => {
      listener(event);
    };

    ipcRenderer.on(IPC_CHANNELS.computerEvent, handler);

    return () => {
      ipcRenderer.off(IPC_CHANNELS.computerEvent, handler);
    };
  },
};

contextBridge.exposeInMainWorld("ifg1000", api);
