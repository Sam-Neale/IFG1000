import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGrs77Computer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    start() {
      context.log.info("GRS 77 AHRS computer online", {
        mode: "output-only",
      });

      publishAttitude(context);
    },

    stop() {
      context.log.info("GRS 77 AHRS computer stopped");
    },
  };
}

function publishAttitude(context: ComputerRuntimeContext): void {
  context.log.debug("Publishing placeholder AHRS output");

  context.sendBusMessage({
    payload: {
      bankDeg: null,
      pitchDeg: null,
      rateOfTurnDegPerSec: null,
      slipSkid: null,
    },
    target: "broadcast",
    topic: "ahrs/output",
  });
}
