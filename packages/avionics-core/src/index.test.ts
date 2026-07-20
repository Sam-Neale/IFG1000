import { describe, expect, it } from "vitest";
import { createInitialAvionicsSnapshot, normalizeConnectState } from "./index";

describe("normalizeConnectState", () => {
  it("merges known Connect state values into the avionics snapshot", () => {
    const previous = createInitialAvionicsSnapshot(1);
    const snapshot = normalizeConnectState(
      {
        "aircraft/0/altitude_msl": 3200,
        "aircraft/0/attitude/bank": -12.5,
        "aircraft/0/autopilot/enabled": true,
        "aircraft/0/autopilot/selected_heading": 180,
      },
      previous,
      2,
    );

    expect(snapshot.timestamp).toBe(2);
    expect(snapshot.aircraft.altitudeFt).toBe(3200);
    expect(snapshot.aircraft.bankDeg).toBe(-12.5);
    expect(snapshot.autopilot.master).toBe(true);
    expect(snapshot.autopilot.headingSelectedDeg).toBe(180);
    expect(snapshot.aircraft.indicatedAirspeedKt).toBe(previous.aircraft.indicatedAirspeedKt);
  });
});

