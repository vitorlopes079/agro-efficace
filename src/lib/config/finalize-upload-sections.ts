export interface FinalizeUploadSection {
  id: string;
  title: string;
  description: string;
  acceptedTypes: string;
  category: string;
}

export const finalizeUploadSections: FinalizeUploadSection[] = [
  {
    id: "dji-shapefile",
    title: "DJI / SHAPEFILE",
    description: "Buffers do drone DJI",
    acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg, .qmd",
    category: "OUTPUT_DJI_SHAPEFILE",
  },
  {
    id: "ortomosaic",
    title: "ORTOMOSAICO COMPRIMIDO",
    description: "Ortomosaico comprimido da área mapeada",
    acceptedTypes: ".ecw, .tif, .tiff",
    category: "OUTPUT_ORTOMOSAIC",
  },
  {
    id: "reports",
    title: "RELATÓRIOS",
    description: "Relatórios de análise e resultados",
    acceptedTypes: ".pdf, .doc, .docx",
    category: "OUTPUT_RELATORIO",
  },
  {
    id: "shapefile-weeds",
    title: "SHAPEFILE / Daninhas Folha Larga",
    description: "Mapeamento de plantas daninhas de folha larga",
    acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg",
    category: "OUTPUT_SHAPEFILE_DANINHAS",
  },
  {
    id: "shapefile-obstacles",
    title: "SHAPEFILE / Obstáculos",
    description: "Mapeamento de obstáculos na área",
    acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg, .qmd",
    category: "OUTPUT_SHAPEFILE_OBSTACULOS",
  },
  {
    id: "shapefile-perimeters",
    title: "SHAPEFILE / Perímetros",
    description: "Delimitação de talhões e perímetros",
    acceptedTypes: ".shp, .shx, .dbf, .prj, .cpg",
    category: "OUTPUT_SHAPEFILE_PERIMETROS",
  },
  {
    id: "outros",
    title: "OUTROS ARQUIVOS",
    description: "Arquivos adicionais do projeto",
    acceptedTypes: "Todos os tipos de arquivo",
    category: "OUTPUT_OTHER",
  },
];
