import { createSocket, type Socket } from "node:dgram";
import { EventEmitter } from "node:events";
import type { AvionicsSnapshot, SimulatorConnectionStatus } from "@ifg1000/shared";

export interface IfConnectClientOptions {
  discoveryPort?: number;
}

export interface ConnectBroadcast {
  address: string;
  aircraft?: string;
  deviceName?: string;
  port?: number;
  version?: string;
}

export class IfConnectClient extends EventEmitter {
  private readonly options: Required<IfConnectClientOptions>;
  private socket: Socket | undefined;
  private status: SimulatorConnectionStatus = {
    phase: "idle",
    message: "Infinite Flight discovery is idle.",
    updatedAt: Date.now(),
  };

  constructor(options: IfConnectClientOptions = {}) {
    super();
    this.options = {
      discoveryPort: options.discoveryPort ?? 15000,
    };
  }

  override on(eventName: "status", listener: (status: SimulatorConnectionStatus) => void): this;
  override on(eventName: "snapshot", listener: (snapshot: AvionicsSnapshot) => void): this;
  override on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  getStatus(): SimulatorConnectionStatus {
    return this.status;
  }

  async startDiscovery(): Promise<SimulatorConnectionStatus> {
    if (this.socket) {
      return this.status;
    }

    const socket = createSocket({ reuseAddr: true, type: "udp4" });
    this.socket = socket;

    socket.on("message", (message, remote) => {
      const broadcast = parseConnectBroadcast(message.toString("utf8"), remote.address);
      const nextStatus: Omit<SimulatorConnectionStatus, "updatedAt"> = {
        phase: "available",
        address: broadcast.address,
        message: "Infinite Flight device broadcast received.",
      };

      if (broadcast.aircraft) {
        nextStatus.aircraft = broadcast.aircraft;
      }

      if (broadcast.deviceName) {
        nextStatus.deviceName = broadcast.deviceName;
      }

      if (broadcast.port) {
        nextStatus.port = broadcast.port;
      }

      if (broadcast.version) {
        nextStatus.version = broadcast.version;
      }

      this.updateStatus(nextStatus);
    });

    socket.on("error", (error) => {
      this.updateStatus({
        phase: "error",
        message: error.message,
      });
      this.closeSocket();
    });

    this.updateStatus({
      phase: "discovering",
      message: `Listening for Infinite Flight broadcasts on UDP ${this.options.discoveryPort}.`,
    });

    await new Promise<void>((resolve, reject) => {
      socket.once("listening", resolve);
      socket.once("error", reject);
      socket.bind(this.options.discoveryPort);
    });

    return this.status;
  }

  stopDiscovery(): SimulatorConnectionStatus {
    this.closeSocket();

    this.updateStatus({
      phase: "idle",
      message: "Infinite Flight discovery is idle.",
    });

    return this.status;
  }

  private closeSocket(): void {
    if (!this.socket) {
      return;
    }

    this.socket.close();
    this.socket = undefined;
  }

  private updateStatus(status: Omit<SimulatorConnectionStatus, "updatedAt">): void {
    this.status = {
      ...status,
      updatedAt: Date.now(),
    };

    this.emit("status", this.status);
  }
}

export function createIfConnectClient(options?: IfConnectClientOptions): IfConnectClient {
  return new IfConnectClient(options);
}

export function parseConnectBroadcast(message: string, remoteAddress: string): ConnectBroadcast {
  const broadcast: ConnectBroadcast = {
    address: readStringField(message, "Address") ?? readFirstAddress(message) ?? remoteAddress,
  };
  const aircraft = readStringField(message, "Aircraft");
  const deviceName = readStringField(message, "DeviceName");
  const port = readNumberField(message, "Port");
  const version = readStringField(message, "Version");

  if (aircraft) {
    broadcast.aircraft = aircraft;
  }

  if (deviceName) {
    broadcast.deviceName = deviceName;
  }

  if (port) {
    broadcast.port = port;
  }

  if (version) {
    broadcast.version = version;
  }

  return broadcast;
}

function readNumberField(message: string, field: string): number | undefined {
  const match = new RegExp(`["']?${field}["']?\\s*:\\s*(\\d+)`, "i").exec(message);
  const value = match?.[1];

  return value ? Number.parseInt(value, 10) : undefined;
}

function readStringField(message: string, field: string): string | undefined {
  const match = new RegExp(`["']?${field}["']?\\s*:\\s*([^,\\]\\n]+)`, "i").exec(message);

  return cleanupField(match?.[1]);
}

function readFirstAddress(message: string): string | undefined {
  const match = /(\d{1,3}(?:\.\d{1,3}){3})/.exec(message);

  return match?.[1];
}

function cleanupField(value: string | undefined): string | undefined {
  const cleaned = value?.trim().replace(/^["']|["']$/g, "");

  return cleaned && cleaned.length > 0 ? cleaned : undefined;
}
