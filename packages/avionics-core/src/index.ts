import type { AvionicsSnapshot } from "@ifg1000/shared";

export function createInitialAvionicsSnapshot(
  timestamp = Date.now(),
): AvionicsSnapshot {
  return {
    timestamp,
    aircraft: {
      altitudeFt: 2500,
      bankDeg: 0,
      groundSpeedKt: 114,
      headingDeg: 274,
      indicatedAirspeedKt: 104,
      latitudeDeg: 37.6188056,
      longitudeDeg: -122.3754167,
      pitchDeg: 2,
      trackDeg: 274,
      trueAirspeedKt: 111,
      verticalSpeedFpm: 0,
    },
    autopilot: {
      altitudeArmed: false,
      altitudeSelectedFt: 3000,
      approachMode: false,
      headingArmed: false,
      headingSelectedDeg: 274,
      master: false,
      verticalSpeedSelectedFpm: 0,
    },
    alerts: [],
  };
}

export type ConnectStateValues = Record<
  string,
  boolean | number | string | undefined
>;

export function normalizeConnectState(
  values: ConnectStateValues,
  previous: AvionicsSnapshot = createInitialAvionicsSnapshot(),
  timestamp = Date.now(),
): AvionicsSnapshot {
  return {
    timestamp,
    aircraft: {
      altitudeFt: readNumber(
        values,
        "aircraft/0/altitude_msl",
        previous.aircraft.altitudeFt,
      ),
      bankDeg: readNumber(
        values,
        "aircraft/0/attitude/bank",
        previous.aircraft.bankDeg,
      ),
      groundSpeedKt: readNumber(
        values,
        "aircraft/0/groundspeed",
        previous.aircraft.groundSpeedKt,
      ),
      headingDeg: readNumber(
        values,
        "aircraft/0/heading",
        previous.aircraft.headingDeg,
      ),
      indicatedAirspeedKt: readNumber(
        values,
        "aircraft/0/airspeed/indicated",
        previous.aircraft.indicatedAirspeedKt,
      ),
      latitudeDeg: readNumber(
        values,
        "aircraft/0/position/latitude",
        previous.aircraft.latitudeDeg,
      ),
      longitudeDeg: readNumber(
        values,
        "aircraft/0/position/longitude",
        previous.aircraft.longitudeDeg,
      ),
      pitchDeg: readNumber(
        values,
        "aircraft/0/attitude/pitch",
        previous.aircraft.pitchDeg,
      ),
      trackDeg: readNumber(
        values,
        "aircraft/0/track",
        previous.aircraft.trackDeg,
      ),
      trueAirspeedKt: readNumber(
        values,
        "aircraft/0/airspeed/true",
        previous.aircraft.trueAirspeedKt,
      ),
      verticalSpeedFpm: readNumber(
        values,
        "aircraft/0/vertical_speed",
        previous.aircraft.verticalSpeedFpm,
      ),
    },
    autopilot: {
      altitudeArmed: readBoolean(
        values,
        "aircraft/0/autopilot/altitude_hold",
        previous.autopilot.altitudeArmed,
      ),
      altitudeSelectedFt: readNumber(
        values,
        "aircraft/0/autopilot/selected_altitude",
        previous.autopilot.altitudeSelectedFt,
      ),
      approachMode: readBoolean(
        values,
        "aircraft/0/autopilot/approach_mode",
        previous.autopilot.approachMode,
      ),
      headingArmed: readBoolean(
        values,
        "aircraft/0/autopilot/heading_hold",
        previous.autopilot.headingArmed,
      ),
      headingSelectedDeg: readNumber(
        values,
        "aircraft/0/autopilot/selected_heading",
        previous.autopilot.headingSelectedDeg,
      ),
      master: readBoolean(
        values,
        "aircraft/0/autopilot/enabled",
        previous.autopilot.master,
      ),
      verticalSpeedSelectedFpm: readNumber(
        values,
        "aircraft/0/autopilot/selected_vertical_speed",
        previous.autopilot.verticalSpeedSelectedFpm,
      ),
    },
    alerts: previous.alerts,
  };
}

function readNumber(
  values: ConnectStateValues,
  path: string,
  fallback: number,
): number {
  const value = values[path];

  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(
  values: ConnectStateValues,
  path: string,
  fallback: boolean,
): boolean {
  const value = values[path];

  return typeof value === "boolean" ? value : fallback;
}
