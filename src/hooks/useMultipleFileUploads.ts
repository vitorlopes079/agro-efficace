import { useFileUpload } from "./useFileUpload";

export type FileCategory = "ortomosaico" | "perimetro" | "outros";

export function useMultipleFileUploads() {
  // Hook para Ortomosaico
  const ortomosaico = useFileUpload();

  // Hook para Perímetros
  const perimetro = useFileUpload();

  // Hook para Outros Arquivos
  const outros = useFileUpload();

  // Aggregate states
  const isUploading =
    ortomosaico.isUploading || perimetro.isUploading || outros.isUploading;

  const hasErrors =
    ortomosaico.hasErrors || perimetro.hasErrors || outros.hasErrors;

  const getAllCompletedFiles = () => {
    return {
      ortomosaico: ortomosaico.completedFiles,
      perimetro: perimetro.completedFiles,
      outros: outros.completedFiles,
    };
  };

  return {
    ortomosaico,
    perimetro,
    outros,
    isUploading,
    hasErrors,
    getAllCompletedFiles,
  };
}
