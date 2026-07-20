export const IPC_CHANNELS = {
  getSnapshot: "ifg1000:get-snapshot",
  getConnectionStatus: "ifg1000:get-connection-status",
  getRendererContext: "ifg1000:get-renderer-context",
  sendPanelInput: "ifg1000:send-panel-input",
  startDiscovery: "ifg1000:start-discovery",
  stopDiscovery: "ifg1000:stop-discovery",
  avionicsEvent: "ifg1000:avionics-event",
  computerEvent: "ifg1000:computer-event",
} as const;

export type DisplayRole = "pfd" | "mfd";
export type PanelKind = "gdu-1044b" | "gma-1347";

export type EmulatorComputerId =
  | "gdu-1044b-pfd"
  | "gdu-1044b-mfd"
  | "gia-63w-1"
  | "gia-63w-2"
  | "gdc-74a"
  | "grs-77"
  | "gmu-44"
  | "gtx-33"
  | "gea-71";

export interface RendererContext {
  displayRole?: DisplayRole;
  panel: PanelKind;
  title: string;
  windowId: number;
}

export interface PanelInputEvent {
  action: "press" | "release" | "turn";
  control: string;
  displayRole?: DisplayRole;
  panel: PanelKind;
  timestamp: number;
  windowId: number;
}

export interface ComputerProcessInfo {
  id: EmulatorComputerId;
  label: string;
  processTitle: string;
}

export type ComputerHostMessage =
  | {
      computer: ComputerProcessInfo;
      timestamp: number;
      type: "computer-ready";
    }
  | {
      computerId: EmulatorComputerId;
      displayRole: DisplayRole;
      renderMode: DisplayRole;
      timestamp: number;
      type: "display-renderer-ready";
      windowId: number;
    }
  | {
      computerId: EmulatorComputerId;
      panel: PanelKind;
      timestamp: number;
      type: "panel-renderer-ready";
      windowId: number;
    }
  | {
      message: EmulatorBusMessage;
      timestamp: number;
      type: "bus-message";
    };

export type SupervisorMessage =
  | {
      displayRole: DisplayRole;
      type: "attach-display-window";
      windowId: number;
    }
  | {
      panel: PanelKind;
      type: "attach-panel-window";
      windowId: number;
    }
  | {
      input: PanelInputEvent;
      type: "panel-input";
    }
  | {
      message: EmulatorBusMessage;
      type: "bus-message";
    };

export interface EmulatorBusMessage {
  payload?: unknown;
  source: EmulatorComputerId;
  target: EmulatorComputerId | "broadcast";
  topic: string;
}

export type ComputerEvent =
  | ComputerHostMessage
  | {
      input: PanelInputEvent;
      type: "panel-input";
    };

export type SimulatorConnectionPhase =
  | "idle"
  | "discovering"
  | "available"
  | "connecting"
  | "connected"
  | "error";

export interface SimulatorConnectionStatus {
  phase: SimulatorConnectionPhase;
  updatedAt: number;
  address?: string;
  aircraft?: string;
  deviceName?: string;
  message?: string;
  port?: number;
  version?: string;
}

export interface AircraftKinematics {
  altitudeFt: number;
  bankDeg: number;
  groundSpeedKt: number;
  headingDeg: number;
  indicatedAirspeedKt: number;
  latitudeDeg: number;
  longitudeDeg: number;
  pitchDeg: number;
  trackDeg: number;
  trueAirspeedKt: number;
  verticalSpeedFpm: number;
}

export interface AutopilotState {
  altitudeArmed: boolean;
  altitudeSelectedFt: number;
  approachMode: boolean;
  headingArmed: boolean;
  headingSelectedDeg: number;
  master: boolean;
  verticalSpeedSelectedFpm: number;
}

export interface AvionicsSnapshot {
  aircraft: AircraftKinematics;
  alerts: string[];
  autopilot: AutopilotState;
  timestamp: number;
}

export type AvionicsEvent =
  | {
      snapshot: AvionicsSnapshot;
      type: "snapshot";
    }
  | {
      status: SimulatorConnectionStatus;
      type: "connection-status";
    };

export interface DesktopApi {
  getRendererContext: () => Promise<RendererContext>;
  getConnectionStatus: () => Promise<SimulatorConnectionStatus>;
  getSnapshot: () => Promise<AvionicsSnapshot>;
  onAvionicsEvent: (listener: (event: AvionicsEvent) => void) => () => void;
  onComputerEvent: (listener: (event: ComputerEvent) => void) => () => void;
  sendPanelInput: (input: Omit<PanelInputEvent, "timestamp" | "windowId">) => Promise<void>;
  startDiscovery: () => Promise<SimulatorConnectionStatus>;
  stopDiscovery: () => Promise<SimulatorConnectionStatus>;
}
