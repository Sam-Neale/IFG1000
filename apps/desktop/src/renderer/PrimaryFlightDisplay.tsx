import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import attitudeIndicatorSrc from "./assets/AI.svg";
import balanceBarSrc from "./assets/Balance Bar.svg";
import rollPointerSrc from "./assets/Roll Pointer.svg";
import rollScaleSrc from "./assets/Roll Scale.svg";

interface PrimaryFlightDisplayProps {
  displayRole: "pfd" | "mfd";
  frameSrc: string;
  onControlInput?: (control: string) => void;
}

const frameWidth = 1452;
const frameHeight = 948;
const displayCanvas = {
  height: 768,
  width: 1024,
} as const;
const displayViewport = {
  height: 793,
  width: 1056,
  x: 197,
  y: 48,
} as const;
const attitudeIndicator = {
  height: 38,
  width: 414,
  x: displayCanvas.width / 2,
  top: 288,
} as const;
const rollScale = {
  height: 120,
  width: 385,
  x: displayCanvas.width / 2,
  top: 75,
} as const;
const rollPointer = {
  height: 22,
  width: 22,
  x: displayCanvas.width / 2,
  top: 97,
} as const;
const balanceBar = {
  deflectionPixels: 26,
  height: 5,
  width: 30,
  x: displayCanvas.width / 2,
  top: 123,
} as const;
const rollScaleImage = createCanvasImage(rollScaleSrc);
const balanceBarImage = createCanvasImage(balanceBarSrc);

interface PfdDisplayData {
  airspeed: {
    bugKt: number;
    indicatedKt: number;
    trueAirspeedKt: number;
    trendKt: number;
  };
  altitude: {
    altitudeFt: number;
    barometerInHg: number;
    selectedAltitudeFt: number;
    verticalSpeedFpm: number;
  };
  attitude: {
    pitchDeg: number;
    rollDeg: number;
    slipSkidDeflection: number;
  };
  environment: {
    isaC: number;
    oatC: number;
    systemTime: Date;
    transponderCode: string;
    transponderMode: string;
  };
  heading: {
    currentDeg: number;
    desiredTrackDeg: number;
    selectedDeg: number;
  };
  radios: {
    bearingDeg: number;
    com1Active: string;
    com1Standby: string;
    com2Active: string;
    com2Standby: string;
    comSource: 1 | 2;
    distanceNm: number;
    nav1Active: string;
    nav1Standby: string;
    nav2Active: string;
    nav2Standby: string;
    navSource: 1 | 2;
    waypoint: string;
  };
}

const dummyPfdData: PfdDisplayData = {
  airspeed: {
    bugKt: 210,
    indicatedKt: 135,
    trueAirspeedKt: 315,
    trendKt: 4,
  },
  altitude: {
    altitudeFt: 2000,
    barometerInHg: 29.92,
    selectedAltitudeFt: 2500,
    verticalSpeedFpm: 0,
  },
  attitude: {
    pitchDeg: 0,
    rollDeg: 0,
    slipSkidDeflection: 0,
  },
  environment: {
    isaC: -6,
    oatC: 7,
    get systemTime() {
      return new Date();
    },
    transponderCode: "1200",
    transponderMode: "ALT",
  },
  heading: {
    currentDeg: 108,
    desiredTrackDeg: 105,
    selectedDeg: 10,
  },
  radios: {
    bearingDeg: 105,
    com1Active: "118.100",
    com1Standby: "136.275",
    com2Active: "118.300",
    com2Standby: "118.400",
    comSource: 1,
    distanceNm: 51.5,
    nav1Active: "108.00",
    nav1Standby: "117.95",
    nav2Active: "108.00",
    nav2Standby: "117.95",
    navSource: 1,
    waypoint: "KORD",
  },
};

interface HitZone {
  label: string;
  radius?: "round" | "button";
  x: number;
  y: number;
  width: number;
  height: number;
}

const hitZones: HitZone[] = [
  {
    label: "NAV volume push ident knob",
    radius: "round",
    x: 65,
    y: 43,
    width: 56,
    height: 56,
  },
  {
    label: "NAV frequency swap",
    radius: "button",
    x: 107,
    y: 107,
    width: 50,
    height: 36,
  },
  {
    label: "NAV frequency tuning knob",
    radius: "round",
    x: 52,
    y: 174,
    width: 82,
    height: 82,
  },
  {
    label: "Heading sync knob",
    radius: "round",
    x: 52,
    y: 346,
    width: 82,
    height: 82,
  },
  {
    label: "Autopilot AP",
    radius: "button",
    x: 34,
    y: 473,
    width: 50,
    height: 36,
  },
  {
    label: "Flight director FD",
    radius: "button",
    x: 104,
    y: 473,
    width: 50,
    height: 36,
  },
  {
    label: "Heading mode HDG",
    radius: "button",
    x: 32,
    y: 527,
    width: 50,
    height: 36,
  },
  {
    label: "Altitude mode ALT",
    radius: "button",
    x: 104,
    y: 527,
    width: 50,
    height: 36,
  },
  {
    label: "Navigation mode NAV",
    radius: "button",
    x: 32,
    y: 581,
    width: 50,
    height: 36,
  },
  {
    label: "Vertical navigation VNV",
    radius: "button",
    x: 104,
    y: 581,
    width: 50,
    height: 36,
  },
  {
    label: "Approach mode APR",
    radius: "button",
    x: 32,
    y: 637,
    width: 50,
    height: 36,
  },
  {
    label: "Back course BC",
    radius: "button",
    x: 104,
    y: 637,
    width: 50,
    height: 36,
  },
  {
    label: "Vertical speed VS",
    radius: "button",
    x: 32,
    y: 695,
    width: 50,
    height: 36,
  },
  { label: "Nose up", radius: "button", x: 104, y: 695, width: 50, height: 36 },
  {
    label: "Flight level change FLC",
    radius: "button",
    x: 32,
    y: 749,
    width: 50,
    height: 36,
  },
  {
    label: "Nose down",
    radius: "button",
    x: 104,
    y: 749,
    width: 50,
    height: 36,
  },
  {
    label: "Altitude select knob",
    radius: "round",
    x: 55,
    y: 829,
    width: 80,
    height: 80,
  },

  {
    label: "COM volume push squelch knob",
    radius: "round",
    x: 1332,
    y: 42,
    width: 56,
    height: 56,
  },
  {
    label: "COM frequency swap",
    radius: "button",
    x: 1293,
    y: 107,
    width: 50,
    height: 36,
  },
  {
    label: "COM frequency tuning knob",
    radius: "round",
    x: 1315,
    y: 175,
    width: 82,
    height: 82,
  },
  {
    label: "CRS/BARO knob",
    radius: "round",
    x: 1328,
    y: 353,
    width: 62,
    height: 62,
  },
  { label: "Range up", x: 1351, y: 494, width: 16, height: 18 },
  { label: "Range down", x: 1351, y: 579, width: 16, height: 18 },
  { label: "Range left", x: 1305, y: 536, width: 20, height: 20 },
  { label: "Range right", x: 1392, y: 536, width: 20, height: 20 },
  {
    label: "Range push pan knob",
    radius: "round",
    x: 1334,
    y: 520,
    width: 50,
    height: 50,
  },
  {
    label: "Direct to",
    radius: "button",
    x: 1298,
    y: 641,
    width: 50,
    height: 36,
  },
  { label: "Menu", radius: "button", x: 1367, y: 641, width: 50, height: 36 },
  {
    label: "Flight plan",
    radius: "button",
    x: 1298,
    y: 695,
    width: 50,
    height: 36,
  },
  {
    label: "Procedures",
    radius: "button",
    x: 1367,
    y: 695,
    width: 50,
    height: 36,
  },
  { label: "Clear", radius: "button", x: 1298, y: 752, width: 50, height: 36 },
  { label: "Enter", radius: "button", x: 1367, y: 752, width: 50, height: 36 },
  {
    label: "FMS cursor knob",
    radius: "round",
    x: 1319,
    y: 828,
    width: 82,
    height: 82,
  },

  {
    label: "Softkey 1",
    radius: "button",
    x: 214,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 2",
    radius: "button",
    x: 304,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 3",
    radius: "button",
    x: 391,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 4",
    radius: "button",
    x: 478,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 5",
    radius: "button",
    x: 568,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 6",
    radius: "button",
    x: 655,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 7",
    radius: "button",
    x: 744,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 8",
    radius: "button",
    x: 833,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 9",
    radius: "button",
    x: 921,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 10",
    radius: "button",
    x: 1009,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 11",
    radius: "button",
    x: 1098,
    y: 868,
    width: 53,
    height: 36,
  },
  {
    label: "Softkey 12",
    radius: "button",
    x: 1187,
    y: 867,
    width: 53,
    height: 36,
  },
];

type SoftKeyPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type SoftKey = {
  position: SoftKeyPosition;
  label: string;
} & ({ children: SoftKey[] } | { pressed: (actions: SoftKeyActions) => void });

interface SoftKeyActions {
  activate: (position: SoftKeyPosition) => void;
  back: () => void;
  home: () => void;
}

interface CanvasTextItem {
  color?: string;
  text: string;
  size?: number;
}

const softKeyPositions: SoftKeyPosition[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

const insetSoftKeys: SoftKey[] = [
  {
    position: 1,
    label: "OFF",
    pressed: ({ back }) => {
      console.log("OFF pressed");
      back();
    },
  },
  { position: 2, label: "DCLTR", pressed: () => console.log("DCLTR cycled") },
  {
    position: 3,
    label: "WX LGND",
    pressed: () => console.log("WX LGND pressed"),
  },
  {
    position: 4,
    label: "TRAFFIC",
    pressed: () => console.log("TRAFFIC cycled"),
  },
  {
    position: 5,
    label: "TOPO",
    pressed: () => console.log("TOPO pressed"),
  },
  {
    position: 6,
    label: "TERRAIN",
    pressed: () => console.log("TERRAIN pressed"),
  },
  {
    position: 7,
    label: "STRMSCP",
    pressed: () => console.log("STRMSCP pressed"),
  },
  {
    position: 8,
    label: "NEXRAD",
    pressed: () => console.log("NEXRAD pressed"),
  },
  {
    position: 9,
    label: "XM LTNG",
    pressed: () => console.log("XM LTNG pressed"),
  },
  {
    position: 10,
    label: "METAR",
    pressed: () => console.log("METAR pressed"),
  },
  {
    position: 11,
    label: "BACK",
    pressed: ({ back }) => back(),
  },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const syntheticVisionSoftKeys: SoftKey[] = [
  {
    position: 1,
    label: "PATHWAY",
    pressed: ({ back }) => {
      console.log("PATHWAY pressed");
    },
  },
  {
    position: 2,
    label: "SYN TERR",
    pressed: ({ back }) => {
      console.log("SYN TERR pressed");
    },
  },
  {
    position: 3,
    label: "HRZN HDG",
    pressed: ({ back }) => {
      console.log("HRZN HDG pressed");
    },
  },
  {
    position: 4,
    label: "APTSIGNS",
    pressed: ({ back }) => {
      console.log("APTSIGNS pressed");
    },
  },
  {
    position: 11,
    label: "BACK",
    pressed: ({ back }) => back(),
  },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const windDisplaySoftKeys: SoftKey[] = [
  {
    position: 3,
    label: "OPTN1",
    pressed: ({ back }) => {
      console.log("OPTN1 pressed");
    },
  },
  {
    position: 4,
    label: "OPTN2",
    pressed: ({ back }) => {
      console.log("OPTN2 pressed");
    },
  },
  {
    position: 5,
    label: "OPTN3",
    pressed: ({ back }) => {
      console.log("OPTN3 pressed");
    },
  },
  {
    position: 6,
    label: "OFF",
    pressed: ({ back }) => {
      console.log("OFF pressed");
    },
  },
  {
    position: 11,
    label: "BACK",
    pressed: ({ back }) => back(),
  },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const HSIFormatSoftKeys: SoftKey[] = [
  {
    position: 6,
    label: "360 HSI",
    pressed: () => console.log("360 HSI pressed"),
  },
  {
    position: 7,
    label: "ARC HSI",
    pressed: () => console.log("ARC HSI pressed"),
  },
  { position: 11, label: "BACK", pressed: ({ back }) => back() },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const altitudeUnitsSoftKeys: SoftKey[] = [
  {
    position: 6,
    label: "METERS",
    pressed: () => console.log("METERS pressed"),
  },
  { position: 8, label: "IN", pressed: () => console.log("IN pressed") },
  { position: 9, label: "HPA", pressed: () => console.log("HPA pressed") },
  { position: 11, label: "BACK", pressed: ({ back }) => back() },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const PFDConfigSoftKeys: SoftKey[] = [
  {
    position: 1,
    label: "SYN VIS",
    children: syntheticVisionSoftKeys,
  },
  {
    position: 2,
    label: "DFLTS",
    pressed: () => console.log("DFLTS pressed"),
  },
  {
    position: 3,
    label: "WIND",
    children: windDisplaySoftKeys,
  },
  {
    position: 4,
    label: "DME",
    pressed: () => console.log("DME pressed"),
  },
  { position: 5, label: "BRG1", pressed: () => console.log("BRG1 cycled") },
  { position: 6, label: "HSI FRMT", children: HSIFormatSoftKeys },
  { position: 7, label: "BRG2", pressed: () => console.log("BRG2 cycled") },
  { position: 9, label: "ALT UNIT", children: altitudeUnitsSoftKeys },
  {
    position: 10,
    label: "STD BARO",
    pressed: () => console.log("STD BARO pressed"),
  },
  { position: 11, label: "BACK", pressed: ({ back }) => back() },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const XPDRCodeSoftKeys: SoftKey[] = [
  { position: 1, label: "0", pressed: () => console.log("0 pressed") },
  { position: 2, label: "1", pressed: () => console.log("1 pressed") },
  { position: 3, label: "2", pressed: () => console.log("2 pressed") },
  { position: 4, label: "3", pressed: () => console.log("3 pressed") },
  { position: 5, label: "4", pressed: () => console.log("4 pressed") },
  { position: 6, label: "5", pressed: () => console.log("5 pressed") },
  { position: 7, label: "6", pressed: () => console.log("6 pressed") },
  { position: 8, label: "7", pressed: () => console.log("7 pressed") },
  { position: 9, label: "IDENT", pressed: () => console.log("IDENT pressed") },
  { position: 10, label: "BKSP", pressed: () => console.log("BKSP pressed") },
  { position: 11, label: "BACK", pressed: ({ back }) => back() },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const XPDRSoftKeys: SoftKey[] = [
  {
    position: 3,
    label: "STBY",
    pressed: () => console.log("STBY pressed"),
  },
  { position: 4, label: "ON", pressed: () => console.log("ON pressed") },
  { position: 5, label: "ALT", pressed: () => console.log("ALT pressed") },
  { position: 6, label: "GND", pressed: () => console.log("TST pressed") },
  { position: 7, label: "VFR", pressed: () => console.log("VFR pressed") },
  { position: 8, label: "CODE", children: XPDRCodeSoftKeys },
  { position: 9, label: "IDENT", pressed: () => console.log("IDENT pressed") },
  { position: 11, label: "BACK", pressed: ({ back }) => back() },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

const topLevelSoftKeys: SoftKey[] = [
  { position: 2, label: "INSET", children: insetSoftKeys },
  { position: 4, label: "PFD", children: PFDConfigSoftKeys },
  { position: 5, label: "OBS", pressed: () => console.log("OBS pressed") },
  { position: 6, label: "CDI", pressed: () => console.log("CDI pressed") },
  { position: 7, label: "DME", pressed: () => console.log("DME pressed") },
  { position: 8, label: "XPDR", children: XPDRSoftKeys },
  { position: 9, label: "IDENT", pressed: () => console.log("IDENT pressed") },
  {
    position: 10,
    label: "TMR/REF",
    pressed: () => console.log("TMR/REF pressed"),
  },
  { position: 11, label: "NRST", pressed: () => console.log("MSG pressed") },
  {
    position: 12,
    label: "ALERTS",
    pressed: () => console.log("ALERTS pressed"),
  },
];

export function PrimaryFlightDisplay({
  displayRole,
  frameSrc,
  onControlInput,
}: PrimaryFlightDisplayProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeSoftKeyPath, setActiveSoftKeyPath] = useState<SoftKeyPosition[]>(
    [],
  );

  const softKeyActions = useMemo<SoftKeyActions>(
    () => ({
      activate: (position) => {
        setActiveSoftKeyPath((path) => {
          const softKey = getVisibleSoftKeys(topLevelSoftKeys, path).find(
            (key) => key.position === position,
          );

          return softKey && hasChildren(softKey) ? [...path, position] : path;
        });
      },
      back: () => {
        setActiveSoftKeyPath((path) => path.slice(0, -1));
      },
      home: () => {
        setActiveSoftKeyPath([]);
      },
    }),
    [],
  );

  const visibleSoftKeys = useMemo(
    () => getVisibleSoftKeys(topLevelSoftKeys, activeSoftKeyPath),
    [activeSoftKeyPath],
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeCanvas = canvas;
    let animationFrameId = 0;

    function redraw(): void {
      drawPfdCanvas(activeCanvas, dummyPfdData, visibleSoftKeys);
      animationFrameId = requestAnimationFrame(redraw);
    }

    animationFrameId = requestAnimationFrame(redraw);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visibleSoftKeys]);

  function handleSoftKeyPress(key: SoftKey): void {
    if (hasChildren(key)) {
      softKeyActions.activate(key.position);
      return;
    }

    key.pressed(softKeyActions);
  }

  function handleHitZonePress(zone: HitZone): void {
    const softKeyPosition = readSoftKeyPosition(zone.label);

    if (softKeyPosition) {
      const softKey = visibleSoftKeys.find(
        (key) => key.position === softKeyPosition,
      );

      if (softKey) {
        handleSoftKeyPress(softKey);
      }
    }

    onControlInput?.(zone.label);
  }

  return (
    <article
      className={`g1000-svg-panel g1000-svg-panel--${displayRole}`}
      aria-label={`GDU 1044B ${displayRole.toUpperCase()} panel`}
    >
      <img
        className="g1000-svg-panel__frame"
        src={frameSrc}
        alt=""
        draggable={false}
      />
      <span className="g1000-display-role-badge">
        {displayRole.toUpperCase()}
      </span>
      <canvas
        ref={canvasRef}
        aria-label="Primary flight display canvas"
        id={`g1000-svg-panel__canvas-${displayRole}`}
        height={displayCanvas.height}
        width={displayCanvas.width}
        style={displayViewportStyle}
      />
      <img
        aria-hidden="true"
        className="g1000-svg-panel__attitude-indicator"
        src={attitudeIndicatorSrc}
        alt=""
        draggable={false}
        style={attitudeIndicatorStyle}
      />
      <img
        aria-hidden="true"
        className="g1000-svg-panel__roll-pointer"
        src={rollPointerSrc}
        alt=""
        draggable={false}
        style={rollPointerStyle}
      />
      <div className="g1000-svg-panel__hit-layer" aria-label="G1000 controls">
        {hitZones.map((zone) => (
          <button
            key={zone.label}
            type="button"
            aria-label={zone.label}
            className={`g1000-hit-zone g1000-hit-zone--${zone.radius ?? "button"}`}
            style={getHitZoneStyle(zone)}
            onClick={() => handleHitZonePress(zone)}
          />
        ))}
      </div>
    </article>
  );
}

function getVisibleSoftKeys(
  root: SoftKey[],
  path: SoftKeyPosition[],
): SoftKey[] {
  let level = root;

  for (const position of path) {
    const activeSoftKey = level.find(
      (key): key is SoftKey & { children: SoftKey[] } =>
        key.position === position && hasChildren(key),
    );

    if (!activeSoftKey) {
      return level;
    }

    level = activeSoftKey.children;
  }

  return level;
}

function hasChildren(key: SoftKey): key is SoftKey & { children: SoftKey[] } {
  return "children" in key;
}

function readSoftKeyPosition(label: string): SoftKeyPosition | undefined {
  const match = /^Softkey ([1-9]|1[0-2])$/.exec(label);

  if (!match) {
    return undefined;
  }

  const position = Number.parseInt(match[1] ?? "", 10);

  return isSoftKeyPosition(position) ? position : undefined;
}

function isSoftKeyPosition(position: number): position is SoftKeyPosition {
  return Number.isInteger(position) && position >= 1 && position <= 12;
}

const displayViewportStyle: CSSProperties = {
  background: "#05070a",
  display: "block",
  height: `${(displayViewport.height / frameHeight) * 100}%`,
  left: `${(displayViewport.x / frameWidth) * 100}%`,
  pointerEvents: "none",
  position: "absolute",
  top: `${(displayViewport.y / frameHeight) * 100}%`,
  width: `${(displayViewport.width / frameWidth) * 100}%`,
};

const attitudeIndicatorStyle: CSSProperties = {
  display: "block",
  height: `${(((attitudeIndicator.height / displayCanvas.height) * displayViewport.height) / frameHeight) * 100}%`,
  left: `${((displayViewport.x + (attitudeIndicator.x / displayCanvas.width) * displayViewport.width) / frameWidth) * 100}%`,
  pointerEvents: "none",
  position: "absolute",
  top: `${((displayViewport.y + (attitudeIndicator.top / displayCanvas.height) * displayViewport.height) / frameHeight) * 100}%`,
  transform: "translateX(-50%)",
  userSelect: "none",
  width: `${(((attitudeIndicator.width / displayCanvas.width) * displayViewport.width) / frameWidth) * 100}%`,
};

const rollPointerStyle: CSSProperties = {
  display: "block",
  height: `${(((rollPointer.height / displayCanvas.height) * displayViewport.height) / frameHeight) * 100}%`,
  left: `${((displayViewport.x + (rollPointer.x / displayCanvas.width) * displayViewport.width) / frameWidth) * 100}%`,
  pointerEvents: "none",
  position: "absolute",
  top: `${((displayViewport.y + (rollPointer.top / displayCanvas.height) * displayViewport.height) / frameHeight) * 100}%`,
  transform: "translateX(-50%)",
  userSelect: "none",
  width: `${(((rollPointer.width / displayCanvas.width) * displayViewport.width) / frameWidth) * 100}%`,
};

function getHitZoneStyle(zone: HitZone): CSSProperties {
  return {
    height: `${(zone.height / frameHeight) * 100}%`,
    left: `${(zone.x / frameWidth) * 100}%`,
    top: `${(zone.y / frameHeight) * 100}%`,
    width: `${(zone.width / frameWidth) * 100}%`,
  };
}

function drawPfdCanvas(
  canvas: HTMLCanvasElement,
  data: PfdDisplayData,
  softKeys: SoftKey[],
): void {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  console.log(canvas.width);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#05070a";
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawArtificialHorizon(context, canvas.width, canvas.height, data.attitude);
  drawBalanceBar(context, data.attitude.slipSkidDeflection);
  drawSoftKeyLabels(context, softKeys, canvas.width, canvas.height);
  drawTemperatureInfo(
    context,
    canvas.width,
    canvas.height,
    data.environment.oatC,
    data.environment.isaC,
  );
  drawXPDRTimeInfo(
    context,
    canvas.width,
    canvas.height,
    data.environment.systemTime,
    data.environment.transponderCode,
    data.environment.transponderMode,
  );
  drawAutopilotPanel(context, canvas.width, canvas.height);
  drawNavBox(context, canvas.width, canvas.height);

  drawNavStack(context, canvas.width, canvas.height, data.radios);
  drawCommStack(context, canvas.width, canvas.height, data.radios);
}

function drawArtificialHorizon(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  attitude: PfdDisplayData["attitude"],
): void {
  const horizonTop = 58;
  const levelSkyHeight = 230;
  const horizonLineHeight = 1;
  const levelGroundHeight = 460;
  const pitchPixelsPerDegree = 142 / 20;
  const horizonHeight = levelSkyHeight + horizonLineHeight + levelGroundHeight;
  const levelHorizonLineY = horizonTop + levelSkyHeight;
  const pitchOffsetY = attitude.pitchDeg * pitchPixelsPerDegree;
  const horizonCenterX = canvasWidth / 2;
  const rollRad = (-attitude.rollDeg * Math.PI) / 180;
  const fillExtent = Math.hypot(canvasWidth, canvasHeight) * 2;

  context.save();
  context.beginPath();
  context.rect(0, horizonTop, canvasWidth, horizonHeight);
  context.clip();

  context.translate(horizonCenterX, levelHorizonLineY);
  context.rotate(rollRad);

  context.save();
  context.translate(0, pitchOffsetY);

  context.fillStyle = "#277abd";
  context.fillRect(-fillExtent / 2, -fillExtent, fillExtent, fillExtent);
  context.fillStyle = "#8b8f92";
  context.fillRect(-fillExtent / 2, 0, fillExtent, horizonLineHeight);
  context.fillStyle = "#7a4a28";
  context.fillRect(-fillExtent / 2, horizonLineHeight, fillExtent, fillExtent);

  drawPitchBars(context, {
    pitchDeg: attitude.pitchDeg,
    pixelsPerDegree: pitchPixelsPerDegree,
  });
  context.restore();

  drawRollScale(context, levelHorizonLineY);

  context.restore();
}

function drawBalanceBar(
  context: CanvasRenderingContext2D,
  deflection: number,
): void {
  if (!balanceBarImage?.complete || balanceBarImage.naturalWidth === 0) {
    return;
  }

  const x =
    balanceBar.x -
    balanceBar.width / 2 +
    deflection * balanceBar.deflectionPixels;

  context.drawImage(
    balanceBarImage,
    x,
    balanceBar.top,
    balanceBar.width,
    balanceBar.height,
  );
}

function drawRollScale(
  context: CanvasRenderingContext2D,
  levelHorizonLineY: number,
): void {
  if (!rollScaleImage?.complete || rollScaleImage.naturalWidth === 0) {
    return;
  }

  const x = rollScale.x - displayCanvas.width / 2 - rollScale.width / 2;
  const y = rollScale.top - levelHorizonLineY;

  context.drawImage(rollScaleImage, x, y, rollScale.width, rollScale.height);
}

function drawPitchBars(
  context: CanvasRenderingContext2D,
  {
    pitchDeg,
    pixelsPerDegree,
  }: {
    pitchDeg: number;
    pixelsPerDegree: number;
  },
): void {
  const pitchStepDeg = 2.5;
  const minPitchDeg = -80;
  const maxPitchDeg = 80;
  const visiblePitchUpDeg = 20;
  const visiblePitchDownDeg = 15;
  const minVisiblePitchDeg = Math.max(
    minPitchDeg,
    pitchDeg - visiblePitchDownDeg,
  );
  const maxVisiblePitchDeg = Math.min(
    maxPitchDeg,
    pitchDeg + visiblePitchUpDeg,
  );
  const minStep = Math.ceil(minVisiblePitchDeg / pitchStepDeg);
  const maxStep = Math.floor(maxVisiblePitchDeg / pitchStepDeg);

  context.save();
  context.strokeStyle = "#ffffff";
  context.fillStyle = "#ffffff";
  context.lineWidth = 2;
  context.font = "800 13px Inter, sans-serif";
  context.textBaseline = "middle";

  for (let step = minStep; step <= maxStep; step++) {
    if (step === 0) {
      continue;
    }

    const pitchDeg = step * pitchStepDeg;
    const pitchMark = getPitchMark(pitchDeg);

    if (!pitchMark) {
      continue;
    }

    const y = -pitchDeg * pixelsPerDegree;

    context.beginPath();
    context.moveTo(-pitchMark.width / 2, y);
    context.lineTo(pitchMark.width / 2, y);
    context.stroke();

    if (pitchMark.hasLabel) {
      const label = Math.abs(pitchDeg).toString();
      const labelGap = 9;

      context.textAlign = "right";
      context.fillText(label, -pitchMark.width / 2 - labelGap, y);
      context.textAlign = "left";
      context.fillText(label, pitchMark.width / 2 + labelGap, y);
    }
  }

  context.restore();
}

function getPitchMark(
  pitchDeg: number,
): { hasLabel: boolean; width: number } | undefined {
  const absolutePitchDeg = Math.abs(pitchDeg);

  if (isPitchMultiple(pitchDeg, 10) && absolutePitchDeg <= 80) {
    return { hasLabel: true, width: 110 };
  }

  if (isPitchMultiple(pitchDeg, 5) && pitchDeg >= -25 && pitchDeg <= 45) {
    return { hasLabel: false, width: 56 };
  }

  if (pitchDeg >= -20 && pitchDeg <= 20) {
    return { hasLabel: false, width: 30 };
  }

  return undefined;
}

function isPitchMultiple(value: number, multiple: number): boolean {
  return Math.abs(value / multiple - Math.round(value / multiple)) < 1e-9;
}

function createCanvasImage(src: string): HTMLImageElement | undefined {
  if (typeof Image === "undefined") {
    return undefined;
  }

  const image = new Image();
  image.src = src;

  return image;
}

function drawXPDRTimeInfo(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  systemTime: Date,
  transponderCode: string,
  transponderMode: string,
): void {
  const rowHeight = 25;
  const y = canvasHeight - rowHeight - 25; // Position above the soft key row

  // Time Info Box
  const timeWidth = 134;
  const timeX = canvasWidth - timeWidth;
  context.fillStyle = "#2B2C2F";
  context.fillRect(timeX, y, timeWidth, rowHeight);
  // Draw white border around the Time Info box
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(timeX, y, timeWidth, rowHeight);
  // Draw Time Info text ("TIME left aligned to box, HH:MM:SS converted to UTC right aligned to box")
  context.fillStyle = "#dce2e5";
  context.font = "800 11px Inter, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("UTC", timeX + 5, y + rowHeight / 2);
  context.textAlign = "right";
  const utcTimePart = systemTime.toUTCString().split(" ")[4] ?? ""; // Extract HH:MM:SS from UTC string
  context.fillText(utcTimePart, timeX + timeWidth - 5, y + rowHeight / 2);

  // XPDR Info Box
  const xpdrWidth = 171;
  const xpdrX = timeX - xpdrWidth;
  context.fillStyle = "#2B2C2F";
  context.fillRect(xpdrX, y, xpdrWidth, rowHeight);
  // Draw white border around the XPDR Info box
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(xpdrX, y, xpdrWidth, rowHeight);
  const isFlashing = Math.floor(Date.now() / 500) % 2 === 0; // Flash every 500ms
  const isAltitudeReporting = transponderMode.toUpperCase() === "ALT";
  const transponderCodeItem: CanvasTextItem = isAltitudeReporting
    ? { color: "#4be17b", text: transponderCode }
    : { text: transponderCode };
  const transponderModeItem: CanvasTextItem = isAltitudeReporting
    ? { color: "#4be17b", text: transponderMode }
    : { text: transponderMode };

  drawFlexTextRow(context, {
    height: rowHeight,
    items: [
      { text: "XPDR" },
      transponderCodeItem,
      transponderModeItem,
      { color: "#ffffff", text: isFlashing ? "R" : "" },
    ],
    paddingX: 6,
    width: xpdrWidth,
    x: xpdrX,
    y,
  });
}

function drawTemperatureInfo(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  oatC: number,
  isaC: number,
): void {
  const rowHeight = 25;
  const y = canvasHeight - rowHeight - 25; // Position above the soft key row

  // OAT Box
  const oatWidth = 87;
  const oatX = 0;
  context.fillStyle = "#2B2C2F";
  context.fillRect(oatX, y, oatWidth, rowHeight);
  // Draw white border around the OAT box
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(oatX, y, oatWidth, rowHeight);
  // Draw OAT text ("OAT left aligned to box, xºC right aligned to box")
  context.fillStyle = "#dce2e5";
  context.font = "800 11px Inter, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("OAT", oatX + 5, y + rowHeight / 2);
  context.textAlign = "right";
  context.fillText(`${oatC}ºC`, oatX + oatWidth - 5, y + rowHeight / 2);
  // ISA Box
  const isaWidth = 87;
  const isaX = oatX + oatWidth;
  context.fillStyle = "#2B2C2F";
  context.fillRect(isaX, y, isaWidth, rowHeight);
  // Draw white border around the ISA box
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(isaX, y, isaWidth, rowHeight);
  // Draw ISA text ("ISA left aligned to box, xºC right aligned to box")
  context.fillStyle = "#dce2e5";
  context.font = "800 11px Inter, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("ISA", isaX + 5, y + rowHeight / 2);
  context.textAlign = "right";
  context.fillText(`${isaC}ºC`, isaX + isaWidth - 5, y + rowHeight / 2);
}

function drawFlexTextRow(
  context: CanvasRenderingContext2D,
  {
    height,
    items,
    paddingX,
    width,
    x,
    y,
  }: {
    height: number;
    items: CanvasTextItem[];
    paddingX: number;
    width: number;
    x: number;
    y: number;
  },
): void {
  const slotWidth = (width - paddingX * 2) / items.length;
  const centerY = y + height / 2;

  context.save();

  context.textAlign = "center";
  context.textBaseline = "middle";

  items.forEach((item, index) => {
    context.font = `800 ${item.size ?? 11}px Inter, sans-serif`;
    const centerX = x + paddingX + slotWidth * (index + 0.5);

    context.fillStyle = item.color ?? "#dce2e5";
    context.fillText(item.text, centerX, centerY, slotWidth - 4);
  });

  context.restore();
}

function drawSoftKeyLabels(
  context: CanvasRenderingContext2D,
  softKeys: SoftKey[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  const rowHeight = 25;
  const y = canvasHeight - rowHeight;

  context.fillStyle = "#383A39";
  context.fillRect(0, y, canvasWidth, rowHeight);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, y);
  context.lineTo(canvasWidth, y);
  context.stroke();

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "800 11px Inter, sans-serif";

  for (let i = 0; i < 12; i++) {
    // Draw the soft key separator lines
    const x = (canvasWidth / 12) * i;
    context.strokeStyle = "#fffff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y + rowHeight);
    context.stroke();
  }

  for (const position of softKeyPositions) {
    const key = softKeys.find((softKey) => softKey.position === position);

    if (!key) {
      continue;
    }

    const columnWidth = canvasWidth / softKeyPositions.length;
    const centerX = columnWidth * (position - 0.5);
    const labelY = y + rowHeight / 2;

    context.fillStyle = "#dce2e5";
    context.fillText(key.label, centerX, labelY);
  }

  context.textAlign = "start";
  context.textBaseline = "alphabetic";
}

function drawNavStack(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  radios: PfdDisplayData["radios"],
): void {
  const row1Height = 58 / 2;
  const row2Height = 58 / 2;
  const row1Y = 0;
  const row2Y = 0 + row1Height;
  const rowWidth = 265;
  const frequencyX = 41;
  const frequencyWidth = rowWidth - frequencyX;
  const frequencyPaddingX = 5;

  // Draw the nav stack
  context.fillStyle = "#2B2C2F";
  context.fillRect(0, row1Y, rowWidth, row1Height + row2Height);
  //Draw right border of the nav stack
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(rowWidth, row1Y);
  context.lineTo(rowWidth, row1Y + row1Height + row2Height);
  context.stroke();

  // Draw Nav1 text
  const fontSize = 11;
  context.fillStyle = "#dce2e5";
  context.font = `800 ${fontSize}px Inter, sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("NAV1", 5, row1Y + row1Height - fontSize);

  // Draw Nav1 frequency
  drawFlexTextRow(context, {
    height: row1Height,
    items: [
      { text: radios.nav1Active, size: 13 },
      { text: "↔" },
      { text: radios.nav1Standby, size: 13 },
    ],
    paddingX: frequencyPaddingX,
    width: frequencyWidth,
    x: frequencyX,
    y: row1Y,
  });

  // Draw Nav2 text
  context.fillStyle = "#dce2e5";
  context.font = `800 ${fontSize}px Inter, sans-serif`;
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("NAV2", 5, row2Y + row2Height - fontSize);

  // Draw Nav2 frequency
  drawFlexTextRow(context, {
    height: row2Height,
    items: [
      { text: radios.nav2Active, size: 13 },
      { text: "↔" },
      { text: radios.nav2Standby, size: 13 },
    ],
    paddingX: frequencyPaddingX,
    width: frequencyWidth,
    x: frequencyX,
    y: row2Y,
  });

  drawActiveNavFrequencyBox(context, {
    height: radios.navSource === 1 ? row1Height : row2Height,
    itemCount: 3,
    paddingX: frequencyPaddingX,
    slotIndex: 0,
    width: frequencyWidth,
    x: frequencyX,
    y: radios.navSource === 1 ? row1Y : row2Y,
  });
}

function drawCommStack(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  radios: PfdDisplayData["radios"],
): void {
  const row1Height = 58 / 2;
  const row2Height = 58 / 2;
  const row1Y = 0;
  const row2Y = 0 + row1Height;
  const rowWidth = 265;
  const labelWidth = 41;
  const frequencyX = canvasWidth - rowWidth;
  const frequencyWidth = rowWidth - labelWidth;
  const frequencyPaddingX = 5;

  // Draw the comm stack
  context.fillStyle = "#2B2C2F";
  context.fillRect(
    canvasWidth - rowWidth,
    row1Y,
    rowWidth,
    row1Height + row2Height,
  );
  //Draw left border of the comm stack
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(canvasWidth - rowWidth, row1Y);
  context.lineTo(canvasWidth - rowWidth, row1Y + row1Height + row2Height);
  context.stroke();

  // Draw Comm1 text
  const fontSize = 11;
  context.fillStyle = "#dce2e5";
  context.font = `800 ${fontSize}px Inter, sans-serif`;
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillText("COM1", canvasWidth - 5, row1Y + row1Height - fontSize);

  // Draw Comm1 frequency
  drawFlexTextRow(context, {
    height: row1Height,
    items: [
      { text: radios.com1Standby, size: 13 },
      { text: "↔" },
      { text: radios.com1Active, size: 13 },
    ],
    paddingX: frequencyPaddingX,
    width: frequencyWidth,
    x: frequencyX,
    y: row1Y,
  });

  // Draw Comm2 text
  context.fillStyle = "#dce2e5";
  context.font = `800 ${fontSize}px Inter, sans-serif`;
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillText("COM2", canvasWidth - 5, row2Y + row2Height - fontSize);

  // Draw Comm2 frequency
  drawFlexTextRow(context, {
    height: row2Height,
    items: [
      { text: radios.com2Standby, size: 13 },
      { text: "↔" },
      { text: radios.com2Active, size: 13 },
    ],
    paddingX: frequencyPaddingX,
    width: frequencyWidth,
    x: frequencyX,
    y: row2Y,
  });

  drawActiveNavFrequencyBox(context, {
    height: radios.comSource === 1 ? row1Height : row2Height,
    itemCount: 3,
    paddingX: frequencyPaddingX,
    slotIndex: 2,
    width: frequencyWidth,
    x: frequencyX,
    y: radios.comSource === 1 ? row1Y : row2Y,
  });
}

function drawActiveNavFrequencyBox(
  context: CanvasRenderingContext2D,
  {
    height,
    itemCount,
    paddingX,
    slotIndex,
    width,
    x,
    y,
  }: {
    height: number;
    itemCount: number;
    paddingX: number;
    slotIndex: number;
    width: number;
    x: number;
    y: number;
  },
): void {
  const slotWidth = (width - paddingX * 2) / itemCount;
  const insetX = 4;
  const insetY = 4;

  context.save();
  context.strokeStyle = "#23a8ff";
  context.lineWidth = 2;
  context.strokeRect(
    x + paddingX + slotWidth * slotIndex + insetX,
    y + insetY,
    slotWidth - insetX * 2,
    height - insetY * 2,
  );
  context.restore();
}

function drawNavBox(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void {
  // Nav alert box
  const alertWidth = 282;
  const alertHeight = 58 / 2;
  const alertX = 263;
  const alertY = 0;

  context.fillStyle = "#2B2C2F";
  context.fillRect(alertX, alertY, alertWidth, alertHeight);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  // Draw Right border of the nav alert box
  context.beginPath();
  context.moveTo(alertX + alertWidth, alertY);
  context.lineTo(alertX + alertWidth, alertY + alertHeight);
  context.stroke();

  // Nav info box
  const infoWidth = 216;
  const infoHeight = 58 / 2;
  const infoX = alertX + alertWidth;
  const infoY = alertY;

  context.fillStyle = "#2B2C2F";
  context.fillRect(infoX, infoY, infoWidth, infoHeight);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;

  // Draw Bottom border of the both boxes
  context.beginPath();
  context.moveTo(alertX, alertY + alertHeight);
  context.lineTo(infoX + infoWidth, infoY + infoHeight);
  context.stroke();
}

function drawAutopilotPanel(
  context: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void {
  //Lateral Box
  const lateralWidth = 126;
  const lateralHeight = 58 / 2;
  const lateralX = 265;
  const lateralY = 58 / 2;

  context.fillStyle = "#2B2C2F";
  context.fillRect(lateralX, lateralY, lateralWidth, lateralHeight);

  // Draw right border
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(lateralX + lateralWidth, lateralY);
  context.lineTo(lateralX + lateralWidth, lateralY + lateralHeight);
  context.stroke();

  // AP Status Box
  const apStatusWidth = 92;
  const apStatusHeight = 58 / 2;
  const apStatusX = lateralX + lateralWidth;
  const apStatusY = lateralY;

  context.fillStyle = "#2B2C2F";
  context.fillRect(apStatusX, apStatusY, apStatusWidth, apStatusHeight);

  // Draw right border of AP Status Box
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(apStatusX + apStatusWidth, apStatusY);
  context.lineTo(apStatusX + apStatusWidth, apStatusY + apStatusHeight);
  context.stroke();

  //Vertical Box
  const verticalWidth = 278;
  const verticalHeight = 58 / 2;
  const verticalX = apStatusX + apStatusWidth;
  const verticalY = lateralY;

  context.fillStyle = "#2B2C2F";
  context.fillRect(verticalX, verticalY, verticalWidth, verticalHeight);
}

function formatHeadingLabel(value: number): string {
  if (value === 0) {
    return "N";
  }

  return Math.round(value / 10).toString();
}

function formatHeadingValue(value: number): string {
  return Math.round(value).toString().padStart(3, "0");
}
