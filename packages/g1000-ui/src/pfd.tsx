import type { CSSProperties, ReactElement } from "react";

interface PrimaryFlightDisplayProps {
  displayRole: "pfd" | "mfd";
  frameSrc: string;
}

const frameWidth = 1452;
const frameHeight = 948;

const displayCanvas = {
  height: 793,
  width: 1056,
  x: 197,
  y: 48,
} as const;

export function PrimaryFlightDisplay({
  displayRole,
  frameSrc,
}: PrimaryFlightDisplayProps): ReactElement {
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
        aria-label="Primary flight display canvas"
        id={`g1000-svg-panel__canvas-${displayRole}`}
        height={displayCanvas.height}
        width={displayCanvas.width}
        style={displayCanvasStyle}
      ></canvas>
    </article>
  );
}

const displayCanvasStyle: CSSProperties = {
  background: "#05070a",
  display: "block",
  height: `${(displayCanvas.height / frameHeight) * 100}%`,
  left: `${(displayCanvas.x / frameWidth) * 100}%`,
  pointerEvents: "none",
  position: "absolute",
  top: `${(displayCanvas.y / frameHeight) * 100}%`,
  width: `${(displayCanvas.width / frameWidth) * 100}%`,
};
