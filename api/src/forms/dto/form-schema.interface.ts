export type FormFieldType =
  'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'radio' | 'checkbox' | 'file';

export interface FormFieldOption {
  value: string;
  labelAm: string;
  labelEn?: string;
  label?: string | { am: string; en?: string };
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern as string (e.g., "^AS-\\d{4}-\\d{4}$")
  min?: number;
  max?: number;
  minDate?: string; // YYYY-MM-DD or ISO
  maxDate?: string; // YYYY-MM-DD or ISO
  minSelected?: number; // for checkbox array
  maxSelected?: number; // for checkbox array
  allowedMimeTypes?: string[]; // for file: e.g. ['application/pdf', 'image/jpeg']
  maxSizeBytes?: number; // for file: e.g. 5242880 (5MB)
}

export interface FormFieldSchema {
  id?: string;
  name: string; // Machine key in responses (e.g. 'spiritualFather')
  type: FormFieldType;
  labelAm: string;
  labelEn?: string;
  label?: string | { am: string; en?: string };
  placeholderAm?: string;
  placeholderEn?: string;
  descriptionAm?: string;
  descriptionEn?: string;
  required: boolean;
  options?: FormFieldOption[]; // For dropdown, radio, checkbox
  validation?: FormFieldValidation;
  defaultValue?: any;
}

export interface FormSchemaSettings {
  allowOneResponsePerMember?: boolean;
  requireLogin?: boolean;
  confirmationMessageAm?: string;
  confirmationMessageEn?: string;
  notifyOnSubmission?: boolean;
}

export interface FormSchemaDefinition {
  titleAm?: string;
  titleEn?: string;
  descriptionAm?: string;
  descriptionEn?: string;
  fields: FormFieldSchema[];
  settings?: FormSchemaSettings;
}
