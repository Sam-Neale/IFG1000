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

export const EMULATOR_DATA_TOPICS = {
  gdc74a: "gdc-74a/data",
  gia63w: "gia-63w/data",
  grs77: "grs-77/data",
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

export type PanelInputDirection = "clockwise" | "counterclockwise";

export interface PanelInputEvent {
  action: "press" | "release" | "turn";
  control: string;
  direction?: PanelInputDirection;
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
      computerId: EmulatorComputerId;
      displayRole: DisplayRole;
      message: EmulatorBusMessage;
      timestamp: number;
      type: "display-bus-message";
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

export type BarometerUnit = "hPa" | "inHg";
export type CdiSource = "GPS" | "NAV1" | "NAV2";
export type CourseToFrom = "TO" | "FROM";
export type NavPhase =
  | "DPRT"
  | "TERM"
  | "ENR"
  | "OCN"
  | "LNAV"
  | "LNAV + V"
  | "L/VNAV"
  | "LPV"
  | "LP"
  | "MAPR";
export type NavSignalType = "VOR" | "LOC" | "GS" | "ILS" | "OFF";
export type TransponderMode = "STBY" | "ON" | "ALT" | "GND";

export interface GDC74AData {
  environment: {
    oatC: number;
  };
  airspeed: {
    indicatedKts: number;
    trueAirspeedKt: number;
  };
  altitude: {
    altitudeFt: number;
    barometerInHg: number;
    barometerUnit: BarometerUnit;
    verticalSpeedFpm: number;
  };
}

export interface GRS77Data {
  attitude: {
    pitchDeg: number;
    rollDeg: number;
    slipSkidDeflection: number;
  };
  heading: {
    currentDeg: number;
    turnRateDegPerSec: number;
  };
}

export interface GIA63WData {
  systemTime: Date;
  airspeed: {
    bugKt: number;
    trendKt: number;
  };
  altitude: {
    selectedAltitudeFt: number;
  };
  environment: {
    isaC: number;
  };
  heading: {
    desiredTrackDeg: number;
    selectedDeg: number;
  };
  radioMaster: {
    comSource: 1 | 2;
    navSource: 1 | 2;
  };
  navMaster: {
    cdiSource: CdiSource;
    courseToFrom: CourseToFrom;
    navPhase: NavPhase;
    isActiveNavaidReceived: boolean;
    bearingDeg: number;
    courseDeviation: number;
  };
  com1: {
    activeFreqMHz: number;
    standbyFreqMHz: number;
  };
  com2: {
    activeFreqMHz: number;
    standbyFreqMHz: number;
  };
  nav1: {
    activeFreqMHz: number;
    standbyFreqMHz: number;
    signalType: NavSignalType;
  };
  nav2: {
    activeFreqMHz: number;
    standbyFreqMHz: number;
    signalType: NavSignalType;
  };
  IFConnect: {
    ifDataValid: boolean;
  };
  XPDR: {
    transponderCode: string;
    transponderMode: TransponderMode;
    transponderIdentActive: boolean;
  };
}

export function createPlaceholderGDC74AData(): GDC74AData {
  return {
    environment: {
      oatC: 7,
    },
    airspeed: {
      indicatedKts: 115,
      trueAirspeedKt: 315,
    },
    altitude: {
      altitudeFt: 5000,
      barometerInHg: 29.92,
      barometerUnit: "inHg",
      verticalSpeedFpm: 0,
    },
  };
}

export function createPlaceholderGRS77Data(): GRS77Data {
  return {
    attitude: {
      pitchDeg: 0,
      rollDeg: 0,
      slipSkidDeflection: 0,
    },
    heading: {
      currentDeg: 326,
      turnRateDegPerSec: 2,
    },
  };
}

export function createPlaceholderGIA63WData(
  systemTime = new Date(),
): GIA63WData {
  return {
    systemTime,
    airspeed: {
      bugKt: 210,
      trendKt: 4,
    },
    altitude: {
      selectedAltitudeFt: 5200,
    },
    environment: {
      isaC: -6,
    },
    heading: {
      desiredTrackDeg: 105,
      selectedDeg: 15,
    },
    radioMaster: {
      comSource: 1,
      navSource: 1,
    },
    navMaster: {
      bearingDeg: 105,
      cdiSource: "GPS",
      courseDeviation: 0,
      courseToFrom: "TO",
      isActiveNavaidReceived: true,
      navPhase: "ENR",
    },
    com1: {
      activeFreqMHz: 118.1,
      standbyFreqMHz: 136.275,
    },
    com2: {
      activeFreqMHz: 118.3,
      standbyFreqMHz: 118.4,
    },
    nav1: {
      activeFreqMHz: 108,
      signalType: "VOR",
      standbyFreqMHz: 117.95,
    },
    nav2: {
      activeFreqMHz: 108,
      signalType: "VOR",
      standbyFreqMHz: 117.95,
    },
    IFConnect: {
      ifDataValid: true,
    },
    XPDR: {
      transponderCode: "1200",
      transponderIdentActive: false,
      transponderMode: "ALT",
    },
  };
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
  sendPanelInput: (
    input: Omit<PanelInputEvent, "timestamp" | "windowId">,
  ) => Promise<void>;
  startDiscovery: () => Promise<SimulatorConnectionStatus>;
  stopDiscovery: () => Promise<SimulatorConnectionStatus>;
}
