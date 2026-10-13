import { BadRequestException } from '@nestjs/common';
import { FormFieldSchema, FormSchemaDefinition } from './dto/form-schema.interface';

export interface FormValidationError {
  field: string;
  label: string;
  message: string;
}

export class FormAnswersValidator {
  private readonly fields: FormFieldSchema[];

  constructor(private readonly schema: FormSchemaDefinition) {
    this.fields = Array.isArray(schema?.fields) ? schema.fields : [];
  }

  /**
   * Helper to retrieve a human-readable label for a field
   */
  private getFieldLabel(field: FormFieldSchema): string {
    if (field.labelAm) return field.labelAm;
    if (field.labelEn) return field.labelEn;
    if (typeof field.label === 'object') {
      return field.label.am || field.label.en || field.name;
    }
    if (typeof field.label === 'string') return field.label;
    return field.name;
  }

  /**
   * Validates answers map against the loaded form schema.
   * Returns list of validation errors, or empty array if valid.
   */
  validate(answers: Record<string, any>): FormValidationError[] {
    const errors: FormValidationError[] = [];
    const payload = answers || {};

    for (const field of this.fields) {
      const label = this.getFieldLabel(field);
      const val = payload[field.name];

      // Check emptiness
      const isMissing =
        val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);

      if (field.required && isMissing) {
        errors.push({
          field: field.name,
          label,
          message: `የግዴታ መስክ ነው / Field "${label}" is required`,
        });
        continue;
      }

      // If optional and missing, skip further validation
      if (isMissing) {
        continue;
      }

      // Specific type validation
      switch (field.type) {
        case 'text':
        case 'textarea': {
          if (typeof val !== 'string') {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must be a string`,
            });
            break;
          }
          const text = val.trim();
          if (
            field.validation?.minLength !== undefined &&
            text.length < field.validation.minLength
          ) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must have at least ${field.validation.minLength} characters (current: ${text.length})`,
            });
          }
          if (
            field.validation?.maxLength !== undefined &&
            text.length > field.validation.maxLength
          ) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must not exceed ${field.validation.maxLength} characters`,
            });
          }
          if (field.validation?.pattern) {
            try {
              const regex = new RegExp(field.validation.pattern);
              if (!regex.test(text)) {
                errors.push({
                  field: field.name,
                  label,
                  message: `Field "${label}" does not match the required pattern`,
                });
              }
            } catch {
              // Ignore invalid regex patterns in schema
            }
          }
          break;
        }

        case 'number': {
          const num = typeof val === 'number' ? val : Number(val);
          if (isNaN(num)) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must be a valid number`,
            });
            break;
          }
          if (field.validation?.min !== undefined && num < field.validation.min) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must be at least ${field.validation.min} (current: ${num})`,
            });
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must not exceed ${field.validation.max} (current: ${num})`,
            });
          }
          break;
        }

        case 'date': {
          const d = new Date(val);
          if (isNaN(d.getTime())) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must be a valid date format (ISO or YYYY-MM-DD)`,
            });
            break;
          }
          if (field.validation?.minDate) {
            const minD = new Date(field.validation.minDate);
            if (!isNaN(minD.getTime()) && d < minD) {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" date cannot be earlier than ${field.validation.minDate}`,
              });
            }
          }
          if (field.validation?.maxDate) {
            const maxD = new Date(field.validation.maxDate);
            if (!isNaN(maxD.getTime()) && d > maxD) {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" date cannot be later than ${field.validation.maxDate}`,
              });
            }
          }
          break;
        }

        case 'dropdown':
        case 'radio': {
          const validOptions = (field.options || []).map((o) => String(o.value));
          if (validOptions.length > 0 && !validOptions.includes(String(val))) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" value "${val}" is invalid. Allowed options: ${validOptions.join(', ')}`,
            });
          }
          break;
        }

        case 'checkbox': {
          const validOptions = (field.options || []).map((o) => String(o.value));
          if (validOptions.length > 0) {
            // Multiselect checkbox array
            if (!Array.isArray(val)) {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" must be an array of selected options`,
              });
              break;
            }
            const invalidSelections = val.filter(
              (selected) => !validOptions.includes(String(selected)),
            );
            if (invalidSelections.length > 0) {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" contains invalid options: ${invalidSelections.join(', ')}`,
              });
            }
            if (
              field.validation?.minSelected !== undefined &&
              val.length < field.validation.minSelected
            ) {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" requires at least ${field.validation.minSelected} selections (selected: ${val.length})`,
              });
            }
            if (
              field.validation?.maxSelected !== undefined &&
              val.length > field.validation.maxSelected
            ) {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" allows at most ${field.validation.maxSelected} selections (selected: ${val.length})`,
              });
            }
          } else {
            // Single boolean checkbox (e.g., terms agreement)
            if (field.required && val !== true && val !== 'true') {
              errors.push({
                field: field.name,
                label,
                message: `Field "${label}" must be accepted`,
              });
            }
          }
          break;
        }

        case 'file': {
          // File path or uploaded file URL
          const fileUrl = typeof val === 'string' ? val : val?.fileUrl;
          if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
            errors.push({
              field: field.name,
              label,
              message: `Field "${label}" must contain a valid uploaded file URL`,
            });
          }
          break;
        }
      }
    }

    return errors;
  }

  /**
   * Asserts valid answers or throws BadRequestException with structured message
   */
  assertValid(answers: Record<string, any>): void {
    const errors = this.validate(answers);
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Form validation failed',
        errors,
      });
    }
  }
}
