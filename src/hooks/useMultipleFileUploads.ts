// src/hooks/useMultipleFileUploads.ts
import { useFileUpload } from "./useFileUpload";

export type FileCategory = "ortomosaico" | "fotos" | "perimetro" | "outros";

export function useMultipleFileUploads() {
  // Hook para Ortomosaico
  const ortomosaico = useFileUpload();

  // Hook para Fotos Brutas do Drone
  const fotos = useFileUpload();

  // Hook para Perímetros
  const perimetro = useFileUpload();

  // Hook para Outros Arquivos
  const outros = useFileUpload();

  // Aggregate states
  const isUploading =
    ortomosaico.isUploading ||
    fotos.isUploading ||
    perimetro.isUploading ||
    outros.isUploading;

  const hasErrors =
    ortomosaico.hasErrors ||
    fotos.hasErrors ||
    perimetro.hasErrors ||
    outros.hasErrors;

  const getAllCompletedFiles = () => {
    return {
      ortomosaico: ortomosaico.completedFiles,
      fotos: fotos.completedFiles,
      perimetro: perimetro.completedFiles,
      outros: outros.completedFiles,
    };
  };

  return {
    ortomosaico,
    fotos,
    perimetro,
    outros,
    isUploading,
    hasErrors,
    getAllCompletedFiles,
  };
}
