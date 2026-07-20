export interface Waypoint {
  id: string;
  latitudeDeg: number;
  longitudeDeg: number;
  name: string;
}

export interface Airport extends Waypoint {
  elevationFt: number;
  iata?: string;
  icao: string;
}

export interface NavdataRepository {
  findAirportByIcao: (icao: string) => Airport | undefined;
  searchWaypoints: (query: string) => Waypoint[];
}

export function createEmptyNavdataRepository(): NavdataRepository {
  return {
    findAirportByIcao: () => undefined,
    searchWaypoints: () => [],
  };
}

