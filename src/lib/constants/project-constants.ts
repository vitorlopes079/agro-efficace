// Project types and cultures are now dynamic (stored in database config tables)
// Use the config APIs to fetch valid values:
// - GET /api/admin/settings/project-types
// - GET /api/admin/settings/cultures

// Input categories for client form (fixed)
export const INPUT_FILE_CATEGORIES = {
  INPUT_ORTOMOSAICO: "INPUT_ORTOMOSAICO",
  INPUT_PERIMETRO: "INPUT_PERIMETRO",
  INPUT_FOTOS: "INPUT_FOTOS",
  INPUT_OTHER: "INPUT_OTHER",
} as const;

export type InputFileCategory =
  (typeof INPUT_FILE_CATEGORIES)[keyof typeof INPUT_FILE_CATEGORIES];
