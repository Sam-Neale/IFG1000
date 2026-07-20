import type { PanelInputEvent } from "@ifg1000/shared";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

const parentGdu = "gdu-1044b-pfd";

export function createGia63w1Computer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    onBusMessage(message) {
      context.log.info("Received IAU IPC bus message", {
        source: message.source,
        topic: message.topic,
      });

      if (message.topic === "gdu/key-input") {
        acknowledgeGduInput(context, message.payload);
      }
    },

    start() {
      context.log.info("No. 1 GIA 63W IAU computer online", {
        parentGdu,
      });
    },

    stop() {
      context.log.info("No. 1 GIA 63W IAU computer stopped");
    },
  };
}

function acknowledgeGduInput(context: ComputerRuntimeContext, payload: unknown): void {
  const input = payload as Partial<PanelInputEvent>;

  context.log.debug("Processed PFD GDU key input", {
    action: input.action,
    control: input.control,
  });

  context.sendBusMessage({
    payload: {
      action: input.action,
      control: input.control,
      handledBy: context.computer.id,
    },
    target: parentGdu,
    topic: "iau/key-input-ack",
  });
}
