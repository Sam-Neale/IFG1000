# Emulator Processes

The desktop app supervises one OS process per emulated G1000 computer/LRU. Root computers run as Electron utility processes so macOS treats them as helper processes instead of separate Dock apps. Each process sets `process.title`, so the runtime is identifiable in process inspection tools as `IFG1000 <unit>`.

## Supervisor

`apps/desktop/src/main/index.ts` is the Electron supervisor. It starts the root computer processes through `ComputerSupervisor`, creates the UI windows, and routes panel input and bus messages between computers.

## Computer Host

`apps/desktop/src/main/computer-host.ts` is the single computer-process entry point. The supervisor starts seven root utility processes:

- `IFG1000 GDU 1044B PFD`
- `IFG1000 GDU 1044B MFD`
- `IFG1000 GDC 74A`
- `IFG1000 GRS 77`
- `IFG1000 GMU 44`
- `IFG1000 GTX 33`
- `IFG1000 GEA 71`

The two GDU root processes each fork one child computer process:

- `IFG1000 GDU 1044B PFD` forks `IFG1000 GIA 63W #1`
- `IFG1000 GDU 1044B MFD` forks `IFG1000 GIA 63W #2`

The host marks itself ready, loads the matching computer module from `apps/desktop/src/main/emulator/computers/`, and forwards process IPC into that module. Utility-process IPC uses `process.parentPort`; nested GIA children can still use the Node-style `process.send` fallback. The current modules are boilerplate state-machine shells with lifecycle logging, GDU key-input handling, and placeholder bus output where the device is currently output-only.

## Computer Modules

Each emulated computer has its own TypeScript file:

- `gdu-1044b-pfd.ts`
- `gdu-1044b-mfd.ts`
- `gia-63w-1.ts`
- `gia-63w-2.ts`
- `gdc-74a.ts`
- `grs-77.ts`
- `gmu-44.ts`
- `gtx-33.ts`
- `gea-71.ts`

`factory.ts` maps the process ID to the matching module. `types.ts` defines the lifecycle and IPC hooks each module can implement. `logger.ts` writes a separate log file for each process.

## Windows

At app startup the supervisor creates:

- PFD window: `panel=gdu-1044b&role=pfd`
- MFD window: `panel=gdu-1044b&role=mfd`
- GMA 1347 panel window: `panel=gma-1347`

The PFD window attaches to the `IFG1000 GDU 1044B PFD` process. The MFD window attaches to the `IFG1000 GDU 1044B MFD` process. The GMA 1347 currently exists as a panel window, not as a spawned computer process.

## Process Hierarchy

The process tree is:

- `IFG1000 GDU 1044B PFD` -> `IFG1000 GIA 63W #1`
- `IFG1000 GDU 1044B MFD` -> `IFG1000 GIA 63W #2`
- `IFG1000 GDC 74A`
- `IFG1000 GRS 77`
- `IFG1000 GMU 44`
- `IFG1000 GTX 33`
- `IFG1000 GEA 71`

That means the supervisor starts seven root processes. The two GDU processes each fork one child GIA process, for nine emulated computer processes total.

`GDC 74A`, `GRS 77`, and `GMU 44` are modeled as output-only computers for now. `GTX 33` and `GEA 71` stay on the bidirectional bus path and can send/retrieve data from other emulator computers as those device models become real.

## Logs

The Electron supervisor passes `app.getPath("userData")/computer-logs` to the computer processes as `IFG1000_LOG_DIR`. On macOS development runs, that is typically:

`~/Library/Application Support/@ifg1000/desktop/computer-logs`

Each computer writes to its own file:

- `gdu-1044b-pfd.log`
- `gdu-1044b-mfd.log`
- `gia-63w-1.log`
- `gia-63w-2.log`
- `gdc-74a.log`
- `grs-77.log`
- `gmu-44.log`
- `gtx-33.log`
- `gea-71.log`

## Bus

The bus topology lives in `apps/desktop/src/main/emulator/topology.ts`. It now mirrors the clarified process hierarchy: each GDU owns its own GIA child, shared output LRUs publish into the GIA side, and bidirectional LRUs use routed bus messages.
