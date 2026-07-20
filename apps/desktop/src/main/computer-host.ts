import {
  type ComputerHostMessage,
  type ComputerProcessInfo,
  type EmulatorBusMessage,
  type EmulatorComputerId,
  type SupervisorMessage,
} from "@ifg1000/shared";
import { fork, type ChildProcess } from "node:child_process";
import { createComputerProgram } from "./emulator/computers/factory";
import { createComputerLogger } from "./emulator/computers/logger";
import type { BusMessageDraft, ComputerRuntimeContext } from "./emulator/computers/types";

const computer = readComputerInfo();
const childComputer = readChildComputerInfo();
const logger = createComputerLogger(computer.id);
const runtimeContext: ComputerRuntimeContext = {
  computer,
  log: logger,
  send,
  sendBusMessage,
};
let childProcess: ChildProcess | undefined;

if (childComputer) {
  runtimeContext.childComputer = childComputer;
}

const program = createComputerProgram(runtimeContext);
const parentPort = process.parentPort ?? null;

process.title = computer.processTitle;
logger.info("Computer host process starting", {
  childComputer: childComputer?.id,
  logFile: logger.filePath,
  pid: process.pid,
  ppid: process.ppid,
  title: process.title,
});

send({
  computer,
  timestamp: Date.now(),
  type: "computer-ready",
});

program.start?.();

if (childComputer) {
  childProcess = spawnChildComputer(childComputer);
}

registerParentMessageHandler((message) => {
  logger.debug("Supervisor IPC message received", {
    type: message.type,
  });

  if (program.onIpcMessage?.(message)) {
    return;
  }

  if (message.type === "attach-display-window" && isGduComputer(computer.id)) {
    program.onDisplayAttached?.(message.windowId, message.displayRole);
    return;
  }

  if (message.type === "panel-input") {
    program.onPanelInput?.(message.input);
    return;
  }

  if (message.type === "bus-message") {
    if (message.message.target === computer.id || message.message.target === "broadcast") {
      program.onBusMessage?.(message.message);
    }

    forwardBusMessageToChild(message);
  }
});

function forwardBusMessageToChild(message: SupervisorMessage): void {
  if (message.type !== "bus-message" || !childComputer || !childProcess?.connected) {
    return;
  }

  if (message.message.target === childComputer.id || message.message.target === "broadcast") {
    logger.debug("Forwarding bus message to child computer", {
      childComputer: childComputer.id,
      source: message.message.source,
      topic: message.message.topic,
    });
    childProcess.send(message);
  }
}

function spawnChildComputer(child: ComputerProcessInfo): ChildProcess {
  const hostPath = process.env.IFG1000_COMPUTER_HOST_PATH ?? process.argv[1];

  if (!hostPath) {
    throw new Error("GDU computer host cannot spawn child GIA without a host path.");
  }

  logger.info("Spawning child computer process", {
    childComputer: child.id,
    hostPath,
  });

  const spawned = fork(hostPath, [], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      IFG1000_COMPUTER_ID: child.id,
      IFG1000_COMPUTER_LABEL: child.label,
      IFG1000_COMPUTER_PROCESS_TITLE: child.processTitle,
      IFG1000_CHILD_COMPUTER_ID: "",
      IFG1000_CHILD_COMPUTER_LABEL: "",
      IFG1000_CHILD_COMPUTER_PROCESS_TITLE: "",
    },
    execPath: process.execPath,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  spawned.stdout?.on("data", (data: Buffer) => {
    logger.info("Child stdout", {
      childComputer: child.id,
      output: data.toString().trim(),
    });
  });

  spawned.stderr?.on("data", (data: Buffer) => {
    logger.error("Child stderr", {
      childComputer: child.id,
      output: data.toString().trim(),
    });
  });

  spawned.on("message", (message: ComputerHostMessage) => {
    logger.debug("Child IPC message received", {
      childComputer: child.id,
      type: message.type,
    });
    send(message);
  });

  spawned.on("exit", (code, signal) => {
    logger.warn("Child computer process exited", {
      childComputer: child.id,
      code,
      signal,
    });

    send({
      message: {
        payload: { code, signal },
        source: child.id,
        target: "broadcast",
        topic: "computer/exited",
      },
      timestamp: Date.now(),
      type: "bus-message",
    });
  });

  return spawned;
}

function readComputerInfo(): ComputerProcessInfo {
  const id = process.env.IFG1000_COMPUTER_ID as EmulatorComputerId | undefined;
  const label = process.env.IFG1000_COMPUTER_LABEL;
  const processTitle = process.env.IFG1000_COMPUTER_PROCESS_TITLE;

  if (!id || !label || !processTitle) {
    throw new Error("Computer host started without IFG1000 computer metadata.");
  }

  return {
    id,
    label,
    processTitle,
  };
}

function readChildComputerInfo(): ComputerProcessInfo | undefined {
  const id = process.env.IFG1000_CHILD_COMPUTER_ID as EmulatorComputerId | undefined;
  const label = process.env.IFG1000_CHILD_COMPUTER_LABEL;
  const processTitle = process.env.IFG1000_CHILD_COMPUTER_PROCESS_TITLE;

  if (!id || !label || !processTitle) {
    return undefined;
  }

  return {
    id,
    label,
    processTitle,
  };
}

function isGduComputer(id: EmulatorComputerId): boolean {
  return id === "gdu-1044b-pfd" || id === "gdu-1044b-mfd";
}

function sendBusMessage(message: BusMessageDraft): void {
  const busMessage: EmulatorBusMessage = {
    source: message.source ?? computer.id,
    target: message.target,
    topic: message.topic,
  };

  if ("payload" in message) {
    busMessage.payload = message.payload;
  }

  send({
    message: busMessage,
    timestamp: Date.now(),
    type: "bus-message",
  });
}

function send(message: unknown): void {
  if (parentPort) {
    parentPort.postMessage(message);
    return;
  }

  if (process.send) {
    process.send(message);
  }
}

function registerParentMessageHandler(listener: (message: SupervisorMessage) => void): void {
  if (parentPort) {
    parentPort.on("message", (event) => {
      listener(event.data as SupervisorMessage);
    });
    return;
  }

  process.on("message", (message) => {
    listener(message as SupervisorMessage);
  });
}

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

process.on("disconnect", () => {
  logger.info("Supervisor IPC disconnected");
  program.stop?.();
  childProcess?.kill();
});
