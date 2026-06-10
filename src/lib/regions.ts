/** Regiones de Cooitza (deben coincidir con el enum `region` de la BD). */
export const REGIONS = [
  "Central",
  "Occidente",
  "Centro Oriente",
  "Noroccidente",
  "Oriente",
  "Petén",
] as const;

export type Region = (typeof REGIONS)[number];
