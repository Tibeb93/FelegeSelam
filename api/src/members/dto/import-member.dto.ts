export interface ImportErrorDetail {
  row: number;
  memberNo?: string;
  name?: string;
  reasons: string[];
}

export interface ImportReport {
  total: number;
  created: number;
  skipped: number;
  errorsCount: number;
  errors: ImportErrorDetail[];
  createdMembers: Array<{
    id: string;
    memberNo: string;
    fullName: string;
  }>;
}
