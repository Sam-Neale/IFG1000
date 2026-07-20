import type { AvionicsSnapshot } from "@ifg1000/shared";
import type { ReactElement } from "react";

interface MultiFunctionDisplayProps {
  snapshot: AvionicsSnapshot;
}

export function MultiFunctionDisplay({ snapshot }: MultiFunctionDisplayProps): ReactElement {
  const { aircraft } = snapshot;

  return (
    <article className="g1000-display" aria-label="Multi-function display">
      <header className="g1000-display__header">
        <span className="g1000-display__title">MFD</span>
        <span className="g1000-display__status">TRK {formatDegrees(aircraft.trackDeg)}</span>
      </header>

      <div className="g1000-display__screen">
        <div className="mfd-map">
          <div className="mfd-map__data">
            <span>GS {Math.round(aircraft.groundSpeedKt)} KT</span>
            <span>TAS {Math.round(aircraft.trueAirspeedKt)} KT</span>
            <span>LAT {aircraft.latitudeDeg.toFixed(5)}</span>
            <span>LON {aircraft.longitudeDeg.toFixed(5)}</span>
          </div>
          <div
            className="mfd-map__aircraft"
            style={{ transform: `translate(-50%, -50%) rotate(${aircraft.trackDeg}deg)` }}
          />
        </div>
      </div>

      <footer className="g1000-display__footer">
        <span>MAP</span>
        <span>RNG 10 NM</span>
      </footer>
    </article>
  );
}

function formatDegrees(value: number): string {
  return Math.round(value).toString().padStart(3, "0");
}
