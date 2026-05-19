export interface ImportError {
  row: number;
  column: string;
  message: string;
  value?: any;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errors: ImportError[];
  warnings: string[];
  data?: any[];
}

export interface ColumnValidation {
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'select';
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
  customRule?: (value: any) => string | null;
}

export interface ImportColumn {
  key: string;
  label: string;
  validation?: ColumnValidation;
  order: number;
  visible: boolean;
}
