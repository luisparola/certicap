export const EQUIPOS_PUENTE_GRUA: Record<string, { modelos: string[]; capacidades: string[] }> = {
  KONECRANES: {
    modelos: [
      "SMO912/XL708",
      "XL7712/XL403",
      "XL708/XL403",
      "CTX704",
      "SMO912E/CXT704",
      "TAG370XL Km-0",
    ],
    capacidades: [
      "65/27 Ton",
      "87/27 Ton",
      "35/5 Ton",
      "20/5 Ton",
      "35 Ton",
      "85/35 Ton",
      "10 Ton",
    ],
  },
  ABUS: {
    modelos: [
      "XL708/XL403",
      "GM5000",
      "GM200",
      "GM6200L",
      "GM532H6/GM3050L",
      "GM3060L6",
      "TK712",
    ],
    capacidades: [
      "15/5 Ton",
      "25/5 Ton",
      "0.5 Ton",
      "2.5 Ton",
      "20 Ton",
      "12.5 Ton",
      "30/5 Ton",
      "5 Ton",
      "3.2 Ton",
    ],
  },
  "R&M": {
    modelos: ["SX608"],
    capacidades: ["40 Ton"],
  },
  INAMAR: {
    modelos: ["Biviga", "GM7000.125000", "GM7000.90000"],
    capacidades: ["30/5 Ton", "125/20 Ton", "90/15 Ton"],
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
    modelos: ["GM7000.125000", "GM7000.90000"],
    capacidades: ["125/20 Ton", "90/15 Ton"],
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
