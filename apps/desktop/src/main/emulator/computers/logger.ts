import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { EmulatorComputerId } from "@ifg1000/shared";

export type ComputerLogLevel = "debug" | "info" | "warn" | "error";

export class ComputerLogger {
  readonly filePath: string;

  constructor(private readonly computerId: EmulatorComputerId, logDir: string) {
    mkdirSync(logDir, { recursive: true });
    this.filePath = join(logDir, `${computerId}.log`);
  }

  debug(message: string, data?: unknown): void {
    this.write("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.write("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.write("error", message, data);
  }

  private write(level: ComputerLogLevel, message: string, data?: unknown): void {
    const metadata = data === undefined ? "" : ` ${formatLogData(data)}`;
    const line = `${new Date().toISOString()} ${level.toUpperCase()} ${this.computerId} ${message}${metadata}\n`;

    appendFileSync(this.filePath, line);
  }
}

export function createComputerLogger(computerId: EmulatorComputerId): ComputerLogger {
  return new ComputerLogger(computerId, process.env.IFG1000_LOG_DIR ?? join(process.cwd(), "logs"));
}

function formatLogData(data: unknown): string {
  if (data instanceof Error) {
    return JSON.stringify({
      message: data.message,
      name: data.name,
      stack: data.stack,
    });
  }

  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}
