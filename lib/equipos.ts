// Each equipment entry: { marca, modelo, capacidad }
export interface EquipoPuenteGrua {
  marca: string
  modelo: string
  capacidad: string
}

// Complete table of authorized Puente Grúa equipment per Formacap spec
// Grouped for PDF rendering
export const EQUIPOS_GRUPO_1_KONECRANES: EquipoPuenteGrua[] = [
  { marca: "KONECRANES", modelo: "SMO912/XL708", capacidad: "65/27 Ton" },
  { marca: "KONECRANES", modelo: "SMO912/XL708", capacidad: "87/27 Ton" },
  { marca: "KONECRANES", modelo: "XL7712/XL403", capacidad: "35/5 Ton" },
  { marca: "KONECRANES", modelo: "XL708/XL403", capacidad: "20/5 Ton" },
  { marca: "KONECRANES", modelo: "CTX704", capacidad: "35 Ton" },
  { marca: "KONECRANES", modelo: "SMO912E/CXT704", capacidad: "85/35 Ton" },
  { marca: "KONECRANES", modelo: "TAG370XL Km-0", capacidad: "10 Ton" },
]

export const EQUIPOS_GRUPO_2_ABUS: EquipoPuenteGrua[] = [
  { marca: "ABUS", modelo: "XL708/XL403", capacidad: "15/5 Ton" },
  { marca: "ABUS", modelo: "GM5000", capacidad: "25/5 Ton" },
  { marca: "ABUS", modelo: "GM5000", capacidad: "0.5 Ton" },
  { marca: "ABUS", modelo: "GM200", capacidad: "2.5 Ton" },
  { marca: "ABUS", modelo: "GM6200L", capacidad: "20 Ton" },
  { marca: "ABUS", modelo: "GM6200L", capacidad: "12.5 Ton" },
  { marca: "ABUS", modelo: "GM532H6/GM3050L", capacidad: "30/5 Ton" },
  { marca: "ABUS", modelo: "GM3060L6", capacidad: "5 Ton" },
  { marca: "ABUS", modelo: "TK712", capacidad: "3.2 Ton" },
]

export const EQUIPOS_GRUPO_3_VARIOS: EquipoPuenteGrua[] = [
  { marca: "R&M", modelo: "SX608", capacidad: "40 Ton" },
  { marca: "INAMAR", modelo: "Biviga", capacidad: "30/5 Ton" },
  { marca: "TBM", modelo: "PORTICO 3500", capacidad: "2 TON" },
  { marca: "WORLDHOIST/FIEFR", modelo: "K2102", capacidad: "1 TON" },
  { marca: "WORLDHOIST/FIEFR", modelo: "K3102", capacidad: "2 TON" },
  { marca: "WORLDHOIST/FIEFR", modelo: "K4104", capacidad: "12.5 TON" },
  { marca: "INAMAR/VAPOR", modelo: "GM7000.125000", capacidad: "125/20 Ton" },
  { marca: "INAMAR/VAPOR", modelo: "GM7000.90000", capacidad: "90/15 Ton" },
]

export const EQUIPOS_GRUPO_4_INAMAR_VAPOR: EquipoPuenteGrua[] = [
  { marca: "INAMAR/VAPOR", modelo: "GM6000.8000", capacidad: "7.5 Ton" },
  { marca: "INAMAR/VAPOR", modelo: "GM800.3200", capacidad: "3.2 Ton" },
]

export const ALL_EQUIPOS: EquipoPuenteGrua[] = [
  ...EQUIPOS_GRUPO_1_KONECRANES,
  ...EQUIPOS_GRUPO_2_ABUS,
  ...EQUIPOS_GRUPO_3_VARIOS,
  ...EQUIPOS_GRUPO_4_INAMAR_VAPOR,
]

// Legacy compat for form selects
export const EQUIPOS_PUENTE_GRUA: Record<string, { modelos: string[]; capacidades: string[] }> = {
  KONECRANES: {
    modelos: Array.from(new Set(EQUIPOS_GRUPO_1_KONECRANES.map((e) => e.modelo))),
    capacidades: EQUIPOS_GRUPO_1_KONECRANES.map((e) => e.capacidad),
  },
  ABUS: {
    modelos: Array.from(new Set(EQUIPOS_GRUPO_2_ABUS.map((e) => e.modelo))),
    capacidades: EQUIPOS_GRUPO_2_ABUS.map((e) => e.capacidad),
  },
  "R&M": {
    modelos: ["SX608"],
    capacidades: ["40 Ton"],
  },
  INAMAR: {
    modelos: ["Biviga"],
    capacidades: ["30/5 Ton"],
  },
  TBM: {
    modelos: ["PORTICO 3500"],
    capacidades: ["2 Ton"],
  },
  "WORLDHOIST/FIEFR": {
    modelos: ["K2102", "K3102", "K4104"],
    capacidades: ["1 Ton", "2 Ton", "12.5 Ton"],
  },
  "INAMAR/VAPOR": {
    modelos: ["GM7000.125000", "GM7000.90000", "GM6000.8000", "GM800.3200"],
    capacidades: ["125/20 Ton", "90/15 Ton", "7.5 Ton", "3.2 Ton"],
  },
}

export const MARCAS_PUENTE_GRUA = Object.keys(EQUIPOS_PUENTE_GRUA)

export function getModelos(marca: string): string[] {
  if (marca === "OTRO") return []
  return EQUIPOS_PUENTE_GRUA[marca]?.modelos || []
}

export function getCapacidades(marca: string): string[] {
  if (marca === "OTRO") return []
  return EQUIPOS_PUENTE_GRUA[marca]?.capacidades || []
}
