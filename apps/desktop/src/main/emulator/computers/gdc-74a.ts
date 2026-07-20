import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGdc74aComputer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    start() {
      context.log.info("GDC 74A ADC computer online", {
        mode: "output-only",
      });

      publishAirData(context);
    },

    stop() {
      context.log.info("GDC 74A ADC computer stopped");
    },
  };
}

function publishAirData(context: ComputerRuntimeContext): void {
  context.log.debug("Publishing placeholder ADC output");

  context.sendBusMessage({
    payload: {
      altitudeFt: null,
      indicatedAirspeedKt: null,
      verticalSpeedFpm: null,
    },
    target: "broadcast",
    topic: "adc/output",
  });
}
