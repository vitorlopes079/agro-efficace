export const VALID_PROJECT_TYPES = [
  "DANINHAS",
  "FALHAS",
  "RESTITUICAO",
  "MAPEAMENTO",
] as const;

export const VALID_CULTURES = [
  "CANA",
  "MILHO",
  "SOJA",
  "EUCALIPTO",
  "CAFE",
  "ALGODAO",
] as const;

export type ProjectType = (typeof VALID_PROJECT_TYPES)[number];
export type Culture = (typeof VALID_CULTURES)[number];

export const FILE_CATEGORIES = {
  INPUT_ORTOMOSAICO: "INPUT_ORTOMOSAICO",
  INPUT_PERIMETRO: "INPUT_PERIMETRO",
  INPUT_OTHER: "INPUT_OTHER",
  OUTPUT_DJI_SHAPEFILE: "OUTPUT_DJI_SHAPEFILE",
  OUTPUT_ORTOMOSAIC: "OUTPUT_ORTOMOSAIC",
  OUTPUT_RELATORIO: "OUTPUT_RELATORIO",
  OUTPUT_SHAPEFILE_DANINHAS: "OUTPUT_SHAPEFILE_DANINHAS",
  OUTPUT_SHAPEFILE_OBSTACULOS: "OUTPUT_SHAPEFILE_OBSTACULOS",
  OUTPUT_SHAPEFILE_PERIMETROS: "OUTPUT_SHAPEFILE_PERIMETROS",
  OUTPUT_OTHER: "OUTPUT_OTHER",
} as const;

export type FileCategory = (typeof FILE_CATEGORIES)[keyof typeof FILE_CATEGORIES];

export const projectTypeLabels: Record<string, string> = {
  DANINHAS: "Daninhas",
  FALHAS: "Falhas",
  RESTITUICAO: "Restituição",
  MAPEAMENTO: "Mapeamento",
};

export const cultureLabels: Record<string, string> = {
  CANA: "Cana",
  MILHO: "Milho",
  SOJA: "Soja",
  EUCALIPTO: "Eucalipto",
  CAFE: "Café",
  ALGODAO: "Algodão",
};
