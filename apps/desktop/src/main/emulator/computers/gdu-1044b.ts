import {
  EMULATOR_DATA_TOPICS,
  type DisplayRole,
  type EmulatorBusMessage,
  type EmulatorComputerId,
  type PanelInputEvent,
} from "@ifg1000/shared";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

interface Gdu1044bRoleConfig {
  displayRole: DisplayRole;
  label: "PFD" | "MFD";
}

export function createGdu1044bComputer(
  context: ComputerRuntimeContext,
): ComputerProgram {
  const role = getGdu1044bRoleConfig(context.computer.id);
  let displayWindowId: number | undefined;

  return {
    onBusMessage(message) {
      context.log.debug("Received display bus message", {
        source: message.source,
        topic: message.topic,
      });

      if (
        shouldForwardToDisplayRenderer(message) &&
        displayWindowId !== undefined
      ) {
        context.log.debug("Forwarding bus message to display renderer", {
          source: message.source,
          topic: message.topic,
          windowId: displayWindowId,
        });

        context.send({
          computerId: context.computer.id,
          displayRole: role.displayRole,
          message,
          timestamp: Date.now(),
          type: "display-bus-message",
          windowId: displayWindowId,
        });
      }
    },

    onDisplayAttached(windowId, displayRole) {
      if (displayRole !== role.displayRole) {
        context.log.warn("Ignoring mismatched renderer attachment role", {
          expectedDisplayRole: role.displayRole,
          receivedDisplayRole: displayRole,
          windowId,
        });
        return;
      }

      displayWindowId = windowId;

      context.log.info(`${role.label} renderer attached`, {
        displayRole: role.displayRole,
        windowId,
      });

      context.send({
        computerId: context.computer.id,
        displayRole: role.displayRole,
        renderMode: role.displayRole,
        timestamp: Date.now(),
        type: "display-renderer-ready",
        windowId,
      });
    },

    onPanelInput(input) {
      handleGduKeyInput(context, role, input);
    },

    start() {
      context.log.info(`${role.label} GDU 1044B computer online`, {
        childComputer: context.childComputer?.id,
        displayRole: role.displayRole,
      });
    },

    stop() {
      context.log.info(`${role.label} GDU 1044B computer stopped`);
    },
  };
}

function shouldForwardToDisplayRenderer(message: EmulatorBusMessage): boolean {
  return (
    message.source === "gdc-74a" &&
    message.topic === EMULATOR_DATA_TOPICS.gdc74a
  );
}

function getGdu1044bRoleConfig(id: EmulatorComputerId): Gdu1044bRoleConfig {
  switch (id) {
    case "gdu-1044b-pfd":
      return {
        displayRole: "pfd",
        label: "PFD",
      };
    case "gdu-1044b-mfd":
      return {
        displayRole: "mfd",
        label: "MFD",
      };
    default:
      throw new Error(`GDU 1044B computer cannot run as ${id}.`);
  }
}

function handleGduKeyInput(
  context: ComputerRuntimeContext,
  role: Gdu1044bRoleConfig,
  input: PanelInputEvent,
): void {
  context.log.info(`Received ${role.label} key input`, {
    action: input.action,
    control: input.control,
    direction: input.direction,
    windowId: input.windowId,
  });

  context.sendBusMessage({
    payload: {
      action: input.action,
      control: input.control,
      ...(input.direction ? { direction: input.direction } : {}),
      displayRole: role.displayRole,
      panel: input.panel,
      timestamp: input.timestamp,
    },
    target: context.childComputer?.id ?? "broadcast",
    topic: "gdu/key-input",
  });
}
