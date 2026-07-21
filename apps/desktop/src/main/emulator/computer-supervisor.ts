import { BrowserWindow, utilityProcess, type UtilityProcess } from "electron";
import { EventEmitter } from "node:events";
import { join } from "node:path";
import {
  type ComputerEvent,
  type ComputerHostMessage,
  type DisplayRole,
  type EmulatorBusMessage,
  type EmulatorComputerId,
  type PanelInputEvent,
  type SupervisorMessage,
} from "@ifg1000/shared";
import {
  childComputerByParent,
  defaultBusRoutes,
  emulatorComputerById,
  gduComputerByDisplayRole,
  parentComputerByChild,
  supervisorRootComputerIds,
} from "./topology";

interface ComputerRuntime {
  child: UtilityProcess;
  id: EmulatorComputerId;
}

interface DisplayWindowAttachment {
  displayRole: DisplayRole;
  windowId: number;
}

export class ComputerSupervisor extends EventEmitter {
  private readonly displayAttachments = new Map<
    EmulatorComputerId,
    DisplayWindowAttachment
  >();
  private readonly runtimes = new Map<EmulatorComputerId, ComputerRuntime>();
  private readonly hostPath = join(__dirname, "computer-host.js");

  override on(eventName: "event", listener: (event: ComputerEvent) => void): this;
  override on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  start(logDir: string): void {
    for (const computerId of supervisorRootComputerIds) {
      const computer = emulatorComputerById.get(computerId);

      if (!computer) {
        continue;
      }

      if (this.runtimes.has(computer.id)) {
        continue;
      }

      const childComputerId = childComputerByParent.get(computer.id);
      const childComputer = childComputerId ? emulatorComputerById.get(childComputerId) : undefined;

      const child = utilityProcess.fork(this.hostPath, [], {
        env: {
          ...process.env,
          IFG1000_COMPUTER_HOST_PATH: this.hostPath,
          IFG1000_COMPUTER_ID: computer.id,
          IFG1000_COMPUTER_LABEL: computer.label,
          IFG1000_LOG_DIR: logDir,
          IFG1000_COMPUTER_PROCESS_TITLE: computer.processTitle,
          ...(childComputer
            ? {
                IFG1000_CHILD_COMPUTER_ID: childComputer.id,
                IFG1000_CHILD_COMPUTER_LABEL: childComputer.label,
                IFG1000_CHILD_COMPUTER_PROCESS_TITLE: childComputer.processTitle,
              }
            : {}),
        },
        serviceName: computer.processTitle,
        stdio: "pipe",
      });

      child.stdout?.on("data", (data: Buffer) => {
        console.log(`[${computer.id}] ${data.toString().trim()}`);
      });

      child.stderr?.on("data", (data: Buffer) => {
        console.error(`[${computer.id}] ${data.toString().trim()}`);
      });

      child.on("message", (message: ComputerHostMessage) => {
        this.handleHostMessage(message);
      });

      child.on("exit", (code) => {
        this.runtimes.delete(computer.id);
        this.emit("event", {
          message: {
            payload: { code },
            source: computer.id,
            target: "broadcast",
            topic: "computer/exited",
          },
          timestamp: Date.now(),
          type: "bus-message",
        } satisfies ComputerHostMessage);
      });

      this.runtimes.set(computer.id, {
        child,
        id: computer.id,
      });
    }
  }

  stop(): void {
    for (const runtime of this.runtimes.values()) {
      runtime.child.kill();
    }

    this.runtimes.clear();
  }

  attachDisplayWindow(window: BrowserWindow, displayRole: DisplayRole): void {
    const computerId = gduComputerByDisplayRole[displayRole];

    this.displayAttachments.set(computerId, {
      displayRole,
      windowId: window.id,
    });

    window.once("closed", () => {
      const attachment = this.displayAttachments.get(computerId);

      if (attachment?.windowId === window.id) {
        this.displayAttachments.delete(computerId);
      }
    });

    this.sendDisplayAttachment(computerId);
  }

  dispatchPanelInput(input: PanelInputEvent): void {
    this.emit("event", {
      input,
      type: "panel-input",
    } satisfies ComputerEvent);

    if (input.panel !== "gdu-1044b" || !input.displayRole) {
      return;
    }

    this.send(gduComputerByDisplayRole[input.displayRole], {
      input,
      type: "panel-input",
    });
  }

  private handleHostMessage(message: ComputerHostMessage): void {
    this.emit("event", message);

    if (message.type === "computer-ready") {
      this.sendDisplayAttachment(message.computer.id);
      return;
    }

    if (message.type === "bus-message") {
      this.routeBusMessage(message.message);
    }
  }

  private routeBusMessage(message: EmulatorBusMessage): void {
    const targets =
      message.target === "broadcast" ? defaultBusRoutes[message.source] : [message.target];

    for (const target of targets) {
      const routedMessage: EmulatorBusMessage =
        message.target === "broadcast" ? { ...message, target } : message;

      this.send(target, {
        message: routedMessage,
        type: "bus-message",
      });
    }
  }

  private send(target: EmulatorComputerId, message: SupervisorMessage): void {
    const runtime = this.runtimes.get(parentComputerByChild.get(target) ?? target);

    if (!runtime?.child.pid) {
      return;
    }

    runtime.child.postMessage(message);
  }

  private sendDisplayAttachment(computerId: EmulatorComputerId): void {
    const attachment = this.displayAttachments.get(computerId);

    if (!attachment) {
      return;
    }

    this.send(computerId, {
      ...attachment,
      type: "attach-display-window",
    });
  }
}
