import { describe, expect, it } from "vitest";
import { parseConnectBroadcast } from "./index";

describe("parseConnectBroadcast", () => {
  it("extracts useful Infinite Flight discovery fields", () => {
    const broadcast = parseConnectBroadcast(
      '["State": Playing, "Port": 10112, "DeviceID": iPad7, "Aircraft": Cessna 172, "Version": 25.1.0, "DeviceName": Sam iPad, "Addresses":("192.168.1.26")]',
      "192.168.1.99",
    );

    expect(broadcast).toEqual({
      address: "192.168.1.26",
      aircraft: "Cessna 172",
      deviceName: "Sam iPad",
      port: 10112,
      version: "25.1.0",
    });
  });
});

