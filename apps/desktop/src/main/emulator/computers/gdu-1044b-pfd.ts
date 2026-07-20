import type { PanelInputEvent } from "@ifg1000/shared";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGdu1044bPfdComputer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    onBusMessage(message) {
      context.log.debug("Received display bus message", {
        source: message.source,
        topic: message.topic,
      });
    },

    onDisplayAttached(windowId, displayRole) {
      context.log.info("PFD renderer attached", {
        displayRole,
        windowId,
      });

      context.send({
        computerId: context.computer.id,
        displayRole,
        renderMode: "pfd",
        timestamp: Date.now(),
        type: "display-renderer-ready",
        windowId,
      });
    },

    onPanelInput(input) {
      handleGduKeyInput(context, input);
    },

    start() {
      context.log.info("PFD GDU 1044B computer online", {
        childComputer: context.childComputer?.id,
      });
    },

    stop() {
      context.log.info("PFD GDU 1044B computer stopped");
    },
  };
}

function handleGduKeyInput(context: ComputerRuntimeContext, input: PanelInputEvent): void {
  context.log.info("Received PFD key input", {
    action: input.action,
    control: input.control,
    windowId: input.windowId,
  });

  context.sendBusMessage({
    payload: {
      action: input.action,
      control: input.control,
      displayRole: "pfd",
      panel: input.panel,
      timestamp: input.timestamp,
    },
    target: context.childComputer?.id ?? "broadcast",
    topic: "gdu/key-input",
  });
}
