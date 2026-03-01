export interface FileData {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileKey: string;
  fileCategory: string;
  uploadedAt: string;
}

export interface ProjectData {
  id: string;
  name: string;
  projectType: string;
  culture: string;
  status: string;
  notes: string | null;
  price: string;
  isPaid: boolean;
  paidAt: string | null;
  areaProcessed: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  isArchived: boolean;
  archivedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  files: FileData[];
  filesGrouped: {
    ortomosaico: FileData[];
    perimetros: FileData[];
    fotos: FileData[];
    outros: FileData[];
  };
}
