import type { ComputerProcessInfo, EmulatorComputerId } from "@ifg1000/shared";

export const emulatorComputers: ComputerProcessInfo[] = [
  {
    id: "gdu-1044b-pfd",
    label: "PFD GDU 1044B Display Computer",
    processTitle: "IFG1000 GDU 1044B PFD",
  },
  {
    id: "gdu-1044b-mfd",
    label: "MFD GDU 1044B Display Computer",
    processTitle: "IFG1000 GDU 1044B MFD",
  },
  {
    id: "gia-63w-1",
    label: "No. 1 GIA 63W Integrated Avionics Unit",
    processTitle: "IFG1000 GIA 63W #1",
  },
  {
    id: "gia-63w-2",
    label: "No. 2 GIA 63W Integrated Avionics Unit",
    processTitle: "IFG1000 GIA 63W #2",
  },
  {
    id: "gdc-74a",
    label: "GDC 74A Air Data Computer",
    processTitle: "IFG1000 GDC 74A",
  },
  {
    id: "grs-77",
    label: "GRS 77 AHRS",
    processTitle: "IFG1000 GRS 77",
  },
  {
    id: "gmu-44",
    label: "GMU 44 Magnetometer",
    processTitle: "IFG1000 GMU 44",
  },
  {
    id: "gtx-33",
    label: "GTX 33 Transponder",
    processTitle: "IFG1000 GTX 33",
  },
  {
    id: "gea-71",
    label: "GEA 71 Engine/Airframe Unit",
    processTitle: "IFG1000 GEA 71",
  },
];

export const emulatorComputerById = new Map<EmulatorComputerId, ComputerProcessInfo>(
  emulatorComputers.map((computer) => [computer.id, computer]),
);

export const supervisorRootComputerIds: EmulatorComputerId[] = [
  "gdu-1044b-pfd",
  "gdu-1044b-mfd",
  "gdc-74a",
  "grs-77",
  "gmu-44",
  "gtx-33",
  "gea-71",
];

export const childComputerByParent = new Map<EmulatorComputerId, EmulatorComputerId>([
  ["gdu-1044b-pfd", "gia-63w-1"],
  ["gdu-1044b-mfd", "gia-63w-2"],
]);

export const parentComputerByChild = new Map<EmulatorComputerId, EmulatorComputerId>(
  Array.from(childComputerByParent.entries()).map(([parent, child]) => [child, parent]),
);

export const gduComputerByDisplayRole = {
  pfd: "gdu-1044b-pfd",
  mfd: "gdu-1044b-mfd",
} as const;

export const defaultBusRoutes: Record<EmulatorComputerId, EmulatorComputerId[]> = {
  "gdu-1044b-pfd": ["gia-63w-1"],
  "gdu-1044b-mfd": ["gia-63w-2"],
  "gia-63w-1": ["gdu-1044b-pfd", "gdc-74a", "grs-77", "gmu-44", "gtx-33", "gea-71"],
  "gia-63w-2": ["gdu-1044b-mfd", "gdc-74a", "grs-77", "gmu-44", "gtx-33", "gea-71"],
  "gdc-74a": ["gia-63w-1", "gia-63w-2", "gdu-1044b-pfd"],
  "grs-77": ["gia-63w-1", "gia-63w-2"],
  "gmu-44": ["grs-77"],
  "gtx-33": ["gia-63w-1", "gia-63w-2"],
  "gea-71": ["gia-63w-1", "gia-63w-2"],
};
