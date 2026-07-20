import type { ComputerProgram, ComputerRuntimeContext } from "./types";

export function createGmu44Computer(context: ComputerRuntimeContext): ComputerProgram {
  return {
    start() {
      context.log.info("GMU 44 magnetometer computer online", {
        mode: "output-only",
      });

      publishHeading(context);
    },

    stop() {
      context.log.info("GMU 44 magnetometer computer stopped");
    },
  };
}

function publishHeading(context: ComputerRuntimeContext): void {
  context.log.debug("Publishing placeholder magnetometer output");

  context.sendBusMessage({
    payload: {
      magneticHeadingDeg: null,
    },
    target: "grs-77",
    topic: "magnetometer/output",
  });
}
