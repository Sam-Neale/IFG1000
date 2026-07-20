# IFG1000

Infinite Flight powered G1000-style avionics emulator built with Electron, TypeScript, and React.

## Project Shape

- `apps/desktop` contains the Electron application.
- `packages/if-connect` owns Infinite Flight Connect discovery and socket integration.
- `packages/avionics-core` owns the pure avionics state model and simulator-state normalization.
- `packages/g1000-ui` owns reusable PFD/MFD display components.
- `packages/navdata` is reserved for airports, waypoints, procedures, and map data.
- `packages/shared` contains shared IPC contracts, display types, and simulator state types.
- `docs/reference` contains manuals and external reference material.
- `test-fixtures/connect-recordings` is for recorded Infinite Flight sessions that can be replayed without the simulator.

## Development

```sh
npm install
npm run dev
```

The desktop app starts with a synthetic avionics snapshot. Infinite Flight discovery is exposed through the Electron main process and can be expanded inside `packages/if-connect`.

## Architecture

Electron native access, network sockets, and simulator discovery stay in the main process. The renderer receives narrow, typed APIs from `apps/desktop/src/preload` and renders state from `packages/avionics-core`.

That keeps the G1000 behavior testable outside Electron and prevents the UI layer from depending directly on local network or desktop APIs.

The emulator runtime is process-based: Electron supervises separate child processes for each G1000 computer/LRU and labels them with `process.title`. See `docs/emulator-processes.md`.
