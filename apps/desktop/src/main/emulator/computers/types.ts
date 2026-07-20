import type {
  ComputerHostMessage,
  ComputerProcessInfo,
  DisplayRole,
  EmulatorBusMessage,
  PanelInputEvent,
  SupervisorMessage,
} from "@ifg1000/shared";
import type { ComputerLogger } from "./logger";

export type BusMessageDraft = Omit<EmulatorBusMessage, "source"> & {
  source?: EmulatorBusMessage["source"];
};

export interface ComputerRuntimeContext {
  childComputer?: ComputerProcessInfo;
  computer: ComputerProcessInfo;
  log: ComputerLogger;
  send: (message: ComputerHostMessage) => void;
  sendBusMessage: (message: BusMessageDraft) => void;
}

export interface ComputerProgram {
  onBusMessage?: (message: EmulatorBusMessage) => void;
  onDisplayAttached?: (windowId: number, displayRole: DisplayRole) => void;
  onIpcMessage?: (message: SupervisorMessage) => boolean | void;
  onPanelInput?: (input: PanelInputEvent) => void;
  start?: () => void;
  stop?: () => void;
}
