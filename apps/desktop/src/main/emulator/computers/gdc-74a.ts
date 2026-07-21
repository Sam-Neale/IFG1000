import { EMULATOR_DATA_TOPICS, type GDC74AData } from "@ifg1000/shared";

import { IFCClient, ValueConverters, type StateValue } from "ifc-node";
import type { ComputerProgram, ComputerRuntimeContext } from "./types";

const gdcPublishIntervalMs = 50;

export function createGdc74aComputer(
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

    context.log.info("GDC 74A ADC computer connecting to IFC server...");

    connectPromise = client
      .connect()
      .then((connection) => {
        if (stopped) {
          return;
        }

        context.log.info("GDC 74A ADC computer connected to IFC server", {
          aircraft: connection.aircraft.type,
          host: connection.host,
          port: connection.port,
        });

        void publishAirData(context, client);
      })
      .catch((error) => {
        if (!stopped) {
          context.log.error("GDC 74A ADC computer failed to connect", {
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

    void publishAirData(context, client);
  }

  return {
    start() {
      context.log.info("GDC 74A ADC computer online", {
        intervalMs: gdcPublishIntervalMs,
      });

      publishIfConnected();
      publishTimer = setInterval(publishIfConnected, gdcPublishIntervalMs);
    },

    stop() {
      stopped = true;

      if (publishTimer) {
        clearInterval(publishTimer);
        publishTimer = undefined;
      }

      void client.disconnect().catch((error) => {
        context.log.error("GDC 74A ADC computer failed to disconnect", {
          error,
        });
      });

      context.log.info("GDC 74A ADC computer stopped");
    },
  };
}

async function retrieveIfcData(client: IFCClient): Promise<{
  oatC: number;
  indicatedKts: number;
  trueKts: number;
  altitudeFt: number;
  verticalSpeed: number;
}> {
  const [
    oatC,
    indicatedKts,
    trueKts,
    altitudeFt,
    verticalSpeedMetersPerMinute,
  ] = await Promise.all([
    readFiniteNumber(client, "aircraft/0/oat"),
    readFiniteNumber(client, "aircraft/0/indicated_airspeed"),
    readFiniteNumber(client, "aircraft/0/true_airspeed"),
    readFiniteNumber(client, "aircraft/0/altitude_msl"),
    readFiniteNumber(client, "aircraft/0/vertical_speed"),
  ]);

  return {
    oatC,
    indicatedKts: ValueConverters.mpsToKts(indicatedKts),
    trueKts: ValueConverters.mpsToKts(trueKts),
    altitudeFt,
    verticalSpeed: (verticalSpeedMetersPerMinute * 60) / 0.3048, // Convert from m/s to ft/min
  };
}

async function publishAirData(
  context: ComputerRuntimeContext,
  client: IFCClient,
): Promise<void> {
  try {
    const ifData = await retrieveIfcData(client);
    const gdc74aData: GDC74AData = {
      environment: {
        oatC: ifData.oatC,
      },
      airspeed: {
        indicatedKts: ifData.indicatedKts,
        trueAirspeedKt: ifData.trueKts,
      },
      altitude: {
        altitudeFt: ifData.altitudeFt,
        barometerInHg: 29.92,
        barometerUnit: "inHg",
        verticalSpeedFpm: ifData.verticalSpeed,
      },
    };

    context.log.debug(JSON.stringify(gdc74aData), {
      topic: EMULATOR_DATA_TOPICS.gdc74a,
    });

    context.sendBusMessage({
      payload: gdc74aData,
      target: "broadcast",
      topic: EMULATOR_DATA_TOPICS.gdc74a,
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
