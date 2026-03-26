import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface FieldError {
  message: string;
}

export interface UseFormValidationReturn<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, FieldError>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValidating: boolean;
  hasErrors: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  setErrors: (errors: Partial<Record<keyof T, FieldError>>) => void;
  setValues: (values: T | ((prev: T) => T)) => void;
  validate: () => Promise<boolean>;
  validateField: (field: keyof T, value: any) => Promise<void>;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
  resetForm: () => void;
  /**
   * Mark multiple fields as touched at once.
   * Useful when enabling a feature that makes fields required.
   */
  markFieldsTouched: (fields: (keyof T)[]) => void;
  /**
   * Mark all fields as touched.
   * Useful before form submission to show all errors.
   */
  markAllTouched: () => void;
  /**
   * Check if a specific field should show its error.
   * Returns true if the field is touched AND has an error.
   */
  shouldShowError: (field: keyof T) => boolean;
  /**
   * Get the error message for a field.
   */
  getErrorMessage: (field: keyof T) => string | undefined;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: z.ZodSchema,
  onSubmit?: (values: T) => Promise<void> | void
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, FieldError>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isValidating, setIsValidating] = useState(false);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouched((prev) => ({
      ...prev,
      [field]: isTouched,
    }));
  }, []);

  const validate = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      await schema.parseAsync(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, FieldError>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof T;
          if (field) {
            newErrors[field] = { message: err.message };
          }
        });
        setErrors(newErrors);
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [schema, values]);

  const validateField = useCallback(
    async (field: keyof T, value: any) => {
      try {
        const fieldSchema = schema.pick({ [field]: true } as any);
        await fieldSchema.parseAsync({ [field]: value });
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors[0]?.message || 'Error de validación';
          setErrors((prev) => ({
            ...prev,
            [field]: { message: errorMessage },
          }));
        }
      }
    },
    [schema]
  );

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { value, type } = e.target;
        const newValue = type === 'number' ? parseFloat(value) : value;
        setFieldValue(field, newValue);
      },
      onBlur: () => {
        setFieldTouched(field, true);
      },
    }),
    [values, setFieldValue, setFieldTouched]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Mark multiple fields as touched at once
  const markFieldsTouched = useCallback((fields: (keyof T)[]) => {
    setTouched((prev) => {
      const newTouched = { ...prev };
      fields.forEach((field) => {
        newTouched[field] = true;
      });
      return newTouched;
    });
  }, []);

  // Mark all fields as touched
  const markAllTouched = useCallback(() => {
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(values).forEach((key) => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);
  }, [values]);

  // Check if a field should show its error
  const shouldShowError = useCallback(
    (field: keyof T) => Boolean(touched[field] && errors[field]),
    [touched, errors]
  );

  // Get error message for a field
  const getErrorMessage = useCallback(
    (field: keyof T) => errors[field]?.message,
    [errors]
  );

  // Check if form has any errors
  const hasErrors = Object.keys(errors).length > 0;

  return {
    values,
    errors,
    touched,
    isValidating,
    hasErrors,
    setFieldValue,
    setFieldTouched,
    setErrors,
    setValues,
    validate,
    validateField,
    getFieldProps,
    resetForm,
    markFieldsTouched,
    markAllTouched,
    shouldShowError,
    getErrorMessage,
  };
}
