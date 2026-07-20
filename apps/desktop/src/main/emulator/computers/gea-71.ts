import type { EmulatorComputerId } from "@ifg1000/shared";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGea71Computer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    onBusMessage(message) {
      context.log.info("Received engine/airframe IPC bus message", {
        source: message.source,
        topic: message.topic,
      });

      if (message.topic.endsWith("/request")) {
        sendEngineAirframeState(context, message.source);
      }
    },

    start() {
      context.log.info("GEA 71 engine/airframe computer online", {
        mode: "bidirectional-ipc",
      });

      sendEngineAirframeState(context, "broadcast");
    },

    stop() {
      context.log.info("GEA 71 engine/airframe computer stopped");
    },
  };
}

function sendEngineAirframeState(
  context: ComputerRuntimeContext,
  target: EmulatorComputerId | "broadcast",
): void {
  context.log.debug("Sending placeholder engine/airframe state", {
    target,
  });

  context.sendBusMessage({
    payload: {
      busVolts: null,
      engineRpm: null,
      fuelQuantityGal: null,
      oilPressurePsi: null,
    },
    target,
    topic: "engine-airframe/state",
  });
}
