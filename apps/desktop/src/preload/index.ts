import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import type {
  AvionicsEvent,
  ComputerEvent,
  DesktopApi,
} from "@ifg1000/shared";

const IPC_CHANNELS = {
  getSnapshot: "ifg1000:get-snapshot",
  getConnectionStatus: "ifg1000:get-connection-status",
  getRendererContext: "ifg1000:get-renderer-context",
  sendPanelInput: "ifg1000:send-panel-input",
  startDiscovery: "ifg1000:start-discovery",
  stopDiscovery: "ifg1000:stop-discovery",
  avionicsEvent: "ifg1000:avionics-event",
  computerEvent: "ifg1000:computer-event",
} as const satisfies typeof import("@ifg1000/shared").IPC_CHANNELS;

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
