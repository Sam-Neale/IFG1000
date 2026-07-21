import { useEffect, useRef, useState, type ReactElement } from "react";
import { AudioPanel } from "@ifg1000/g1000-ui";
import g1000FrameSrc from "./assets/g1000-frame.svg";
import { PrimaryFlightDisplay } from "./PrimaryFlightDisplay";
import {
  EMULATOR_DATA_TOPICS,
  createPlaceholderGDC74AData,
  createPlaceholderGIA63WData,
  createPlaceholderGRS77Data,
  type ComputerEvent,
  type DisplayRole,
  type EmulatorBusMessage,
  type GDC74AData,
  type GIA63WData,
  type GRS77Data,
  type PanelInputDirection,
  type PanelInputEvent,
  type PanelKind,
  type RendererContext,
} from "@ifg1000/shared";

const cdiSources = ["GPS", "NAV1", "NAV2"] as const;
const courseToFromValues = ["TO", "FROM"] as const;
const navPhases = [
  "DPRT",
  "TERM",
  "ENR",
  "OCN",
  "LNAV",
  "LNAV + V",
  "L/VNAV",
  "LPV",
  "LP",
  "MAPR",
] as const;
const navSignalTypes = ["VOR", "LOC", "GS", "ILS", "OFF"] as const;
const transponderModes = ["STBY", "ON", "ALT", "GND"] as const;
const desktopApiRetryIntervalMs = 100;
const desktopApiMaxRetryMs = 5000;

type RendererPanelInput =
  | string
  | {
      action?: PanelInputEvent["action"];
      control: string;
      direction?: PanelInputDirection;
    };

export function App(): ReactElement {
  const [context, setContext] = useState<RendererContext>(() =>
    readUrlContext(),
  );
  const [computerEvents, setComputerEvents] = useState<ComputerEvent[]>([]);
  const [gdc74aData, setGdc74aData] = useState<GDC74AData>(() =>
    createPlaceholderGDC74AData(),
  );
  const [grs77Data, setGrs77Data] = useState<GRS77Data>(() =>
    createPlaceholderGRS77Data(),
  );
  const [gia63wData, setGia63wData] = useState<GIA63WData>(() =>
    createPlaceholderGIA63WData(),
  );
  const contextRef = useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe: (() => void) | undefined;

    function connectDesktopApi(startedAt = Date.now()): void {
      const desktopApi = window.ifg1000;

      if (!desktopApi) {
        if (Date.now() - startedAt >= desktopApiMaxRetryMs) {
          console.warn(
            "IFG1000 desktop API unavailable; preload did not expose window.ifg1000.",
          );
          return;
        }

        retryTimer = setTimeout(
          () => connectDesktopApi(startedAt),
          desktopApiRetryIntervalMs,
        );
        return;
      }

      desktopApi.getRendererContext().then((nextContext) => {
        if (mounted) {
          setContext(nextContext);
          document.title = nextContext.title;
        }
      });

      unsubscribe = desktopApi.onComputerEvent((event) => {
        setComputerEvents((events) => [event, ...events].slice(0, 4));

        const sourceData = readPfdSourceData(
          event,
          contextRef.current.displayRole ?? "pfd",
        );

        if (sourceData.gdc74aData) {
          setGdc74aData(sourceData.gdc74aData);
        }

        if (sourceData.grs77Data) {
          setGrs77Data(sourceData.grs77Data);
        }

        if (sourceData.gia63wData) {
          setGia63wData(sourceData.gia63wData);
        }
      });
    }

    connectDesktopApi();

    return () => {
      mounted = false;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      unsubscribe?.();
    };
  }, []);
  return (
    <main className={`app-shell app-shell--${context.panel}`}>
      <section className="display-grid" aria-label={context.title}>
        {context.panel === "gma-1347" ? (
          <AudioPanel
            onControlInput={(control) => sendPanelInput(context, control)}
          />
        ) : (
          <PrimaryFlightDisplay
            displayRole={context.displayRole ?? "pfd"}
            frameSrc={g1000FrameSrc}
            gdc74aData={gdc74aData}
            gia63wData={gia63wData}
            grs77Data={grs77Data}
            onControlInput={(control) => sendPanelInput(context, control)}
          />
        )}
        <DiagnosticsOverlay events={computerEvents} />
      </section>
    </main>
  );
}

function sendPanelInput(
  context: RendererContext,
  input: RendererPanelInput,
): void {
  if (typeof window.ifg1000 === "undefined") {
    return;
  }

  const action =
    typeof input === "string" ? "press" : (input.action ?? "press");
  const control = typeof input === "string" ? input : input.control;
  const direction = typeof input === "string" ? undefined : input.direction;

  window.ifg1000.sendPanelInput({
    action,
    control,
    ...(direction ? { direction } : {}),
    ...(context.displayRole ? { displayRole: context.displayRole } : {}),
    panel: context.panel,
  });
}

interface PfdSourceDataUpdate {
  gdc74aData?: GDC74AData;
  gia63wData?: GIA63WData;
  grs77Data?: GRS77Data;
}

function readPfdSourceData(
  event: ComputerEvent,
  displayRole: DisplayRole,
): PfdSourceDataUpdate {
  if (event.type === "display-bus-message") {
    if (event.displayRole !== displayRole) {
      return {};
    }

    return readPfdBusMessage(event.message, displayRole, {
      includeGdc74a: true,
    });
  }

  if (event.type !== "bus-message") {
    return {};
  }

  return readPfdBusMessage(event.message, displayRole, {
    includeGdc74a: displayRole === "pfd",
  });
}

function readPfdBusMessage(
  message: EmulatorBusMessage,
  displayRole: DisplayRole,
  options: { includeGdc74a: boolean },
): PfdSourceDataUpdate {
  if (
    options.includeGdc74a &&
    message.topic === EMULATOR_DATA_TOPICS.gdc74a &&
    message.source === "gdc-74a"
  ) {
    const gdc74aData = parseGDC74AData(message.payload);

    return gdc74aData ? { gdc74aData } : {};
  }

  if (
    message.topic === EMULATOR_DATA_TOPICS.grs77 &&
    message.source === "grs-77"
  ) {
    const grs77Data = parseGRS77Data(message.payload);

    return grs77Data ? { grs77Data } : {};
  }

  if (
    message.topic === EMULATOR_DATA_TOPICS.gia63w &&
    message.source === getGiaComputerId(displayRole) &&
    message.target === getGduComputerId(displayRole)
  ) {
    const gia63wData = parseGIA63WData(message.payload);

    return gia63wData ? { gia63wData } : {};
  }

  return {};
}

function parseGDC74AData(payload: unknown): GDC74AData | undefined {
  const data = readRecord(payload);
  const environment = data ? readRecord(data.environment) : undefined;
  const airspeed = data ? readRecord(data.airspeed) : undefined;
  const altitude = data ? readRecord(data.altitude) : undefined;
  const oatC = environment ? readNumber(environment.oatC) : undefined;
  const indicatedKts = airspeed ? readNumber(airspeed.indicatedKts) : undefined;
  const trueAirspeedKt = airspeed
    ? readNumber(airspeed.trueAirspeedKt)
    : undefined;
  const altitudeFt = altitude ? readNumber(altitude.altitudeFt) : undefined;
  const barometerInHg = altitude
    ? readNumber(altitude.barometerInHg)
    : undefined;
  const barometerUnit = altitude
    ? readEnumValue(altitude.barometerUnit, ["hPa", "inHg"] as const)
    : undefined;
  const verticalSpeedFpm = altitude
    ? readNumber(altitude.verticalSpeedFpm)
    : undefined;

  if (
    oatC === undefined ||
    indicatedKts === undefined ||
    trueAirspeedKt === undefined ||
    altitudeFt === undefined ||
    barometerInHg === undefined ||
    barometerUnit === undefined ||
    verticalSpeedFpm === undefined
  ) {
    return undefined;
  }

  return {
    environment: {
      oatC,
    },
    airspeed: {
      indicatedKts,
      trueAirspeedKt,
    },
    altitude: {
      altitudeFt,
      barometerInHg,
      barometerUnit,
      verticalSpeedFpm,
    },
  };
}

function parseGRS77Data(payload: unknown): GRS77Data | undefined {
  const data = readRecord(payload);
  const attitude = data ? readRecord(data.attitude) : undefined;
  const heading = data ? readRecord(data.heading) : undefined;
  const pitchDeg = attitude ? readNumber(attitude.pitchDeg) : undefined;
  const rollDeg = attitude ? readNumber(attitude.rollDeg) : undefined;
  const slipSkidDeflection = attitude
    ? readNumber(attitude.slipSkidDeflection)
    : undefined;
  const currentDeg = heading ? readNumber(heading.currentDeg) : undefined;
  const turnRateDegPerSec = heading
    ? readNumber(heading.turnRateDegPerSec)
    : undefined;

  if (
    pitchDeg === undefined ||
    rollDeg === undefined ||
    slipSkidDeflection === undefined ||
    currentDeg === undefined ||
    turnRateDegPerSec === undefined
  ) {
    return undefined;
  }

  return {
    attitude: {
      pitchDeg,
      rollDeg,
      slipSkidDeflection,
    },
    heading: {
      currentDeg,
      turnRateDegPerSec,
    },
  };
}

function parseGIA63WData(payload: unknown): GIA63WData | undefined {
  const data = readRecord(payload);
  const airspeed = data ? readRecord(data.airspeed) : undefined;
  const altitude = data ? readRecord(data.altitude) : undefined;
  const environment = data ? readRecord(data.environment) : undefined;
  const heading = data ? readRecord(data.heading) : undefined;
  const radioMaster = data ? readRecord(data.radioMaster) : undefined;
  const navMaster = data ? readRecord(data.navMaster) : undefined;
  const com1 = data ? readRecord(data.com1) : undefined;
  const com2 = data ? readRecord(data.com2) : undefined;
  const nav1 = data ? readRecord(data.nav1) : undefined;
  const nav2 = data ? readRecord(data.nav2) : undefined;
  const IFConnect = data ? readRecord(data.IFConnect) : undefined;
  const XPDR = data ? readRecord(data.XPDR) : undefined;
  const systemTime = data ? readDate(data.systemTime) : undefined;
  const bugKt = airspeed ? readNumber(airspeed.bugKt) : undefined;
  const trendKt = airspeed ? readNumber(airspeed.trendKt) : undefined;
  const selectedAltitudeFt = altitude
    ? readNumber(altitude.selectedAltitudeFt)
    : undefined;
  const isaC = environment ? readNumber(environment.isaC) : undefined;
  const desiredTrackDeg = heading
    ? readNumber(heading.desiredTrackDeg)
    : undefined;
  const selectedDeg = heading ? readNumber(heading.selectedDeg) : undefined;
  const comSource = radioMaster
    ? readRadioSource(radioMaster.comSource)
    : undefined;
  const navSource = radioMaster
    ? readRadioSource(radioMaster.navSource)
    : undefined;
  const cdiSource = navMaster
    ? readEnumValue(navMaster.cdiSource, cdiSources)
    : undefined;
  const courseToFrom = navMaster
    ? readEnumValue(navMaster.courseToFrom, courseToFromValues)
    : undefined;
  const navPhase = navMaster
    ? readEnumValue(navMaster.navPhase, navPhases)
    : undefined;
  const isActiveNavaidReceived = navMaster
    ? readBoolean(navMaster.isActiveNavaidReceived)
    : undefined;
  const bearingDeg = navMaster ? readNumber(navMaster.bearingDeg) : undefined;
  const courseDeviation = navMaster
    ? readNumber(navMaster.courseDeviation)
    : undefined;
  const ifDataValid = IFConnect
    ? readBoolean(IFConnect.ifDataValid)
    : undefined;
  const transponderCode = XPDR ? readString(XPDR.transponderCode) : undefined;
  const transponderMode = XPDR
    ? readEnumValue(XPDR.transponderMode, transponderModes)
    : undefined;
  const transponderIdentActive = XPDR
    ? readBoolean(XPDR.transponderIdentActive)
    : undefined;
  const com1Data = com1 ? parseFrequencyPair(com1) : undefined;
  const com2Data = com2 ? parseFrequencyPair(com2) : undefined;
  const nav1Data = nav1 ? parseNavRadioData(nav1) : undefined;
  const nav2Data = nav2 ? parseNavRadioData(nav2) : undefined;

  if (
    systemTime === undefined ||
    bugKt === undefined ||
    trendKt === undefined ||
    selectedAltitudeFt === undefined ||
    isaC === undefined ||
    desiredTrackDeg === undefined ||
    selectedDeg === undefined ||
    comSource === undefined ||
    navSource === undefined ||
    cdiSource === undefined ||
    courseToFrom === undefined ||
    navPhase === undefined ||
    isActiveNavaidReceived === undefined ||
    bearingDeg === undefined ||
    courseDeviation === undefined ||
    ifDataValid === undefined ||
    transponderCode === undefined ||
    transponderMode === undefined ||
    transponderIdentActive === undefined ||
    com1Data === undefined ||
    com2Data === undefined ||
    nav1Data === undefined ||
    nav2Data === undefined
  ) {
    return undefined;
  }

  return {
    systemTime,
    airspeed: {
      bugKt,
      trendKt,
    },
    altitude: {
      selectedAltitudeFt,
    },
    environment: {
      isaC,
    },
    heading: {
      desiredTrackDeg,
      selectedDeg,
    },
    radioMaster: {
      comSource,
      navSource,
    },
    navMaster: {
      bearingDeg,
      cdiSource,
      courseDeviation,
      courseToFrom,
      isActiveNavaidReceived,
      navPhase,
    },
    com1: com1Data,
    com2: com2Data,
    nav1: nav1Data,
    nav2: nav2Data,
    IFConnect: {
      ifDataValid,
    },
    XPDR: {
      transponderCode,
      transponderIdentActive,
      transponderMode,
    },
  };
}

function parseFrequencyPair(
  payload: Record<string, unknown>,
): GIA63WData["com1"] | undefined {
  const activeFreqMHz = readNumber(payload.activeFreqMHz);
  const standbyFreqMHz = readNumber(payload.standbyFreqMHz);

  return activeFreqMHz !== undefined && standbyFreqMHz !== undefined
    ? { activeFreqMHz, standbyFreqMHz }
    : undefined;
}

function parseNavRadioData(
  payload: Record<string, unknown>,
): GIA63WData["nav1"] | undefined {
  const frequencyPair = parseFrequencyPair(payload);
  const signalType = readEnumValue(payload.signalType, navSignalTypes);

  return frequencyPair && signalType
    ? { ...frequencyPair, signalType }
    : undefined;
}

function readRecord(payload: unknown): Record<string, unknown> | undefined {
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : undefined;
}

function readNumber(payload: unknown): number | undefined {
  return typeof payload === "number" && Number.isFinite(payload)
    ? payload
    : undefined;
}

function readBoolean(payload: unknown): boolean | undefined {
  return typeof payload === "boolean" ? payload : undefined;
}

function readString(payload: unknown): string | undefined {
  return typeof payload === "string" ? payload : undefined;
}

function readRadioSource(payload: unknown): 1 | 2 | undefined {
  return payload === 1 || payload === 2 ? payload : undefined;
}

function readEnumValue<T extends string>(
  payload: unknown,
  values: readonly T[],
): T | undefined {
  return typeof payload === "string" &&
    (values as readonly string[]).includes(payload)
    ? (payload as T)
    : undefined;
}

function readDate(payload: unknown): Date | undefined {
  const date =
    payload instanceof Date
      ? payload
      : typeof payload === "string" || typeof payload === "number"
        ? new Date(payload)
        : undefined;

  return date && Number.isFinite(date.getTime()) ? date : undefined;
}

function getGiaComputerId(displayRole: DisplayRole): "gia-63w-1" | "gia-63w-2" {
  return displayRole === "pfd" ? "gia-63w-1" : "gia-63w-2";
}

function getGduComputerId(
  displayRole: DisplayRole,
): "gdu-1044b-pfd" | "gdu-1044b-mfd" {
  return displayRole === "pfd" ? "gdu-1044b-pfd" : "gdu-1044b-mfd";
}

interface DiagnosticsOverlayProps {
  events: ComputerEvent[];
}

function DiagnosticsOverlay({ events }: DiagnosticsOverlayProps): ReactElement {
  return (
    <aside className="diagnostics-overlay" aria-label="Emulator diagnostics">
      <strong>Bus</strong>
      {events.length === 0 ? (
        <span>Waiting for computer events</span>
      ) : (
        <ol>
          {events.map((event, index) => (
            <li key={`${event.type}-${index}`}>{event.type}</li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function readUrlContext(): RendererContext {
  const params = new URLSearchParams(window.location.search);
  const panel = readPanelKind(params.get("panel"));
  const displayRole = readDisplayRole(params.get("role"));
  const windowId = Number.parseInt(params.get("windowId") ?? "0", 10);

  return {
    ...(displayRole ? { displayRole } : {}),
    panel,
    title:
      panel === "gma-1347"
        ? "IFG1000 GMA 1347 Audio Panel"
        : `IFG1000 ${displayRole?.toUpperCase() ?? "PFD"} - GDU 1044B`,
    windowId: Number.isFinite(windowId) ? windowId : 0,
  };
}

function readPanelKind(value: string | null): PanelKind {
  return value === "gma-1347" ? "gma-1347" : "gdu-1044b";
}

function readDisplayRole(value: string | null): DisplayRole | undefined {
  return value === "mfd" || value === "pfd" ? value : undefined;
}
