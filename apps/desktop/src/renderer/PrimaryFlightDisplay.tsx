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
import cdiDotsSrc from "./assets/CDI Dots.svg";
import hsiSrc from "./assets/HSI.svg";
import hsiPlaneSrc from "./assets/HSI Plane.svg";
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
const attitudeReferenceX = 460;
const displayViewport = {
  height: 793,
  width: 1056,
  x: 197,
  y: 48,
} as const;
const attitudeIndicator = {
  height: 38,
  width: 414,
  x: attitudeReferenceX,
  top: 288,
} as const;
const rollScale = {
  height: 120,
  width: 385,
  x: attitudeReferenceX,
  top: 75,
} as const;
const rollPointer = {
  height: 22,
  width: 22,
  x: attitudeReferenceX,
  top: 97,
} as const;
const balanceBar = {
  deflectionPixels: 26,
  height: 5,
  width: 30,
  x: attitudeReferenceX,
  top: 123,
} as const;
const hsi = {
  height: 290,
  width: 290,
  x: 315,
  y: 442,
} as const;
const hsiDots = {
  height: (14 / 145) * 142,
  width: 142,
} as const;
const hsiPlane = {
  height: 40,
  width: 40,
} as const;
const hsiOuterTicks = {
  anglesDeg: [45, 90, 135, 225, 270, 315],
  length: 16,
  lineWidth: 2,
} as const;
const hsiHeadingBug = {
  cutoutHeight: 8,
  cutoutWidth: 12,
  height: 12,
  width: 26,
} as const;
const presentHeadingBox = {
  fontPx: 24,
  height: 33,
  width: 70,
  x: 426,
  y: 401,
} as const;
const presentHeadingPointer = {
  hsiInset: hsiHeadingBug.cutoutHeight,
  width: hsiHeadingBug.cutoutWidth,
} as const;
const hsiNavSourceText = {
  fontPx: 16,
  x: 408,
  y: 541,
} as const;
const hsiNavPhaseText = {
  ...hsiNavSourceText,
  x: 482,
} as const;
const hsiCoursePointer = {
  arrowHeight: 16,
  arrowWidth: 33,
  courseDeviationLineLength: 108,
  doubleLineOffset: 4,
  lineWidth: 4,
  leadingLineLength: 53,
  trailingLineLength: 67,
  deviationGap: 119,
  toFromArrowHeight: 15,
  toFromArrowWidth: 28,
} as const;
const hsiCourseDeviationScale = {
  dotImageWidth: 144,
  outerDotCenterInset: 7,
} as const;
const hsiTurnRateIndicator = {
  arrowHeadLength: 12,
  arrowHeadWidth: 10,
  backgroundColor: "rgba(64, 64, 64, 0.5)",
  height: 18,
  maxArrowRateDegPerSec: 4,
  predictionSeconds: 6,
  standardRateDegPerSec: 3,
  tickLineWidth: 2,
  trendLineWidth: 4,
  topY: 424,
} as const;
const airspeedTape = {
  height: 342,
  pointerGapToRangeStrip: 3,
  pointerHeight: 41,
  pointerWidth: 69,
  pointerY: 264,
  rangeStripWidth: 12,
  viewKt: 60,
  width: 88,
  x: 152.88,
  y: 114,
} as const;
const trueAirspeedBox = {
  height: 25,
  width: airspeedTape.width,
  x: airspeedTape.x,
  y: airspeedTape.y + airspeedTape.height,
} as const;
const selectedAltitudeBox = {
  height: 32,
  largeDigitFontPx: 20,
  smallDigitFontPx: 16,
  width: 108,
  x: 702,
  y: 82,
} as const;
const altitudeTape = {
  height: 342,
  labelRightPadding: 7,
  majorTickFt: 100,
  majorTickWidth: 34,
  minorTickFt: 20,
  minorTickWidth: 18,
  viewFt: 600,
  width: 108,
  x: selectedAltitudeBox.x,
  y: selectedAltitudeBox.y + selectedAltitudeBox.height,
} as const;
const altitudePointer = {
  height: 43,
  largeDigitFontPx: 25,
  smallDigitFontPx: 20,
  triangleHeight: 29,
  triangleWidth: 14,
  width: 88,
  x: 717,
  y: 263,
} as const;
const altitudeBug = {
  color: "#8af5ff",
  height: 29,
  width: 14,
  x: altitudePointer.x - altitudePointer.triangleWidth,
} as const;
const barometerBox = {
  height: 25,
  unitFontPx: 13,
  valueFontPx: 18,
  width: altitudeTape.width,
  x: altitudeTape.x,
  y: altitudeTape.y + altitudeTape.height,
} as const;
const verticalSpeedIndicator = {
  height: 322,
  lowerRectHeight: 135,
  majorLabelFontPx: 18,
  majorTickFpm: 1000,
  majorTickWidth: 16,
  maxFpm: 2000,
  minorTickFpm: 500,
  minorTickWidth: 10,
  taperHeight: 26,
  upperRectHeight: 135,
  width: 45,
  x: 810,
  y: 126,
} as const;
const verticalSpeedPointer = {
  fontPx: 15,
  rectangleHeight: 22,
  rectangleWidth: 46,
  triangleHeight: 22,
  triangleWidth: 22,
} as const;
const selectedHeadingBox = {
  height: 27,
  labelFontPx: 13,
  textInset: 1,
  valueFontPx: 17,
  width: 85,
  x: 275,
  y: 427,
} as const;
const selectedCourseBox = {
  ...selectedHeadingBox,
  x: 559,
} as const;
const airspeedRangeLimits = {
  cautionMaxKt: 163,
  cautionMinKt: 129,
  flapMaxKt: 60,
  flapMinKt: 50,
  lowAwarenessMaxKt: 50,
  minKt: 20,
  normalMaxKt: 129,
  normalMinKt: 60,
  vneKt: 163,
} as const;
const rollScaleImage = createCanvasImage(rollScaleSrc);
const balanceBarImage = createCanvasImage(balanceBarSrc);
const hsiImage = createCanvasImage(hsiSrc);
const hsiDotsImage = createCanvasImage(cdiDotsSrc);
const hsiPlaneImage = createCanvasImage(hsiPlaneSrc);

type CdiSource = "GPS" | "NAV1" | "NAV2";
type CourseToFrom = "TO" | "FROM";
type NavSignalType = "VOR" | "LOC";
type NavPhase =
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
    barometerUnit: "hPa" | "IN";
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
    turnRateDegPerSec: number;
  };
  radios: {
    bearingDeg: number;
    com1Active: string;
    com1Standby: string;
    com2Active: string;
    com2Standby: string;
    comSource: 1 | 2;
    cdiSource: CdiSource;
    courseDeviation: number;
    courseToFrom: CourseToFrom;
    distanceNm: number;
    isActiveNavaidReceived: boolean;
    nav1Active: string;
    nav1SignalType: NavSignalType;
    nav1Standby: string;
    nav2Active: string;
    nav2SignalType: NavSignalType;
    nav2Standby: string;
    navPhase: NavPhase;
    navSource: 1 | 2;
    waypoint: string;
  };
}

const dummyPfdData: PfdDisplayData = {
  airspeed: {
    bugKt: 210,
    indicatedKt: 115,
    trueAirspeedKt: 315,
    trendKt: 4,
  },
  altitude: {
    altitudeFt: 5000,
    barometerInHg: 29.92,
    barometerUnit: "hPa",
    selectedAltitudeFt: 5200,
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
    currentDeg: 326,
    desiredTrackDeg: 105,
    selectedDeg: 15,
    turnRateDegPerSec: 2,
  },
  radios: {
    bearingDeg: 105,
    com1Active: "118.100",
    com1Standby: "136.275",
    com2Active: "118.300",
    com2Standby: "118.400",
    comSource: 1,
    cdiSource: "GPS",
    courseDeviation: 0,
    courseToFrom: "TO",
    distanceNm: 51.5,
    isActiveNavaidReceived: true,
    nav1Active: "108.00",
    nav1SignalType: "VOR",
    nav1Standby: "117.95",
    nav2Active: "108.00",
    nav2SignalType: "VOR",
    nav2Standby: "117.95",
    navPhase: "ENR",
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
  cycleCdiSource: () => void;
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
  {
    position: 6,
    label: "CDI",
    pressed: ({ cycleCdiSource }) => cycleCdiSource(),
  },
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
  const [cdiSource, setCdiSource] = useState<CdiSource>(
    dummyPfdData.radios.cdiSource,
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
      cycleCdiSource: () => {
        setCdiSource((source) => getNextCdiSource(source));
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
  const displayData = useMemo<PfdDisplayData>(
    () => ({
      ...dummyPfdData,
      radios: {
        ...dummyPfdData.radios,
        cdiSource,
      },
    }),
    [cdiSource],
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeCanvas = canvas;
    let animationFrameId = 0;

    function redraw(): void {
      drawPfdCanvas(activeCanvas, displayData, visibleSoftKeys);
      animationFrameId = requestAnimationFrame(redraw);
    }

    animationFrameId = requestAnimationFrame(redraw);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [displayData, visibleSoftKeys]);

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

function getNextCdiSource(source: CdiSource): CdiSource {
  switch (source) {
    case "GPS":
      return "NAV1";
    case "NAV1":
      return "NAV2";
    case "NAV2":
      return "GPS";
  }
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
  drawAirspeedTape(context, data.airspeed);
  drawTrueAirspeedBox(context, data.airspeed.trueAirspeedKt);
  drawAltitudeTape(context, data.altitude);
  drawSelectedAltitudeBox(context, data.altitude.selectedAltitudeFt);
  drawBarometerBox(context, data.altitude);
  drawVerticalSpeedIndicator(context, data.altitude.verticalSpeedFpm);
  drawHorizontalSituationIndicator(context, data.heading, data.radios);
  drawPresentHeadingBox(context, data.heading.currentDeg);
  drawSelectedHeadingBox(context, data.heading.selectedDeg);
  drawSelectedCourseBox(
    context,
    data.heading.desiredTrackDeg,
    data.radios.cdiSource,
  );
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
  const horizonCenterX = attitudeReferenceX;
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
  if (!isCanvasImageReady(balanceBarImage)) {
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

function drawHorizontalSituationIndicator(
  context: CanvasRenderingContext2D,
  heading: PfdDisplayData["heading"],
  radios: PfdDisplayData["radios"],
): void {
  const centerX = hsi.x + hsi.width / 2;
  const centerY = hsi.y + hsi.height / 2;
  const courseRotationDeg = heading.desiredTrackDeg - heading.currentDeg;

  drawRotatedImage(context, {
    centerX,
    centerY,
    height: hsi.height,
    image: hsiImage,
    rotationDeg: -heading.currentDeg,
    width: hsi.width,
  });
  drawRotatedImage(context, {
    centerX,
    centerY,
    height: hsiDots.height,
    image: hsiDotsImage,
    rotationDeg: courseRotationDeg,
    width: hsiDots.width,
  });
  drawHsiCoursePointer(context, {
    centerX,
    centerY,
    radios,
    rotationDeg: courseRotationDeg,
  });
  drawRotatedImage(context, {
    centerX,
    centerY,
    height: hsiPlane.height,
    image: hsiPlaneImage,
    rotationDeg: 0,
    width: hsiPlane.width,
  });
  drawHsiNavigationInfo(context, radios);
  drawHsiOuterTicks(context, centerX, centerY);
  drawHsiTurnRateIndicator(
    context,
    centerX,
    centerY,
    heading.turnRateDegPerSec,
  );

  drawPresentHeadingPointer(context, centerX);
  drawHsiHeadingBug(context, centerX, centerY, heading);
}

function drawHsiNavigationInfo(
  context: CanvasRenderingContext2D,
  radios: PfdDisplayData["radios"],
): void {
  const sourceColor = getCdiSourceColor(radios.cdiSource);

  context.save();
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = `400 ${hsiNavSourceText.fontPx}px Inter, sans-serif`;
  context.fillStyle = sourceColor;
  context.fillText(
    formatDisplayedCdiSource(radios),
    hsiNavSourceText.x,
    hsiNavSourceText.y,
  );

  if (radios.cdiSource === "GPS") {
    context.fillStyle = "#ff4dff";
    context.fillText(radios.navPhase, hsiNavPhaseText.x, hsiNavPhaseText.y);
  }

  context.restore();
}

function drawHsiTurnRateIndicator(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  turnRateDegPerSec: number,
): void {
  const geometry = getHsiTurnRateGeometry(centerY);
  const halfStandardPredictionDeg =
    (hsiTurnRateIndicator.standardRateDegPerSec / 2) *
    hsiTurnRateIndicator.predictionSeconds;
  const standardPredictionDeg =
    hsiTurnRateIndicator.standardRateDegPerSec *
    hsiTurnRateIndicator.predictionSeconds;
  const maxPredictionDeg =
    hsiTurnRateIndicator.maxArrowRateDegPerSec *
    hsiTurnRateIndicator.predictionSeconds;

  context.save();
  drawHsiTurnRateBackground(
    context,
    centerX,
    centerY,
    geometry,
    maxPredictionDeg,
  );

  context.strokeStyle = "#ffffff";
  context.lineWidth = hsiTurnRateIndicator.tickLineWidth;

  [
    -standardPredictionDeg,
    -halfStandardPredictionDeg,
    halfStandardPredictionDeg,
    standardPredictionDeg,
  ].forEach((angleDeg) => {
    drawHsiTurnRateTick(context, centerX, centerY, angleDeg, geometry);
  });

  drawHsiTurnRateTrendVector(
    context,
    centerX,
    centerY,
    turnRateDegPerSec,
    geometry.trendRadius,
  );
  context.restore();
}

function getHsiTurnRateGeometry(centerY: number): {
  backgroundRadius: number;
  tickInnerRadius: number;
  tickOuterRadius: number;
  trendRadius: number;
} {
  const tickOuterRadius = centerY - hsiTurnRateIndicator.topY;
  const tickInnerRadius = tickOuterRadius - hsiTurnRateIndicator.height;
  const backgroundRadius = tickInnerRadius + hsiTurnRateIndicator.height / 2;
  const trendRadius = tickInnerRadius + hsiTurnRateIndicator.trendLineWidth / 2;

  return { backgroundRadius, tickInnerRadius, tickOuterRadius, trendRadius };
}

function drawHsiTurnRateBackground(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  geometry: ReturnType<typeof getHsiTurnRateGeometry>,
  maxPredictionDeg: number,
): void {
  context.save();
  context.strokeStyle = hsiTurnRateIndicator.backgroundColor;
  context.lineCap = "butt";
  context.lineWidth = hsiTurnRateIndicator.height;
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    geometry.backgroundRadius,
    degreesToRadians(-maxPredictionDeg - 90),
    degreesToRadians(maxPredictionDeg - 90),
  );
  context.stroke();
  context.restore();
}

function drawHsiTurnRateTick(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  angleDeg: number,
  geometry: ReturnType<typeof getHsiTurnRateGeometry>,
): void {
  const inner = getHsiRelativePoint(
    centerX,
    centerY,
    geometry.tickInnerRadius,
    angleDeg,
  );
  const outer = getHsiRelativePoint(
    centerX,
    centerY,
    geometry.tickOuterRadius,
    angleDeg,
  );

  context.beginPath();
  context.moveTo(inner.x, inner.y);
  context.lineTo(outer.x, outer.y);
  context.stroke();
}

function drawHsiTurnRateTrendVector(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  turnRateDegPerSec: number,
  trendRadius: number,
): void {
  if (!Number.isFinite(turnRateDegPerSec) || turnRateDegPerSec === 0) {
    return;
  }

  const sign = Math.sign(turnRateDegPerSec);
  const absoluteRate = Math.abs(turnRateDegPerSec);
  const cappedRate = Math.min(
    absoluteRate,
    hsiTurnRateIndicator.maxArrowRateDegPerSec,
  );
  const predictedHeadingDeltaDeg =
    sign * cappedRate * hsiTurnRateIndicator.predictionSeconds;
  const startRad = degreesToRadians(-90);
  const endRad = degreesToRadians(predictedHeadingDeltaDeg - 90);
  const showArrowHead =
    absoluteRate > hsiTurnRateIndicator.maxArrowRateDegPerSec;

  context.save();
  context.strokeStyle = "#ff4dff";
  context.fillStyle = "#ff4dff";
  context.lineCap = "butt";
  context.lineWidth = hsiTurnRateIndicator.trendLineWidth;
  context.beginPath();
  context.arc(centerX, centerY, trendRadius, startRad, endRad, sign < 0);
  context.stroke();

  if (showArrowHead) {
    const endPoint = getHsiRelativePoint(
      centerX,
      centerY,
      trendRadius,
      predictedHeadingDeltaDeg,
    );
    const directionRad = degreesToRadians(
      sign > 0 ? predictedHeadingDeltaDeg : predictedHeadingDeltaDeg + 180,
    );

    drawHsiTurnRateArrowHead(context, endPoint.x, endPoint.y, directionRad);
  }

  context.restore();
}

function drawHsiTurnRateArrowHead(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  directionRad: number,
): void {
  const backX =
    x - Math.cos(directionRad) * hsiTurnRateIndicator.arrowHeadLength;
  const backY =
    y - Math.sin(directionRad) * hsiTurnRateIndicator.arrowHeadLength;
  const normalRad = directionRad + Math.PI / 2;
  const halfWidth = hsiTurnRateIndicator.arrowHeadWidth / 2;

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(
    backX + Math.cos(normalRad) * halfWidth,
    backY + Math.sin(normalRad) * halfWidth,
  );
  context.lineTo(
    backX - Math.cos(normalRad) * halfWidth,
    backY - Math.sin(normalRad) * halfWidth,
  );
  context.closePath();
  context.fill();
}

function drawHsiCoursePointer(
  context: CanvasRenderingContext2D,
  {
    centerX,
    centerY,
    radios,
    rotationDeg,
  }: {
    centerX: number;
    centerY: number;
    radios: PfdDisplayData["radios"];
    rotationDeg: number;
  },
): void {
  const color = getCdiSourceColor(radios.cdiSource);
  const halfDeviationGap = hsiCoursePointer.deviationGap / 2;
  const leadingLineEndY = -halfDeviationGap;
  const trailingLineStartY = halfDeviationGap;
  const arrowBaseY = leadingLineEndY - hsiCoursePointer.leadingLineLength;
  const arrowTipY = arrowBaseY - hsiCoursePointer.arrowHeight;
  const trailingLineEndY =
    trailingLineStartY + hsiCoursePointer.trailingLineLength;
  const lineOffsets = isDoubleCoursePointerSource(radios.cdiSource)
    ? [-hsiCoursePointer.doubleLineOffset, hsiCoursePointer.doubleLineOffset]
    : [0];

  context.save();
  context.translate(centerX, centerY);
  context.rotate(degreesToRadians(rotationDeg));
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineCap = "butt";
  context.lineWidth = hsiCoursePointer.lineWidth;

  drawHsiCoursePointerArrowHead(context, arrowTipY, arrowBaseY);

  lineOffsets.forEach((offsetX) => {
    context.beginPath();
    context.moveTo(offsetX, arrowBaseY);
    context.lineTo(offsetX, leadingLineEndY);
    context.moveTo(offsetX, trailingLineStartY);
    context.lineTo(offsetX, trailingLineEndY);
    context.stroke();
  });

  drawHsiCourseDeviationLine(context, radios, lineOffsets);

  if (radios.isActiveNavaidReceived) {
    drawHsiCourseToFromArrow(context, radios.courseToFrom, {
      leadingLineEndY,
      trailingLineStartY,
    });
  }

  context.restore();
}

function drawHsiCourseDeviationLine(
  context: CanvasRenderingContext2D,
  radios: PfdDisplayData["radios"],
  lineOffsets: number[],
): void {
  const deviationX = getCourseDeviationPixels(radios.courseDeviation);
  const halfLineLength = hsiCoursePointer.courseDeviationLineLength / 2;

  lineOffsets.forEach((offsetX) => {
    context.beginPath();
    context.moveTo(deviationX + offsetX, -halfLineLength);
    context.lineTo(deviationX + offsetX, halfLineLength);
    context.stroke();
  });
}

function drawHsiCoursePointerArrowHead(
  context: CanvasRenderingContext2D,
  tipY: number,
  baseY: number,
): void {
  const halfArrowWidth = hsiCoursePointer.arrowWidth / 2;

  context.beginPath();
  context.moveTo(0, tipY);
  context.lineTo(halfArrowWidth, baseY);
  context.lineTo(-halfArrowWidth, baseY);
  context.closePath();
  context.fill();
}

function drawHsiCourseToFromArrow(
  context: CanvasRenderingContext2D,
  courseToFrom: CourseToFrom,
  {
    leadingLineEndY,
    trailingLineStartY,
  }: {
    leadingLineEndY: number;
    trailingLineStartY: number;
  },
): void {
  const halfArrowWidth = hsiCoursePointer.toFromArrowWidth / 2;

  context.beginPath();

  if (courseToFrom === "TO") {
    const baseY = leadingLineEndY;
    const tipY = baseY - hsiCoursePointer.toFromArrowHeight;

    context.moveTo(0, tipY);
    context.lineTo(halfArrowWidth, baseY);
    context.lineTo(-halfArrowWidth, baseY);
  } else {
    const baseY = trailingLineStartY;
    const tipY = baseY + hsiCoursePointer.toFromArrowHeight;

    context.moveTo(0, tipY);
    context.lineTo(halfArrowWidth, baseY);
    context.lineTo(-halfArrowWidth, baseY);
  }

  context.closePath();
  context.fill();
}

function getCdiSourceColor(cdiSource: CdiSource): string {
  return cdiSource === "GPS" ? "#ff4dff" : "#4be17b";
}

function getCourseDeviationPixels(courseDeviation: number): number {
  if (!Number.isFinite(courseDeviation)) {
    return 0;
  }

  const clampedDeviation = Math.max(-1, Math.min(1, courseDeviation));
  const fullScalePixels =
    hsiCourseDeviationScale.dotImageWidth / 2 -
    hsiCourseDeviationScale.outerDotCenterInset;

  return clampedDeviation * fullScalePixels;
}

function getHsiRelativePoint(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = degreesToRadians(angleDeg - 90);

  return {
    x: centerX + Math.cos(angleRad) * radius,
    y: centerY + Math.sin(angleRad) * radius,
  };
}

function formatDisplayedCdiSource(radios: PfdDisplayData["radios"]): string {
  switch (radios.cdiSource) {
    case "GPS":
      return "GPS";
    case "NAV1":
      return `${radios.nav1SignalType}1`;
    case "NAV2":
      return `${radios.nav2SignalType}2`;
  }
}

function isDoubleCoursePointerSource(cdiSource: CdiSource): boolean {
  return cdiSource === "NAV2";
}

function drawPresentHeadingBox(
  context: CanvasRenderingContext2D,
  currentHeadingDeg: number,
): void {
  const centerX = presentHeadingBox.x + presentHeadingBox.width / 2;
  const centerY = presentHeadingBox.y + presentHeadingBox.height / 2;

  context.save();
  context.fillStyle = "#000000";
  context.fillRect(
    presentHeadingBox.x,
    presentHeadingBox.y,
    presentHeadingBox.width,
    presentHeadingBox.height,
  );

  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `800 ${presentHeadingBox.fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  context.fillText(
    `${formatHeadingValue(currentHeadingDeg)}º`,
    centerX,
    centerY,
    presentHeadingBox.width - 4,
  );
  context.restore();
}

function drawHsiOuterTicks(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
): void {
  const innerRadius = hsi.width / 2;
  const outerRadius = innerRadius + hsiOuterTicks.length;

  context.save();
  context.strokeStyle = "#ffffff";
  context.lineCap = "butt";
  context.lineWidth = hsiOuterTicks.lineWidth;

  hsiOuterTicks.anglesDeg.forEach((angleDeg) => {
    const angleRad = degreesToRadians(angleDeg - 90);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    context.beginPath();
    context.moveTo(centerX + cos * innerRadius, centerY + sin * innerRadius);
    context.lineTo(centerX + cos * outerRadius, centerY + sin * outerRadius);
    context.stroke();
  });

  context.restore();
}

function drawPresentHeadingPointer(
  context: CanvasRenderingContext2D,
  centerX: number,
): void {
  const boxBottomY = presentHeadingBox.y + presentHeadingBox.height;
  const halfWidth = presentHeadingPointer.width / 2;
  const pointerTipY = hsi.y + presentHeadingPointer.hsiInset;

  context.save();
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.moveTo(centerX - halfWidth, boxBottomY);
  context.lineTo(centerX + halfWidth, boxBottomY);
  context.lineTo(centerX, pointerTipY);
  context.closePath();
  context.fill();
  context.restore();
}

function drawHsiHeadingBug(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  heading: PfdDisplayData["heading"],
): void {
  if (
    !Number.isFinite(heading.currentDeg) ||
    !Number.isFinite(heading.selectedDeg)
  ) {
    return;
  }

  const rotationDeg = heading.selectedDeg - heading.currentDeg;
  const radius = hsi.width / 2;
  const halfWidth = hsiHeadingBug.width / 2;
  const halfCutoutWidth = hsiHeadingBug.cutoutWidth / 2;
  const outerY = 0;
  const innerY = hsiHeadingBug.height;
  const cutoutApexY = outerY + hsiHeadingBug.cutoutHeight;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(degreesToRadians(rotationDeg));
  context.translate(0, -radius);

  context.fillStyle = altitudeBug.color;
  context.strokeStyle = altitudeBug.color;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-halfWidth, outerY);
  context.lineTo(-halfCutoutWidth, outerY);
  context.lineTo(0, cutoutApexY);
  context.lineTo(halfCutoutWidth, outerY);
  context.lineTo(halfWidth, outerY);
  context.lineTo(halfWidth, innerY);
  context.lineTo(-halfWidth, innerY);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawRotatedImage(
  context: CanvasRenderingContext2D,
  {
    centerX,
    centerY,
    height,
    image,
    rotationDeg,
    width,
  }: {
    centerX: number;
    centerY: number;
    height: number;
    image: HTMLImageElement | undefined;
    rotationDeg: number;
    width: number;
  },
): void {
  if (!isCanvasImageReady(image)) {
    return;
  }

  context.save();
  context.translate(centerX, centerY);
  context.rotate(degreesToRadians(rotationDeg));
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function drawAirspeedTape(
  context: CanvasRenderingContext2D,
  airspeed: PfdDisplayData["airspeed"],
): void {
  const indicatedKt = Math.max(0, airspeed.indicatedKt);
  const projectedKt = indicatedKt + airspeed.trendKt;
  const pixelsPerKt = airspeedTape.height / airspeedTape.viewKt;
  const pointerY = airspeedTape.y + airspeedTape.height / 2;
  const speedToY = (speedKt: number): number =>
    pointerY - (speedKt - indicatedKt) * pixelsPerKt;

  context.save();
  context.beginPath();
  context.rect(
    airspeedTape.x,
    airspeedTape.y,
    airspeedTape.width,
    airspeedTape.height,
  );
  context.clip();

  context.fillStyle = "rgba(6, 92, 153, 0.74)";
  context.fillRect(
    airspeedTape.x,
    airspeedTape.y,
    airspeedTape.width,
    airspeedTape.height,
  );

  drawAirspeedRangeStrip(context, speedToY, indicatedKt);
  drawAirspeedTicks(context, speedToY, indicatedKt);

  context.restore();

  drawAirspeedTrendVector(context, speedToY, airspeed.trendKt, projectedKt);

  context.strokeStyle = "rgba(200, 224, 239, 0.88)";
  context.lineWidth = 2;
  context.strokeRect(
    airspeedTape.x,
    airspeedTape.y,
    airspeedTape.width,
    airspeedTape.height,
  );

  drawAirspeedPointer(context, indicatedKt, projectedKt);
}

function drawTrueAirspeedBox(
  context: CanvasRenderingContext2D,
  trueAirspeedKt: number,
): void {
  const paddingLeft = 3;
  const paddingRight = 1;
  const centerY = trueAirspeedBox.y + trueAirspeedBox.height / 2;
  const ktWidth = 18;
  const valueWidth = 30;
  const ktRightX = trueAirspeedBox.x + trueAirspeedBox.width - paddingRight;
  const valueRightX = ktRightX - ktWidth;

  context.save();
  context.fillStyle = "#050607";
  context.fillRect(
    trueAirspeedBox.x,
    trueAirspeedBox.y,
    trueAirspeedBox.width,
    trueAirspeedBox.height,
  );
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(
    trueAirspeedBox.x,
    trueAirspeedBox.y,
    trueAirspeedBox.width,
    trueAirspeedBox.height,
  );

  context.fillStyle = "#ffffff";
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.font = "800 15px Inter, sans-serif";
  context.fillText("TAS", trueAirspeedBox.x + paddingLeft, centerY, 29);

  context.textAlign = "right";
  context.font =
    "800 17px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.fillText(
    `${Math.round(trueAirspeedKt)}`,
    valueRightX,
    centerY,
    valueWidth,
  );

  context.font = "800 14px Inter, sans-serif";
  context.fillText("KT", ktRightX, centerY, ktWidth);
  context.restore();
}

function drawAltitudeTape(
  context: CanvasRenderingContext2D,
  altitude: PfdDisplayData["altitude"],
): void {
  const indicatedAltitudeFt = Number.isFinite(altitude.altitudeFt)
    ? Math.max(0, altitude.altitudeFt)
    : 0;
  const pixelsPerFt = altitudeTape.height / altitudeTape.viewFt;
  const pointerCenterY = altitudePointer.y + altitudePointer.height / 2;
  const altitudeToY = (altitudeFt: number): number =>
    pointerCenterY - (altitudeFt - indicatedAltitudeFt) * pixelsPerFt;
  const visibleMinFt =
    indicatedAltitudeFt -
    (altitudeTape.y + altitudeTape.height - pointerCenterY) / pixelsPerFt;
  const visibleMaxFt =
    indicatedAltitudeFt + (pointerCenterY - altitudeTape.y) / pixelsPerFt;
  const firstTickFt = Math.max(
    0,
    Math.ceil(visibleMinFt / altitudeTape.minorTickFt) *
      altitudeTape.minorTickFt,
  );
  const lastTickFt =
    Math.floor(visibleMaxFt / altitudeTape.minorTickFt) *
    altitudeTape.minorTickFt;

  context.save();
  context.beginPath();
  context.rect(
    altitudeTape.x,
    altitudeTape.y,
    altitudeTape.width,
    altitudeTape.height,
  );
  context.clip();

  context.fillStyle = "rgba(5, 19, 28, 0.2)";
  context.fillRect(
    altitudeTape.x,
    altitudeTape.y,
    altitudeTape.width,
    altitudeTape.height,
  );

  context.strokeStyle = "#dce2e5";
  context.lineWidth = 2;

  for (
    let tickFt = firstTickFt;
    tickFt <= lastTickFt;
    tickFt += altitudeTape.minorTickFt
  ) {
    const y = altitudeToY(tickFt);
    const isMajorTick = tickFt % altitudeTape.majorTickFt === 0;
    const tickLength = isMajorTick
      ? altitudeTape.majorTickWidth
      : altitudeTape.minorTickWidth;

    context.beginPath();
    context.moveTo(altitudeTape.x, y);
    context.lineTo(altitudeTape.x + tickLength, y);
    context.stroke();

    if (isMajorTick) {
      drawAltitudeValue(context, {
        align: "right",
        altitudeFt: tickFt,
        color: "#dce2e5",
        largeFontPx: selectedAltitudeBox.largeDigitFontPx,
        smallFontPx: selectedAltitudeBox.smallDigitFontPx,
        x: altitudeTape.x + altitudeTape.width - altitudeTape.labelRightPadding,
        y,
      });
    }
  }

  drawAltitudeBug(context, altitude.selectedAltitudeFt, altitudeToY);

  context.restore();

  context.save();
  context.strokeStyle = "rgba(220, 226, 229, 0.9)";
  context.lineWidth = 2;
  context.strokeRect(
    altitudeTape.x,
    altitudeTape.y,
    altitudeTape.width,
    altitudeTape.height,
  );
  context.restore();

  drawAltitudePointer(context, indicatedAltitudeFt);
}

function drawSelectedAltitudeBox(
  context: CanvasRenderingContext2D,
  selectedAltitudeFt: number,
): void {
  context.save();
  context.fillStyle = "#050607";
  context.fillRect(
    selectedAltitudeBox.x,
    selectedAltitudeBox.y,
    selectedAltitudeBox.width,
    selectedAltitudeBox.height,
  );
  context.strokeStyle = "#1f7bb8";
  context.lineWidth = 1;
  context.strokeRect(
    selectedAltitudeBox.x + 0.5,
    selectedAltitudeBox.y + 0.5,
    selectedAltitudeBox.width - 1,
    selectedAltitudeBox.height - 1,
  );

  drawAltitudeValue(context, {
    align: "center",
    altitudeFt: selectedAltitudeFt,
    color: "#5fdcff",
    largeFontPx: selectedAltitudeBox.largeDigitFontPx,
    smallFontPx: selectedAltitudeBox.smallDigitFontPx,
    x: selectedAltitudeBox.x + selectedAltitudeBox.width / 2,
    y: selectedAltitudeBox.y + selectedAltitudeBox.height / 2 + 1,
  });
  context.restore();
}

function drawBarometerBox(
  context: CanvasRenderingContext2D,
  altitude: PfdDisplayData["altitude"],
): void {
  const { unit, value } = formatBarometerValue(
    altitude.barometerInHg,
    altitude.barometerUnit,
  );
  const valueFont = `800 ${barometerBox.valueFontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  const unitFont = `800 ${barometerBox.unitFontPx}px Inter, sans-serif`;
  const centerX = barometerBox.x + barometerBox.width / 2;
  const centerY = barometerBox.y + barometerBox.height / 2 + 1;

  context.save();
  context.fillStyle = "#050607";
  context.fillRect(
    barometerBox.x,
    barometerBox.y,
    barometerBox.width,
    barometerBox.height,
  );
  context.strokeStyle = "rgba(220, 226, 229, 0.85)";
  context.lineWidth = 2;
  context.strokeRect(
    barometerBox.x,
    barometerBox.y,
    barometerBox.width,
    barometerBox.height,
  );

  context.fillStyle = "#8af5ff";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.font = valueFont;
  const valueWidth = context.measureText(value).width;
  context.font = unitFont;
  const unitWidth = context.measureText(unit).width;
  const textX = centerX - (valueWidth + unitWidth) / 2;

  context.font = valueFont;
  context.fillText(value, textX, centerY);
  context.font = unitFont;
  context.fillText(unit, textX + valueWidth, centerY);
  context.restore();
}

function formatBarometerValue(
  barometerInHg: number,
  unit: PfdDisplayData["altitude"]["barometerUnit"],
): {
  unit: "hPa" | "IN";
  value: string;
} {
  if (unit === "hPa") {
    return {
      unit,
      value: Math.round(barometerInHg * 33.8638866667)
        .toString()
        .padStart(4, "0"),
    };
  }

  return {
    unit,
    value: barometerInHg.toFixed(2).padStart(5, "0"),
  };
}

function drawSelectedHeadingBox(
  context: CanvasRenderingContext2D,
  selectedHeadingDeg: number,
): void {
  const centerY = selectedHeadingBox.y + selectedHeadingBox.height / 2;

  context.save();
  context.fillStyle = "#050607";
  context.fillRect(
    selectedHeadingBox.x,
    selectedHeadingBox.y,
    selectedHeadingBox.width,
    selectedHeadingBox.height,
  );
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(
    selectedHeadingBox.x,
    selectedHeadingBox.y,
    selectedHeadingBox.width,
    selectedHeadingBox.height,
  );

  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = `800 ${selectedHeadingBox.labelFontPx}px Inter, sans-serif`;
  context.fillText(
    "HDG",
    selectedHeadingBox.x + selectedHeadingBox.textInset,
    centerY,
  );

  context.textAlign = "right";
  context.fillStyle = "#5fdcff";
  context.font = `800 ${selectedHeadingBox.valueFontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  context.fillText(
    `${formatHeadingValue(selectedHeadingDeg)}º`,
    selectedHeadingBox.x +
      selectedHeadingBox.width -
      selectedHeadingBox.textInset,
    centerY,
  );
  context.restore();
}

function drawSelectedCourseBox(
  context: CanvasRenderingContext2D,
  selectedCourseDeg: number,
  cdiSource: PfdDisplayData["radios"]["cdiSource"],
): void {
  const centerY = selectedCourseBox.y + selectedCourseBox.height / 2;

  context.save();
  context.fillStyle = "#050607";
  context.fillRect(
    selectedCourseBox.x,
    selectedCourseBox.y,
    selectedCourseBox.width,
    selectedCourseBox.height,
  );
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  context.strokeRect(
    selectedCourseBox.x,
    selectedCourseBox.y,
    selectedCourseBox.width,
    selectedCourseBox.height,
  );

  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillStyle = "#ffffff";
  context.font = `800 ${selectedCourseBox.labelFontPx}px Inter, sans-serif`;
  context.fillText(
    "CRS",
    selectedCourseBox.x + selectedCourseBox.textInset,
    centerY,
  );

  context.textAlign = "right";
  context.fillStyle = cdiSource === "GPS" ? "#ff4dff" : "#4be17b";
  context.font = `800 ${selectedCourseBox.valueFontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  context.fillText(
    `${formatHeadingValue(selectedCourseDeg)}º`,
    selectedCourseBox.x + selectedCourseBox.width - selectedCourseBox.textInset,
    centerY,
  );
  context.restore();
}

function drawVerticalSpeedIndicator(
  context: CanvasRenderingContext2D,
  verticalSpeedFpm: number,
): void {
  const geometry = getVerticalSpeedIndicatorGeometry();
  const verticalSpeedToY = (speedFpm: number): number =>
    geometry.centerY -
    (speedFpm / verticalSpeedIndicator.maxFpm) * geometry.scaleHalfHeight;

  context.save();
  drawVerticalSpeedIndicatorBackground(context, geometry);
  drawVerticalSpeedIndicatorTicks(context, verticalSpeedToY);
  drawVerticalSpeedIndicatorOutline(context, geometry);
  drawVerticalSpeedPointer(
    context,
    geometry,
    verticalSpeedFpm,
    verticalSpeedToY,
  );
  context.restore();
}

function getVerticalSpeedIndicatorGeometry(): {
  bottom: number;
  centerY: number;
  lowerRectTop: number;
  right: number;
  scaleBottomY: number;
  scaleHalfHeight: number;
  scaleTopY: number;
  taperTop: number;
  x: number;
  y: number;
} {
  const x = verticalSpeedIndicator.x;
  const y = verticalSpeedIndicator.y;
  const right = x + verticalSpeedIndicator.width;
  const bottom = y + verticalSpeedIndicator.height;
  const taperTop = y + verticalSpeedIndicator.upperRectHeight;
  const centerY = taperTop + verticalSpeedIndicator.taperHeight;
  const lowerRectTop = centerY + verticalSpeedIndicator.taperHeight;
  const scaleTopY = y + verticalSpeedIndicator.taperHeight;
  const scaleBottomY = bottom - verticalSpeedIndicator.taperHeight;

  return {
    bottom,
    centerY,
    lowerRectTop,
    right,
    scaleBottomY,
    scaleHalfHeight: centerY - scaleTopY,
    scaleTopY,
    taperTop,
    x,
    y,
  };
}

function drawVerticalSpeedIndicatorBackground(
  context: CanvasRenderingContext2D,
  geometry: ReturnType<typeof getVerticalSpeedIndicatorGeometry>,
): void {
  context.save();
  context.fillStyle = "rgba(5, 19, 28, 0.08)";
  drawVerticalSpeedIndicatorPath(context, geometry);
  context.fill();
  context.restore();
}

function drawVerticalSpeedIndicatorTicks(
  context: CanvasRenderingContext2D,
  verticalSpeedToY: (speedFpm: number) => number,
): void {
  context.save();
  context.strokeStyle = "#dce2e5";
  context.fillStyle = "#dce2e5";
  context.lineWidth = 2;
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.font = `800 ${verticalSpeedIndicator.majorLabelFontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

  for (
    let speedFpm = -verticalSpeedIndicator.maxFpm;
    speedFpm <= verticalSpeedIndicator.maxFpm;
    speedFpm += verticalSpeedIndicator.minorTickFpm
  ) {
    const isMajorTick =
      Math.abs(speedFpm) === verticalSpeedIndicator.majorTickFpm ||
      Math.abs(speedFpm) === verticalSpeedIndicator.maxFpm;
    const tickWidth = isMajorTick
      ? verticalSpeedIndicator.majorTickWidth
      : verticalSpeedIndicator.minorTickWidth;
    const tickY = verticalSpeedToY(speedFpm);

    context.beginPath();
    context.moveTo(verticalSpeedIndicator.x, tickY);
    context.lineTo(verticalSpeedIndicator.x + tickWidth, tickY);
    context.stroke();

    if (isMajorTick) {
      context.fillText(
        `${Math.abs(speedFpm) / verticalSpeedIndicator.majorTickFpm}`,
        verticalSpeedIndicator.x + verticalSpeedIndicator.width - 7,
        tickY + 1,
        verticalSpeedIndicator.width - tickWidth - 5,
      );
    }
  }

  context.restore();
}

function drawVerticalSpeedIndicatorOutline(
  context: CanvasRenderingContext2D,
  geometry: ReturnType<typeof getVerticalSpeedIndicatorGeometry>,
): void {
  context.save();
  context.strokeStyle = "rgba(220, 226, 229, 0.9)";
  context.lineWidth = 2;
  drawVerticalSpeedIndicatorPath(context, geometry);
  context.stroke();
  context.restore();
}

function drawVerticalSpeedIndicatorPath(
  context: CanvasRenderingContext2D,
  geometry: ReturnType<typeof getVerticalSpeedIndicatorGeometry>,
): void {
  context.beginPath();
  context.moveTo(geometry.x, geometry.y);
  context.lineTo(geometry.right, geometry.y);
  context.lineTo(geometry.right, geometry.taperTop);
  context.lineTo(geometry.x, geometry.centerY);
  context.lineTo(geometry.right, geometry.lowerRectTop);
  context.lineTo(geometry.right, geometry.bottom);
  context.lineTo(geometry.x, geometry.bottom);
  context.closePath();
}

function drawVerticalSpeedPointer(
  context: CanvasRenderingContext2D,
  geometry: ReturnType<typeof getVerticalSpeedIndicatorGeometry>,
  verticalSpeedFpm: number,
  verticalSpeedToY: (speedFpm: number) => number,
): void {
  const finiteVerticalSpeedFpm = Number.isFinite(verticalSpeedFpm)
    ? verticalSpeedFpm
    : 0;
  const pointerCenterY =
    finiteVerticalSpeedFpm > verticalSpeedIndicator.maxFpm
      ? geometry.y
      : finiteVerticalSpeedFpm < -verticalSpeedIndicator.maxFpm
        ? geometry.bottom
        : verticalSpeedToY(finiteVerticalSpeedFpm);
  const triangleHalfHeight = verticalSpeedPointer.triangleHeight / 2;
  const rectangleTop =
    pointerCenterY - verticalSpeedPointer.rectangleHeight / 2;
  const rectangleX =
    verticalSpeedIndicator.x + verticalSpeedPointer.triangleWidth;
  const rectangleRight = rectangleX + verticalSpeedPointer.rectangleWidth;
  const rectangleBottom = rectangleTop + verticalSpeedPointer.rectangleHeight;
  const triangleTop = pointerCenterY - triangleHalfHeight;
  const triangleBottom = pointerCenterY + triangleHalfHeight;

  context.save();
  context.fillStyle = "#050607";
  context.strokeStyle = "rgba(220, 226, 229, 0.9)";
  context.lineWidth = 2;

  context.beginPath();
  context.moveTo(verticalSpeedIndicator.x, pointerCenterY);
  context.lineTo(rectangleX, triangleTop);
  context.lineTo(rectangleX, triangleBottom);
  context.closePath();
  context.fill();

  context.fillRect(
    rectangleX,
    rectangleTop,
    verticalSpeedPointer.rectangleWidth,
    verticalSpeedPointer.rectangleHeight,
  );

  context.beginPath();
  context.moveTo(verticalSpeedIndicator.x, pointerCenterY);
  context.lineTo(rectangleX, triangleTop);
  context.moveTo(verticalSpeedIndicator.x, pointerCenterY);
  context.lineTo(rectangleX, triangleBottom);
  context.moveTo(rectangleX, rectangleTop);
  context.lineTo(rectangleRight, rectangleTop);
  context.moveTo(rectangleX, rectangleBottom);
  context.lineTo(rectangleRight, rectangleBottom);
  context.moveTo(rectangleRight, rectangleTop);
  context.lineTo(rectangleRight, rectangleBottom);
  context.stroke();

  if (Math.abs(finiteVerticalSpeedFpm) > 100) {
    const pointerText = `${
      Math.round(Math.abs(finiteVerticalSpeedFpm) / 10) * 10
    }`;

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `800 ${verticalSpeedPointer.fontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    context.fillText(
      pointerText,
      rectangleX + verticalSpeedPointer.rectangleWidth / 2,
      pointerCenterY + 1,
      verticalSpeedPointer.rectangleWidth - 4,
    );
  }

  context.restore();
}

function drawAltitudeBug(
  context: CanvasRenderingContext2D,
  selectedAltitudeFt: number,
  altitudeToY: (altitudeFt: number) => number,
): void {
  if (!Number.isFinite(selectedAltitudeFt)) {
    return;
  }

  const bugCenterY = altitudeToY(selectedAltitudeFt);

  if (
    bugCenterY < altitudeTape.y ||
    bugCenterY > altitudeTape.y + altitudeTape.height
  ) {
    return;
  }

  const bugTop = bugCenterY - altitudeBug.height / 2;
  const bugBottom = bugTop + altitudeBug.height;
  const bugRight = altitudeBug.x + altitudeBug.width;

  context.save();
  context.fillStyle = altitudeBug.color;
  context.beginPath();
  context.rect(altitudeBug.x, bugTop, altitudeBug.width, altitudeBug.height);
  context.moveTo(altitudeBug.x, bugCenterY);
  context.lineTo(bugRight, bugTop);
  context.lineTo(bugRight, bugBottom);
  context.closePath();
  context.fill("evenodd");

  context.strokeStyle = altitudeBug.color;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(bugRight, bugTop);
  context.lineTo(altitudeBug.x, bugTop);
  context.lineTo(altitudeBug.x, bugBottom);
  context.lineTo(bugRight, bugBottom);
  context.moveTo(altitudeBug.x, bugCenterY);
  context.lineTo(bugRight, bugTop);
  context.moveTo(altitudeBug.x, bugCenterY);
  context.lineTo(bugRight, bugBottom);
  context.stroke();
  context.restore();
}

function drawAltitudePointer(
  context: CanvasRenderingContext2D,
  indicatedAltitudeFt: number,
): void {
  const pointerCenterY = altitudePointer.y + altitudePointer.height / 2;
  const triangleTop = pointerCenterY - altitudePointer.triangleHeight / 2;
  const triangleBottom = triangleTop + altitudePointer.triangleHeight;
  const triangleTipX = altitudePointer.x - altitudePointer.triangleWidth;

  context.save();
  context.fillStyle = "#050607";
  context.beginPath();
  context.moveTo(triangleTipX, pointerCenterY);
  context.lineTo(altitudePointer.x, triangleTop);
  context.lineTo(altitudePointer.x, triangleBottom);
  context.closePath();
  context.fill();
  context.fillRect(
    altitudePointer.x,
    altitudePointer.y,
    altitudePointer.width,
    altitudePointer.height,
  );

  drawAltitudeValue(context, {
    align: "center",
    altitudeFt: indicatedAltitudeFt,
    color: "#ffffff",
    largeFontPx: altitudePointer.largeDigitFontPx,
    smallFontPx: altitudePointer.smallDigitFontPx,
    x: altitudePointer.x + altitudePointer.width / 2,
    y: altitudePointer.y + altitudePointer.height / 2 + 1,
  });
  context.restore();
}

function drawAltitudeValue(
  context: CanvasRenderingContext2D,
  {
    align,
    altitudeFt,
    color,
    largeFontPx,
    smallFontPx,
    x,
    y,
  }: {
    align: "center" | "right";
    altitudeFt: number;
    color: string;
    largeFontPx: number;
    smallFontPx: number;
    x: number;
    y: number;
  },
): void {
  const { largeDigits, smallDigits } = getAltitudeDigits(altitudeFt);
  const largeDigitFont = `800 ${largeFontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  const smallDigitFont = `800 ${smallFontPx}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

  context.save();
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.font = largeDigitFont;

  const largeDigitWidth = context.measureText(largeDigits).width;
  context.font = smallDigitFont;
  const smallDigitWidth = context.measureText(smallDigits).width;
  const textWidth = largeDigitWidth + smallDigitWidth;
  const textX = align === "center" ? x - textWidth / 2 : x - textWidth;

  context.font = largeDigitFont;
  context.fillText(largeDigits, textX, y);
  context.font = smallDigitFont;
  context.fillText(smallDigits, textX + largeDigitWidth, y);
  context.restore();
}

function getAltitudeDigits(altitudeFt: number): {
  largeDigits: string;
  smallDigits: string;
} {
  const roundedAltitudeFt = Math.max(0, Math.round(altitudeFt));

  return {
    largeDigits: Math.floor(roundedAltitudeFt / 100).toString(),
    smallDigits: (roundedAltitudeFt % 100).toString().padStart(2, "0"),
  };
}

function drawAirspeedRangeStrip(
  context: CanvasRenderingContext2D,
  speedToY: (speedKt: number) => number,
  indicatedKt: number,
): void {
  const visibleMinKt = Math.max(
    airspeedRangeLimits.minKt,
    indicatedKt - airspeedTape.viewKt / 2,
  );
  const visibleMaxKt = indicatedKt + airspeedTape.viewKt / 2;
  const stripX = getAirspeedRangeStripX();
  const ranges = [
    {
      color: "#c7242f",
      fromKt: airspeedRangeLimits.minKt,
      toKt: airspeedRangeLimits.lowAwarenessMaxKt,
    },
    {
      color: "#f2f4f5",
      fromKt: airspeedRangeLimits.flapMinKt,
      toKt: airspeedRangeLimits.flapMaxKt,
    },
    {
      color: "#42a859",
      fromKt: airspeedRangeLimits.normalMinKt,
      toKt: airspeedRangeLimits.normalMaxKt,
    },
    {
      color: "#f0dd37",
      fromKt: airspeedRangeLimits.cautionMinKt,
      toKt: airspeedRangeLimits.cautionMaxKt,
    },
    {
      color: "#c7242f",
      fromKt: airspeedRangeLimits.vneKt,
      toKt: Math.max(airspeedRangeLimits.vneKt, visibleMaxKt),
    },
  ];

  for (const range of ranges) {
    const fromKt = Math.max(range.fromKt, visibleMinKt);
    const toKt = Math.min(range.toKt, visibleMaxKt);

    if (toKt <= fromKt) {
      continue;
    }

    const y = speedToY(toKt);
    const height = speedToY(fromKt) - y;

    context.fillStyle = range.color;
    context.fillRect(stripX, y, airspeedTape.rangeStripWidth, height);
  }
}

function drawAirspeedTicks(
  context: CanvasRenderingContext2D,
  speedToY: (speedKt: number) => number,
  indicatedKt: number,
): void {
  const visibleMinKt = Math.max(
    airspeedRangeLimits.minKt,
    indicatedKt - airspeedTape.viewKt / 2,
  );
  const visibleMaxKt = indicatedKt + airspeedTape.viewKt / 2;
  const firstTickKt = Math.ceil(visibleMinKt / 5) * 5;
  const lastTickKt = Math.floor(visibleMaxKt / 5) * 5;
  const tickRightX = airspeedTape.x + airspeedTape.width;
  const labelWidth = 37;
  const labelGap = 9;

  context.fillStyle = "#dce2e5";
  context.strokeStyle = "#dce2e5";
  context.lineWidth = 2;
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.font =
    "800 24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  for (let speedKt = firstTickKt; speedKt <= lastTickKt; speedKt += 5) {
    if (speedKt < airspeedRangeLimits.minKt) {
      continue;
    }

    const isMajorTick = speedKt % 10 === 0;
    const y = speedToY(speedKt);
    const tickLength = isMajorTick ? 20 : 12;
    const tickLeftX = tickRightX - tickLength;

    context.beginPath();
    context.moveTo(tickLeftX, y);
    context.lineTo(tickRightX, y);
    context.stroke();

    if (isMajorTick) {
      context.fillText(`${speedKt}`, tickLeftX - labelGap, y, labelWidth);
    }
  }
}

function drawAirspeedTrendVector(
  context: CanvasRenderingContext2D,
  speedToY: (speedKt: number) => number,
  trendKt: number,
  projectedKt: number,
): void {
  if (!Number.isFinite(trendKt) || Math.abs(trendKt) < 0.1) {
    return;
  }

  const pointerY = airspeedTape.y + airspeedTape.height / 2;
  const trendX = getAirspeedRangeStripX() + airspeedTape.rangeStripWidth + 4;
  const projectedY = Math.max(
    airspeedTape.y,
    Math.min(airspeedTape.y + airspeedTape.height, speedToY(projectedKt)),
  );

  context.strokeStyle = "#ff4dff";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(trendX, pointerY);
  context.lineTo(trendX, projectedY);
  context.stroke();
}

function drawAirspeedPointer(
  context: CanvasRenderingContext2D,
  indicatedKt: number,
  projectedKt: number,
): void {
  const pointerY = airspeedTape.pointerY + airspeedTape.pointerHeight / 2;
  const pointerTipX = airspeedTape.x + airspeedTape.width;
  const pointerBodyRightX =
    getAirspeedRangeStripX() - airspeedTape.pointerGapToRangeStrip;
  const pointerX = pointerBodyRightX - airspeedTape.pointerWidth;
  const pointerTop = airspeedTape.pointerY;
  const pointerBottom = airspeedTape.pointerY + airspeedTape.pointerHeight;
  const hasReachedVne = indicatedKt >= airspeedRangeLimits.vneKt;
  const trendCrossesVne =
    indicatedKt < airspeedRangeLimits.vneKt &&
    projectedKt >= airspeedRangeLimits.vneKt;

  context.save();
  context.fillStyle = hasReachedVne ? "#b81723" : "#242A2B";
  context.beginPath();
  context.moveTo(pointerX, pointerTop);
  context.lineTo(pointerBodyRightX, pointerTop);
  context.lineTo(pointerTipX, pointerY);
  context.lineTo(pointerBodyRightX, pointerBottom);
  context.lineTo(pointerX, pointerBottom);
  context.closePath();
  context.fill();

  context.fillStyle = trendCrossesVne ? "#f0dd37" : "#ffffff";
  context.font =
    "800 26px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillText(
    `${Math.round(indicatedKt)}`,
    pointerBodyRightX - 3,
    pointerY,
    51,
  );
  context.restore();
}

function getAirspeedRangeStripX(): number {
  return airspeedTape.x + airspeedTape.width - airspeedTape.rangeStripWidth;
}

function drawRollScale(
  context: CanvasRenderingContext2D,
  levelHorizonLineY: number,
): void {
  if (!isCanvasImageReady(rollScaleImage)) {
    return;
  }

  const x = rollScale.x - attitudeReferenceX - rollScale.width / 2;
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

function isCanvasImageReady(
  image: HTMLImageElement | undefined,
): image is HTMLImageElement {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
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
