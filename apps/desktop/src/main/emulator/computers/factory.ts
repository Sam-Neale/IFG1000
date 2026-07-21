import type { ComputerProgram, ComputerRuntimeContext } from "./types";
import { createGdc74aComputer } from "./gdc-74a";
import { createGdu1044bComputer } from "./gdu-1044b";
import { createGea71Computer } from "./gea-71";
import { createGia63wComputer } from "./gia-63w";
import { createGmu44Computer } from "./gmu-44";
import { createGrs77Computer } from "./grs-77";
import { createGtx33Computer } from "./gtx-33";

export function createComputerProgram(context: ComputerRuntimeContext): ComputerProgram {
  const id = context.computer.id;

  switch (id) {
    case "gdu-1044b-pfd":
    case "gdu-1044b-mfd":
      return createGdu1044bComputer(context);
    case "gia-63w-1":
    case "gia-63w-2":
      return createGia63wComputer(context);
    case "gdc-74a":
      return createGdc74aComputer(context);
    case "grs-77":
      return createGrs77Computer(context);
    case "gmu-44":
      return createGmu44Computer(context);
    case "gtx-33":
      return createGtx33Computer(context);
    case "gea-71":
      return createGea71Computer(context);
    default: {
      const unhandled: never = id;
      throw new Error(`No computer program registered for ${unhandled}`);
    }
  }
}
