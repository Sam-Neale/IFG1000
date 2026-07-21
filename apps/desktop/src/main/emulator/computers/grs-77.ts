import { EMULATOR_DATA_TOPICS, type GRS77Data } from "@ifg1000/shared";
import { IFCClient, ValueConverters, type StateValue } from "ifc-node";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

const grsPublishIntervalMs = 50;

export function createGrs77Computer(
  context: ComputerRuntimeContext,
): ComputerProgram {
  const client = new IFCClient({
    discoveryTimeout: 20000,
  });
  let connectPromise: Promise<void> | undefined;
  let publishTimer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;

  function connectIfNeeded(): void {
    if (
      stopped ||
      client.isConnected ||
      client.isConnecting ||
      connectPromise
    ) {
      return;
    }

    context.log.info("GRS 77 AHRS computer connecting to IFC server...");

    connectPromise = client
      .connect()
      .then((connection) => {
        if (stopped) {
          return;
        }

        context.log.info("GRS 77 AHRS computer connected to IFC server", {
          aircraft: connection.aircraft.type,
          host: connection.host,
          port: connection.port,
        });

        void publishAttitude(context, client);
      })
      .catch((error) => {
        if (!stopped) {
          context.log.error("GRS 77 AHRS computer failed to connect", {
            error,
          });
        }
      })
      .finally(() => {
        connectPromise = undefined;
      });
  }

  function publishIfConnected(): void {
    if (stopped) {
      return;
    }

    if (!client.isConnected) {
      connectIfNeeded();
      return;
    }

    void publishAttitude(context, client);
  }

  return {
    start() {
      context.log.info("GRS 77 AHRS computer online", {
        intervalMs: grsPublishIntervalMs,
      });

      publishIfConnected();
      publishTimer = setInterval(publishIfConnected, grsPublishIntervalMs);
    },

    stop() {
      stopped = true;

      if (publishTimer) {
        clearInterval(publishTimer);
        publishTimer = undefined;
      }

      void client.disconnect().catch((error) => {
        context.log.error("GRS 77 AHRS computer failed to disconnect", {
          error,
        });
      });

      context.log.info("GRS 77 AHRS computer stopped");
    },
  };
}

async function retrieveIfcData(client: IFCClient): Promise<{
  pitchDeg: number;
  rollDeg: number;
  headingDeg: number;
  turnRateDegPerSec: number;
}> {
  const [pitchRad, bankRad, headingMagneticRad, turnRateRadPerSec] =
    await Promise.all([
      readFiniteNumber(client, "aircraft/0/pitch"),
      readFiniteNumber(client, "aircraft/0/bank"),
      readFiniteNumber(client, "aircraft/0/heading_magnetic"),
      readFiniteNumber(client, "aircraft/0/turn_rate"),
    ]);

  return {
    pitchDeg: ValueConverters.radToDeg(pitchRad),
    rollDeg: ValueConverters.radToDeg(bankRad),
    headingDeg: ValueConverters.radToDeg(headingMagneticRad),
    turnRateDegPerSec: ValueConverters.radToDeg(turnRateRadPerSec),
  };
}

async function publishAttitude(
  context: ComputerRuntimeContext,
  client: IFCClient,
): Promise<void> {
  try {
    const ifData = await retrieveIfcData(client);
    const grs77Data: GRS77Data = {
      attitude: {
        pitchDeg: ifData.pitchDeg,
        rollDeg: ifData.rollDeg,
        slipSkidDeflection: 0,
      },
      heading: {
        currentDeg: ifData.headingDeg,
        turnRateDegPerSec: ifData.turnRateDegPerSec,
      },
    };

    context.log.debug(JSON.stringify(grs77Data), {
      topic: EMULATOR_DATA_TOPICS.grs77,
    });

    context.sendBusMessage({
      payload: grs77Data,
      target: "broadcast",
      topic: EMULATOR_DATA_TOPICS.grs77,
    });
  } catch (error) {
    context.log.error("Error retrieving data from IFC server", { error });
  }
}

async function readFiniteNumber(
  client: IFCClient,
  statePath: string,
): Promise<number> {
  return normalizeStateNumber(await client.get(statePath), statePath);
}

function normalizeStateNumber(value: StateValue, statePath: string): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "bigint"
        ? Number(value)
        : typeof value === "string"
          ? Number.parseFloat(value)
          : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    throw new Error(`IFC state ${statePath} did not return a finite number.`);
  }

  return numberValue;
}
