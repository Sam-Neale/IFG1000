import {
  EMULATOR_DATA_TOPICS,
  createPlaceholderGIA63WData,
  type CdiSource,
  type CourseToFrom,
  type DisplayRole,
  type EmulatorComputerId,
  type GDC74AData,
  type GIA63WData,
  type NavPhase,
  type NavSignalType,
  type PanelInputDirection,
  type PanelInputEvent,
} from "@ifg1000/shared";
import { IFCClient, ValueConverters, type StateValue } from "ifc-node";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

const giaPublishIntervalMs = 500;
const airspeedTrendProjectionSeconds = 6;
const airspeedTrendWindowMs = 1000;
const minimumAirspeedTrendWindowMs = 250;
const courseInputStepDeg = 1;
const navDeflectionFullScaleRatio = 2 / 3;
const metersPerNauticalMile = 1852;
const navCourseStatePaths = {
  NAV1: "aircraft/0/systems/nav_sources/nav/1/course",
  NAV2: "aircraft/0/systems/nav_sources/nav/2/course",
} as const;
const navHorizontalDeflectionRatioStatePaths = {
  NAV1: "aircraft/0/systems/nav_sources/nav/1/horizontal_deflection_ratio",
  NAV2: "aircraft/0/systems/nav_sources/nav/2/horizontal_deflection_ratio",
} as const;
const navToFromIndicatorStatePaths = {
  NAV1: "aircraft/0/systems/nav_sources/nav/1/to_from_indicator_state",
  NAV2: "aircraft/0/systems/nav_sources/nav/2/to_from_indicator_state",
} as const;
const gpsXtrackDistanceStatePath =
  "aircraft/0/systems/nav_sources/gps/xtrack_distance";
const gpsFullScaleDeflectionNmByPhase: Record<NavPhase, number> = {
  "LNAV + V": 1,
  "L/VNAV": 1,
  DPRT: 0.3,
  ENR: 2,
  LNAV: 1,
  LP: 1,
  LPV: 1,
  MAPR: 0.3,
  OCN: 4,
  TERM: 1,
};

interface Gia63wRoleConfig {
  displayRole: DisplayRole;
  label: "No. 1" | "No. 2";
  parentGdu: "gdu-1044b-pfd" | "gdu-1044b-mfd";
}

interface AirspeedTrendSample {
  indicatedKts: number;
  timestampMs: number;
}

type NavCourseSource = Exclude<CdiSource, "GPS">;

interface CdiCourseMemory {
  GPS: number;
  NAV1: number;
  NAV2: number;
}

interface CdiDeviationMemory {
  GPS: number;
  NAV1: number;
  NAV2: number;
}

interface CdiToFromMemory {
  GPS: CourseToFrom;
  NAV1: CourseToFrom;
  NAV2: CourseToFrom;
}

interface GduInputPayload {
  action: PanelInputEvent["action"];
  control: string;
  direction?: PanelInputDirection;
}

export function createGia63wComputer(
  context: ComputerRuntimeContext,
): ComputerProgram {
  const role = getGia63wRoleConfig(context.computer.id);
  const client = new IFCClient({
    discoveryTimeout: 20000,
  });
  const storedData = createStoredGiaData();
  const courseMemory = createCdiCourseMemory(
    storedData.heading.desiredTrackDeg,
  );
  const deviationMemory = createCdiDeviationMemory(
    storedData.navMaster.courseDeviation,
  );
  const toFromMemory = createCdiToFromMemory(storedData.navMaster.courseToFrom);
  const airspeedTrendSamples: AirspeedTrendSample[] = [];
  let connectPromise: Promise<void> | undefined;
  let publishTimer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;

  function connectIfNeeded(): void {
    if (
      stopped ||
      client.isConnected ||
      client.isConnecting ||
      connectPromise
    ) {
      return;
    }

    context.log.info(`${role.label} GIA 63W IAU connecting to IFC server...`);

    connectPromise = client
      .connect()
      .then((connection) => {
        if (stopped) {
          return;
        }

        context.log.info(`${role.label} GIA 63W IAU connected to IFC server`, {
          aircraft: connection.aircraft.type,
          host: connection.host,
          port: connection.port,
        });

        void publishLiveGiaData(
          context,
          role,
          client,
          storedData,
          courseMemory,
          deviationMemory,
          toFromMemory,
        );
      })
      .catch((error) => {
        if (!stopped) {
          context.log.error(`${role.label} GIA 63W IAU failed to connect`, {
            error,
          });
        }
      })
      .finally(() => {
        connectPromise = undefined;
      });
  }

  function publishIfConnected(): void {
    if (stopped) {
      return;
    }

    if (!client.isConnected) {
      storedData.IFConnect.ifDataValid = false;
      publishStoredGiaData(context, role, storedData);
      connectIfNeeded();
      return;
    }

    void publishLiveGiaData(
      context,
      role,
      client,
      storedData,
      courseMemory,
      deviationMemory,
      toFromMemory,
    );
  }

  return {
    onBusMessage(message) {
      context.log.debug("Received IAU IPC bus message", {
        source: message.source,
        topic: message.topic,
      });

      if (
        message.source === "gdc-74a" &&
        message.topic === EMULATOR_DATA_TOPICS.gdc74a
      ) {
        const airData = readGdc74aData(message.payload);

        if (airData) {
          applyAirData(storedData, airData, airspeedTrendSamples, Date.now());
          context.log.debug("Updated IAU air-data input", {
            altitudeFt: airData.altitude.altitudeFt,
            indicatedKts: airData.airspeed.indicatedKts,
            trendKt: storedData.airspeed.trendKt,
          });
        } else {
          context.log.warn("Ignoring malformed GDC 74A air-data payload");
        }

        return;
      }

      if (message.topic === "gdu/key-input") {
        void processGduInput(
          context,
          role,
          client,
          storedData,
          courseMemory,
          deviationMemory,
          toFromMemory,
          message.payload,
        );
      }
    },

    start() {
      context.log.info(`${role.label} GIA 63W IAU computer online`, {
        parentGdu: role.parentGdu,
      });

      publishStoredGiaData(context, role, storedData);
      publishIfConnected();
      publishTimer = setInterval(publishIfConnected, giaPublishIntervalMs);
    },

    stop() {
      stopped = true;

      if (publishTimer) {
        clearInterval(publishTimer);
        publishTimer = undefined;
      }

      void client.disconnect().catch((error) => {
        context.log.error(`${role.label} GIA 63W IAU failed to disconnect`, {
          error,
        });
      });

      context.log.info(`${role.label} GIA 63W IAU computer stopped`);
    },
  };
}

function getGia63wRoleConfig(id: EmulatorComputerId): Gia63wRoleConfig {
  switch (id) {
    case "gia-63w-1":
      return {
        displayRole: "pfd",
        label: "No. 1",
        parentGdu: "gdu-1044b-pfd",
      };
    case "gia-63w-2":
      return {
        displayRole: "mfd",
        label: "No. 2",
        parentGdu: "gdu-1044b-mfd",
      };
    default:
      throw new Error(`GIA 63W computer cannot run as ${id}.`);
  }
}

function createStoredGiaData(): GIA63WData {
  const storedData = createPlaceholderGIA63WData();

  storedData.airspeed.trendKt = 0;
  storedData.environment.isaC = 0;
  storedData.heading.desiredTrackDeg = 0;
  storedData.IFConnect.ifDataValid = false;

  return storedData;
}

function createCdiCourseMemory(initialCourseDeg: number): CdiCourseMemory {
  const courseDeg = normalizeCourseDegrees(initialCourseDeg);

  return {
    GPS: courseDeg,
    NAV1: courseDeg,
    NAV2: courseDeg,
  };
}

function createCdiDeviationMemory(
  initialCourseDeviation: number,
): CdiDeviationMemory {
  const courseDeviation = normalizeCourseDeviation(initialCourseDeviation);

  return {
    GPS: courseDeviation,
    NAV1: courseDeviation,
    NAV2: courseDeviation,
  };
}

function createCdiToFromMemory(
  initialCourseToFrom: CourseToFrom,
): CdiToFromMemory {
  return {
    GPS: initialCourseToFrom,
    NAV1: initialCourseToFrom,
    NAV2: initialCourseToFrom,
  };
}

async function retrieveIfcData(client: IFCClient): Promise<{
  bugKt: number;
  gpsXtrackDistanceMeters: number;
  selectedAltitudeFt: number;
  selectedHeadingDeg: number;
  nav1: {
    activeFreqMHz: number;
    courseDeg: number;
    courseToFrom: CourseToFrom | undefined;
    horizontalDeflectionRatio: number;
    signalType: NavSignalType;
  };
  nav2: {
    activeFreqMHz: number;
    courseDeg: number;
    courseToFrom: CourseToFrom | undefined;
    horizontalDeflectionRatio: number;
    signalType: NavSignalType;
  };
}> {
  const [
    autopilotSpeedTargetMetersPerSecond,
    selectedAltitudeMeters,
    selectedHeadingDeg,
    nav1ActiveFreqMHz,
    nav1HasGlideslope,
    nav1HasLocalizer,
    nav1CourseRad,
    nav1HorizontalDeflectionRatio,
    nav1ToFromIndicatorState,
    nav2ActiveFreqMHz,
    nav2HasGlideslope,
    nav2HasLocalizer,
    nav2CourseRad,
    nav2HorizontalDeflectionRatio,
    nav2ToFromIndicatorState,
    gpsXtrackDistanceMeters,
  ] = await Promise.all([
    readFiniteNumber(client, "aircraft/0/systems/autopilot/spd/target"),
    readFiniteNumber(client, "aircraft/0/systems/autopilot/alt/target"),
    readFiniteNumber(client, "aircraft/0/systems/autopilot/hdg/target"),
    readFiniteNumber(client, "aircraft/0/systems/nav_sources/nav/1/frequency"),
    readBooleanState(
      client,
      "aircraft/0/systems/nav_sources/nav/1/has_glideslope",
    ),
    readBooleanState(
      client,
      "aircraft/0/systems/nav_sources/nav/1/has_localizer",
    ),
    readFiniteNumber(client, navCourseStatePaths.NAV1),
    readFiniteNumber(client, navHorizontalDeflectionRatioStatePaths.NAV1),
    readFiniteNumber(client, navToFromIndicatorStatePaths.NAV1),
    readFiniteNumber(client, "aircraft/0/systems/nav_sources/nav/2/frequency"),
    readBooleanState(
      client,
      "aircraft/0/systems/nav_sources/nav/2/has_glideslope",
    ),
    readBooleanState(
      client,
      "aircraft/0/systems/nav_sources/nav/2/has_localizer",
    ),
    readFiniteNumber(client, navCourseStatePaths.NAV2),
    readFiniteNumber(client, navHorizontalDeflectionRatioStatePaths.NAV2),
    readFiniteNumber(client, navToFromIndicatorStatePaths.NAV2),
    readFiniteNumber(client, gpsXtrackDistanceStatePath),
  ]);

  return {
    bugKt: ValueConverters.mpsToKts(autopilotSpeedTargetMetersPerSecond),
    gpsXtrackDistanceMeters,
    selectedAltitudeFt: selectedAltitudeMeters * 3.28084, // Convert from meters to feet
    selectedHeadingDeg: normalizeDegrees(
      ValueConverters.radToDeg(selectedHeadingDeg),
    ),
    nav1: {
      activeFreqMHz: nav1ActiveFreqMHz / 100,
      courseDeg: normalizeCourseDegrees(
        ValueConverters.radToDeg(nav1CourseRad),
      ),
      courseToFrom: readNavCourseToFrom(nav1ToFromIndicatorState),
      horizontalDeflectionRatio: nav1HorizontalDeflectionRatio,
      signalType: readNavSignalType(nav1HasLocalizer, nav1HasGlideslope),
    },
    nav2: {
      activeFreqMHz: nav2ActiveFreqMHz / 100,
      courseDeg: normalizeCourseDegrees(
        ValueConverters.radToDeg(nav2CourseRad),
      ),
      courseToFrom: readNavCourseToFrom(nav2ToFromIndicatorState),
      horizontalDeflectionRatio: nav2HorizontalDeflectionRatio,
      signalType: readNavSignalType(nav2HasLocalizer, nav2HasGlideslope),
    },
  };
}

async function publishLiveGiaData(
  context: ComputerRuntimeContext,
  role: Gia63wRoleConfig,
  client: IFCClient,
  storedData: GIA63WData,
  courseMemory: CdiCourseMemory,
  deviationMemory: CdiDeviationMemory,
  toFromMemory: CdiToFromMemory,
): Promise<void> {
  storedData.IFConnect.ifDataValid = client.isConnected;

  try {
    const ifData = await retrieveIfcData(client);

    storedData.airspeed.bugKt = ifData.bugKt;
    storedData.altitude.selectedAltitudeFt = ifData.selectedAltitudeFt;
    storedData.heading.selectedDeg = ifData.selectedHeadingDeg;
    storedData.nav1.activeFreqMHz = ifData.nav1.activeFreqMHz;
    courseMemory.NAV1 = ifData.nav1.courseDeg;
    if (ifData.nav1.courseToFrom) {
      toFromMemory.NAV1 = ifData.nav1.courseToFrom;
    }
    deviationMemory.NAV1 = normalizeNavDeflectionRatio(
      ifData.nav1.horizontalDeflectionRatio,
    );
    storedData.nav1.signalType = ifData.nav1.signalType;
    storedData.nav2.activeFreqMHz = ifData.nav2.activeFreqMHz;
    courseMemory.NAV2 = ifData.nav2.courseDeg;
    if (ifData.nav2.courseToFrom) {
      toFromMemory.NAV2 = ifData.nav2.courseToFrom;
    }
    deviationMemory.NAV2 = normalizeNavDeflectionRatio(
      ifData.nav2.horizontalDeflectionRatio,
    );
    storedData.nav2.signalType = ifData.nav2.signalType;
    deviationMemory.GPS = normalizeGpsXtrackDeviation(
      ifData.gpsXtrackDistanceMeters,
      storedData.navMaster.navPhase,
    );
    updateDisplayedCourse(storedData, courseMemory);
    updateDisplayedCourseDeviation(storedData, deviationMemory);
    updateDisplayedCourseToFrom(storedData, toFromMemory);
  } catch (error) {
    context.log.error("Error retrieving GIA 63W data from IFC server", {
      error,
    });
  }

  publishStoredGiaData(context, role, storedData);
}

function publishStoredGiaData(
  context: ComputerRuntimeContext,
  role: Gia63wRoleConfig,
  storedData: GIA63WData,
): void {
  storedData.systemTime = new Date();

  context.sendBusMessage({
    payload: storedData,
    target: role.parentGdu,
    topic: EMULATOR_DATA_TOPICS.gia63w,
  });
}

async function processGduInput(
  context: ComputerRuntimeContext,
  role: Gia63wRoleConfig,
  client: IFCClient,
  storedData: GIA63WData,
  courseMemory: CdiCourseMemory,
  deviationMemory: CdiDeviationMemory,
  toFromMemory: CdiToFromMemory,
  payload: unknown,
): Promise<void> {
  const input = readGduInputPayload(payload);
  const handled =
    input !== undefined
      ? await applyGduInput(
          context,
          role,
          client,
          storedData,
          courseMemory,
          deviationMemory,
          toFromMemory,
          input,
        )
      : false;

  context.log.debug(
    `Processed ${role.displayRole.toUpperCase()} GDU key input`,
    {
      action: input?.action,
      control: input?.control,
      direction: input?.direction,
      handled,
    },
  );

  context.sendBusMessage({
    payload: {
      action: input?.action,
      control: input?.control,
      ...(input?.direction ? { direction: input.direction } : {}),
      handledBy: context.computer.id,
      handled,
    },
    target: role.parentGdu,
    topic: "iau/key-input-ack",
  });
}

async function applyGduInput(
  context: ComputerRuntimeContext,
  role: Gia63wRoleConfig,
  client: IFCClient,
  storedData: GIA63WData,
  courseMemory: CdiCourseMemory,
  deviationMemory: CdiDeviationMemory,
  toFromMemory: CdiToFromMemory,
  input: GduInputPayload,
): Promise<boolean> {
  const direction = input.direction;

  if (input.action === "press" && input.control === "CDI") {
    storedData.navMaster.cdiSource = getNextCdiSource(
      storedData.navMaster.cdiSource,
    );
    updateDisplayedCourse(storedData, courseMemory);
    updateDisplayedCourseDeviation(storedData, deviationMemory);
    updateDisplayedCourseToFrom(storedData, toFromMemory);
    publishStoredGiaData(context, role, storedData);

    return true;
  }

  if (
    input.action === "turn" &&
    input.control === "CRS/BARO knob" &&
    direction
  ) {
    await applyCourseTurnInput(context, client, storedData, courseMemory, {
      ...input,
      direction,
    });
    publishStoredGiaData(context, role, storedData);

    return true;
  }

  return false;
}

async function applyCourseTurnInput(
  context: ComputerRuntimeContext,
  client: IFCClient,
  storedData: GIA63WData,
  courseMemory: CdiCourseMemory,
  input: GduInputPayload & { direction: PanelInputDirection },
): Promise<void> {
  const source = storedData.navMaster.cdiSource;
  const stepDeg =
    input.direction === "clockwise" ? courseInputStepDeg : -courseInputStepDeg;
  const nextCourseDeg = normalizeCourseDegrees(
    getCourseForSource(courseMemory, source) + stepDeg,
  );

  setCourseForSource(courseMemory, source, nextCourseDeg);
  updateDisplayedCourse(storedData, courseMemory);

  if (source === "GPS" || !client.isConnected) {
    return;
  }

  try {
    await writeNavCourse(client, source, nextCourseDeg);
  } catch (error) {
    context.log.error("Failed to write NAV course to IFC server", {
      courseDeg: nextCourseDeg,
      error,
      source,
    });
  }
}

function readGduInputPayload(payload: unknown): GduInputPayload | undefined {
  const data = readRecord(payload);
  const action = data?.action;
  const control = data?.control;
  const direction = data?.direction;

  if (
    (action !== "press" && action !== "release" && action !== "turn") ||
    typeof control !== "string"
  ) {
    return undefined;
  }

  return {
    action,
    control,
    ...(isPanelInputDirection(direction) ? { direction } : {}),
  };
}

function isPanelInputDirection(value: unknown): value is PanelInputDirection {
  return value === "clockwise" || value === "counterclockwise";
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

function getCourseForSource(
  courseMemory: CdiCourseMemory,
  source: CdiSource,
): number {
  return courseMemory[source];
}

function setCourseForSource(
  courseMemory: CdiCourseMemory,
  source: CdiSource,
  courseDeg: number,
): void {
  courseMemory[source] = courseDeg;
}

function updateDisplayedCourse(
  storedData: GIA63WData,
  courseMemory: CdiCourseMemory,
): void {
  storedData.heading.desiredTrackDeg = getCourseForSource(
    courseMemory,
    storedData.navMaster.cdiSource,
  );
}

function getCourseDeviationForSource(
  deviationMemory: CdiDeviationMemory,
  source: CdiSource,
): number {
  return deviationMemory[source];
}

function updateDisplayedCourseDeviation(
  storedData: GIA63WData,
  deviationMemory: CdiDeviationMemory,
): void {
  storedData.navMaster.courseDeviation = getCourseDeviationForSource(
    deviationMemory,
    storedData.navMaster.cdiSource,
  );
}

function getCourseToFromForSource(
  toFromMemory: CdiToFromMemory,
  source: CdiSource,
): CourseToFrom {
  return toFromMemory[source];
}

function updateDisplayedCourseToFrom(
  storedData: GIA63WData,
  toFromMemory: CdiToFromMemory,
): void {
  storedData.navMaster.courseToFrom = getCourseToFromForSource(
    toFromMemory,
    storedData.navMaster.cdiSource,
  );
}

function normalizeNavDeflectionRatio(deflectionRatio: number): number {
  return normalizeCourseDeviation(
    deflectionRatio / navDeflectionFullScaleRatio,
  );
}

function normalizeGpsXtrackDeviation(
  xtrackDistanceMeters: number,
  navPhase: NavPhase,
): number {
  const fullScaleMeters =
    gpsFullScaleDeflectionNmByPhase[navPhase] * metersPerNauticalMile;

  if (!Number.isFinite(fullScaleMeters) || fullScaleMeters <= 0) {
    return 0;
  }

  return normalizeCourseDeviation(xtrackDistanceMeters / fullScaleMeters);
}

function normalizeCourseDeviation(courseDeviation: number): number {
  if (!Number.isFinite(courseDeviation)) {
    return 0;
  }

  return Math.max(-1, Math.min(1, courseDeviation));
}

function readNavCourseToFrom(indicatorState: number): CourseToFrom | undefined {
  if (indicatorState === 1) {
    return "TO";
  }

  if (indicatorState === 2) {
    return "FROM";
  }

  return undefined;
}

async function writeNavCourse(
  client: IFCClient,
  source: NavCourseSource,
  courseDeg: number,
): Promise<void> {
  await client.set(
    navCourseStatePaths[source],
    ValueConverters.degToRad(courseDeg),
  );
}

function normalizeCourseDegrees(degrees: number): number {
  return normalizeDegrees(degrees);
}

function calculateIsaDeviationC(airData: GDC74AData): number {
  const isaTemperatureC = 15 - 2 * (airData.altitude.altitudeFt / 1000);

  return Math.round(airData.environment.oatC - isaTemperatureC);
}

function applyAirData(
  storedData: GIA63WData,
  airData: GDC74AData,
  airspeedTrendSamples: AirspeedTrendSample[],
  timestampMs: number,
): void {
  storedData.environment.isaC = calculateIsaDeviationC(airData);
  storedData.airspeed.trendKt = calculateAirspeedTrendKt(
    airspeedTrendSamples,
    airData.airspeed.indicatedKts,
    timestampMs,
  );
}

function calculateAirspeedTrendKt(
  airspeedTrendSamples: AirspeedTrendSample[],
  indicatedKts: number,
  timestampMs: number,
): number {
  airspeedTrendSamples.push({ indicatedKts, timestampMs });

  const oldestTimestampMs = timestampMs - airspeedTrendWindowMs;

  while (
    airspeedTrendSamples.length > 1 &&
    (airspeedTrendSamples[1]?.timestampMs ?? timestampMs) <= oldestTimestampMs
  ) {
    airspeedTrendSamples.shift();
  }

  const baseline = airspeedTrendSamples[0];

  if (!baseline) {
    return 0;
  }

  const elapsedMs = timestampMs - baseline.timestampMs;

  if (elapsedMs < minimumAirspeedTrendWindowMs) {
    return 0;
  }

  const airspeedChangeKt = indicatedKts - baseline.indicatedKts;
  const airspeedRateKtPerSec = airspeedChangeKt / (elapsedMs / 1000);

  return airspeedRateKtPerSec * airspeedTrendProjectionSeconds;
}

async function readFiniteNumber(
  client: IFCClient,
  statePath: string,
): Promise<number> {
  return normalizeStateNumber(await client.get(statePath), statePath);
}

async function readBooleanState(
  client: IFCClient,
  statePath: string,
): Promise<boolean> {
  return normalizeStateBoolean(await client.get(statePath), statePath);
}

function normalizeStateNumber(value: StateValue, statePath: string): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "bigint"
        ? Number(value)
        : typeof value === "string"
          ? Number.parseFloat(value)
          : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    throw new Error(`IFC state ${statePath} did not return a finite number.`);
  }

  return numberValue;
}

function normalizeStateBoolean(value: StateValue, statePath: string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 0 || value === 1) {
      return value === 1;
    }
  }

  if (typeof value === "bigint") {
    if (value === 0n || value === 1n) {
      return value === 1n;
    }
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0") {
      return false;
    }
  }

  throw new Error(`IFC state ${statePath} did not return a boolean value.`);
}

function readNavSignalType(
  hasLocalizer: boolean,
  hasGlideslope: boolean,
): NavSignalType {
  if (hasLocalizer && hasGlideslope) {
    return "ILS";
  }

  if (hasLocalizer) {
    return "LOC";
  }

  if (hasGlideslope) {
    return "GS";
  }

  return "VOR";
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function readGdc74aData(payload: unknown): GDC74AData | undefined {
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
  const barometerUnit = altitude?.barometerUnit;
  const verticalSpeedFpm = altitude
    ? readNumber(altitude.verticalSpeedFpm)
    : undefined;

  if (
    oatC === undefined ||
    indicatedKts === undefined ||
    trueAirspeedKt === undefined ||
    altitudeFt === undefined ||
    barometerInHg === undefined ||
    (barometerUnit !== "hPa" && barometerUnit !== "inHg") ||
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
