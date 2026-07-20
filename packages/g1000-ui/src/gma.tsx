import type { ReactElement } from "react";

interface AudioPanelProps {
  onControlInput?: (control: string) => void;
}

const audioRows = [
  ["COM1 MIC", "COM2 MIC"],
  ["COM1", "COM2"],
  ["NAV1", "NAV2"],
  ["DME", "MKR/MUTE"],
  ["ADF", "AUX"],
  ["SPKR", "PA"],
  ["PLAY", "TEL"],
  ["PILOT", "COPLT"],
  ["CREW", "PASS"],
] as const;

export function AudioPanel({ onControlInput }: AudioPanelProps): ReactElement {
  return (
    <article className="gma-panel" aria-label="GMA 1347 audio panel">
      <header>
        <strong>GMA 1347</strong>
        <span>AUDIO PANEL</span>
      </header>

      <div className="gma-annunciators" aria-hidden="true">
        <span className="is-lit" />
        <span />
      </div>

      <div className="gma-button-grid">
        {audioRows.flatMap((row) =>
          row.map((label) => (
            <button key={label} type="button" onClick={() => onControlInput?.(label)}>
              {label}
            </button>
          )),
        )}
      </div>

      <button
        className="gma-red-button"
        type="button"
        onClick={() => onControlInput?.("DISPLAY BACKUP")}
      >
        DISPLAY BACKUP
      </button>

      <footer>
        <span className="gma-knob" />
        <span>VOL / PUSH SQ</span>
      </footer>
    </article>
  );
}

