# Architecture

## Boundaries

The app is split into three runtime layers:

1. Electron main process: owns windows, native APIs, Infinite Flight discovery, and socket connections.
2. Electron preload: exposes a small typed API to the renderer with `contextBridge`.
3. Renderer: draws the PFD/MFD and emits user intent through typed commands.

Domain behavior lives outside Electron in `packages/avionics-core`. That package should be able to run in unit tests, command-line replays, and the desktop app without knowing where simulator state came from.

## Data Flow

```text
Infinite Flight Connect
  -> packages/if-connect
  -> packages/avionics-core
  -> Electron main IPC
  -> preload bridge
  -> React renderer
  -> packages/g1000-ui
```

## First Milestones

1. Parse the Infinite Flight Connect manifest and map required state paths.
2. Poll a minimal flight-state set: attitude, heading, altitude, airspeed, vertical speed, location, autopilot modes.
3. Record connect sessions to `test-fixtures/connect-recordings`.
4. Drive the PFD from replay fixtures.
5. Add command dispatch for softkeys, knobs, CDI source, and autopilot controls.

