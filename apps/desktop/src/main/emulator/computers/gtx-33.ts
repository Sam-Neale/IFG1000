import type { EmulatorComputerId } from "@ifg1000/shared";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGtx33Computer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    onBusMessage(message) {
      context.log.info("Received transponder IPC bus message", {
        source: message.source,
        topic: message.topic,
      });

      if (message.topic.endsWith("/request")) {
        sendTransponderState(context, message.source);
      }
    },

    start() {
      context.log.info("GTX 33 transponder computer online", {
        mode: "bidirectional-ipc",
      });

      sendTransponderState(context, "broadcast");
    },

    stop() {
      context.log.info("GTX 33 transponder computer stopped");
    },
  };
}

function sendTransponderState(
  context: ComputerRuntimeContext,
  target: EmulatorComputerId | "broadcast",
): void {
  context.log.debug("Sending placeholder transponder state", {
    target,
  });

  context.sendBusMessage({
    payload: {
      code: null,
      identActive: false,
      mode: "standby",
    },
    target,
    topic: "transponder/state",
  });
}
