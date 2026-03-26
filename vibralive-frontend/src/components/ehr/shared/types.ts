/**
 * Tipos genéricos para DataTable y FormModal
 */

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'autocomplete';
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { value: string | number; label: string }[];
  validation?: (value: any) => string | null;
  multiline?: boolean;
  width?: string;
  autocompleteOptions?: string[];
  autocompleteOnChange?: (value: string) => Promise<string[]>;
  min?: string; // For date inputs: minimum date in 'yyyy-MM-dd' format
}

export interface CRUDActions<T> {
  onCreate: (data: any) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export interface FormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  fields: FormField[];
  initialData?: any;
  title: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string;
  sidePanel?: {
    title: string;
    items: Array<{
      name: string;
      count?: number;
    }>;
  };
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  loading?: boolean;
}

export interface EHRTabConfig<T> {
  name: string;
  columns: TableColumn<T>[];
  formFields: FormField[];
  apiKey: string; // 'prescriptions' | 'vaccinations' | 'allergies' | 'diagnoses'
  permissionKey: string; // 'ehr:prescriptions:create' etc
  idField: keyof T;
}
