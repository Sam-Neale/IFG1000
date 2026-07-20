import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { createInitialAvionicsSnapshot } from "@ifg1000/avionics-core";
import { createIfConnectClient } from "@ifg1000/if-connect";
import {
  IPC_CHANNELS,
  type AvionicsEvent,
  type AvionicsSnapshot,
  type ComputerEvent,
  type DisplayRole,
  type PanelInputEvent,
  type PanelKind,
  type RendererContext,
  type SimulatorConnectionStatus,
} from "@ifg1000/shared";
import { ComputerSupervisor } from "./emulator/computer-supervisor";

let latestSnapshot: AvionicsSnapshot = createInitialAvionicsSnapshot();

const connectClient = createIfConnectClient();
const supervisor = new ComputerSupervisor();
const rendererContexts = new Map<number, RendererContext>();

function publish(event: AvionicsEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.avionicsEvent, event);
  }
}

function publishComputerEvent(event: ComputerEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.computerEvent, event);
  }
}

function createGduWindow(displayRole: DisplayRole): BrowserWindow {
  const title = `IFG1000 ${displayRole.toUpperCase()} - GDU 1044B`;
  const window = new BrowserWindow({
    width: 1050,
    height: 686,
    minWidth: 968,
    minHeight: 632,
    title,
    backgroundColor: "#4e4e4e",
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "../preload/index.mjs"),
    },
  });
  window.setAspectRatio(1452 / 948);

  const context: RendererContext = {
    displayRole,
    panel: "gdu-1044b",
    title,
    windowId: window.id,
  };

  registerWindowContext(window, context);
  supervisor.attachDisplayWindow(window, displayRole);

  return window;
}

function createGmaWindow(): BrowserWindow {
  const title = "IFG1000 GMA 1347 Audio Panel";
  const window = new BrowserWindow({
    width: 260,
    height: 760,
    minWidth: 220,
    minHeight: 640,
    title,
    backgroundColor: "#101315",
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "../preload/index.mjs"),
    },
  });

  const context: RendererContext = {
    panel: "gma-1347",
    title,
    windowId: window.id,
  };

  registerWindowContext(window, context);

  return window;
}

function registerWindowContext(window: BrowserWindow, context: RendererContext): void {
  rendererContexts.set(window.id, context);

  window.on("closed", () => {
    rendererContexts.delete(window.id);
  });

  const query = {
    panel: context.panel,
    role: context.displayRole ?? "",
    windowId: String(window.id),
  };

  if (process.env.ELECTRON_RENDERER_URL) {
    const url = new URL(process.env.ELECTRON_RENDERER_URL);
    url.searchParams.set("panel", query.panel);
    url.searchParams.set("role", query.role);
    url.searchParams.set("windowId", query.windowId);
    window.loadURL(url.toString());
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"), {
      query,
    });
  }
}

function createEmulatorWindows(): void {
  createGduWindow("pfd");
  createGduWindow("mfd");
  createGmaWindow();
}

function registerIpc(): void {
  ipcMain.handle(IPC_CHANNELS.getSnapshot, () => latestSnapshot);
  ipcMain.handle(IPC_CHANNELS.getConnectionStatus, () => connectClient.getStatus());
  ipcMain.handle(IPC_CHANNELS.getRendererContext, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      throw new Error("Renderer context requested outside a BrowserWindow.");
    }

    const context = rendererContexts.get(window.id);

    if (!context) {
      throw new Error(`No renderer context registered for window ${window.id}.`);
    }

    return context;
  });

  ipcMain.handle(
    IPC_CHANNELS.sendPanelInput,
    (event, input: Omit<PanelInputEvent, "timestamp" | "windowId">) => {
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) {
        return;
      }

      supervisor.dispatchPanelInput({
        ...input,
        timestamp: Date.now(),
        windowId: window.id,
      });
    },
  );

  ipcMain.handle(IPC_CHANNELS.startDiscovery, async () => {
    const status = await connectClient.startDiscovery();
    publish({ type: "connection-status", status });
    return status;
  });

  ipcMain.handle(IPC_CHANNELS.stopDiscovery, () => {
    const status = connectClient.stopDiscovery();
    publish({ type: "connection-status", status });
    return status;
  });
}

connectClient.on("status", (status: SimulatorConnectionStatus) => {
  publish({ type: "connection-status", status });
});

connectClient.on("snapshot", (snapshot: AvionicsSnapshot) => {
  latestSnapshot = snapshot;
  publish({ type: "snapshot", snapshot });
});

app.whenReady().then(() => {
  registerIpc();
  supervisor.start(join(app.getPath("userData"), "computer-logs"));
  createEmulatorWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createEmulatorWindows();
    }
  });
});

supervisor.on("event", (event) => {
  publishComputerEvent(event);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  supervisor.stop();
});
