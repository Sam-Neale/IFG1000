import type { PanelInputEvent } from "@ifg1000/shared";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGdu1044bMfdComputer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    onBusMessage(message) {
      context.log.debug("Received display bus message", {
        source: message.source,
        topic: message.topic,
      });
    },

    onDisplayAttached(windowId, displayRole) {
      context.log.info("MFD renderer attached", {
        displayRole,
        windowId,
      });

      context.send({
        computerId: context.computer.id,
        displayRole,
        renderMode: "mfd",
        timestamp: Date.now(),
        type: "display-renderer-ready",
        windowId,
      });
    },

    onPanelInput(input) {
      handleGduKeyInput(context, input);
    },

    start() {
      context.log.info("MFD GDU 1044B computer online", {
        childComputer: context.childComputer?.id,
      });
    },

    stop() {
      context.log.info("MFD GDU 1044B computer stopped");
    },
  };
}

function handleGduKeyInput(context: ComputerRuntimeContext, input: PanelInputEvent): void {
  context.log.info("Received MFD key input", {
    action: input.action,
    control: input.control,
    windowId: input.windowId,
  });

  context.sendBusMessage({
    payload: {
      action: input.action,
      control: input.control,
      displayRole: "mfd",
      panel: input.panel,
      timestamp: input.timestamp,
    },
    target: context.childComputer?.id ?? "broadcast",
    topic: "gdu/key-input",
  });
}
