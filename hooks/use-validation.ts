/**
 * React Hooks for Form Validation
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseValidationReturn<T> {
  errors: ValidationError[];
  isValid: boolean;
  validate: (data: T) => boolean;
  validateField: (field: keyof T, value: any) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  getFieldError: (field: keyof T) => string | undefined;
}

/**
 * Hook for form validation using Zod schemas
 */
export function useValidation<T extends z.ZodType>(
  schema: T
): UseValidationReturn<z.infer<T>> {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = useCallback(
    (data: z.infer<T>): boolean => {
      try {
        schema.parse(data);
        setErrors([]);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const validationErrors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          setErrors(validationErrors);
        }
        return false;
      }
    },
    [schema]
  );

  const validateField = useCallback(
    (field: keyof z.infer<T>, value: any): boolean => {
      try {
        // Get the field schema
        const fieldSchema = (schema as any).shape?.[field];
        if (!fieldSchema) return true;

        fieldSchema.parse(value);
        
        // Remove error for this field
        setErrors((prev) => prev.filter((err) => err.field !== String(field)));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = {
            field: String(field),
            message: error.errors[0].message,
          };
          
          // Update or add error for this field
          setErrors((prev) => {
            const filtered = prev.filter((err) => err.field !== String(field));
            return [...filtered, fieldError];
          });
        }
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldError = useCallback((field: keyof z.infer<T>) => {
    setErrors((prev) => prev.filter((err) => err.field !== String(field)));
  }, []);

  const getFieldError = useCallback(
    (field: keyof z.infer<T>): string | undefined => {
      return errors.find((err) => err.field === String(field))?.message;
    },
    [errors]
  );

  return {
    errors,
    isValid: errors.length === 0,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    getFieldError,
  };
}

/**
 * Hook for real-time field validation
 */
export function useFieldValidation<T>(
  initialValue: T,
  validator: (value: T) => { isValid: boolean; error?: string }
) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    (newValue: T) => {
      const result = validator(newValue);
      setError(result.error);
      return result.isValid;
    },
    [validator]
  );

  const handleChange = useCallback(
    (newValue: T) => {
      setValue(newValue);
      if (touched) {
        validate(newValue);
      }
    },
    [touched, validate]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate(value);
  }, [value, validate]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(undefined);
    setTouched(false);
  }, [initialValue]);

  return {
    value,
    error,
    touched,
    isValid: !error,
    setValue: handleChange,
    onBlur: handleBlur,
    reset,
  };
}

/**
 * Hook for password strength validation
 */
export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [feedback, setFeedback] = useState<string[]>([]);

  const checkStrength = useCallback((pwd: string) => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const newFeedback: string[] = [];

    if (!checks.length) newFeedback.push('At least 8 characters');
    if (!checks.uppercase) newFeedback.push('One uppercase letter');
    if (!checks.lowercase) newFeedback.push('One lowercase letter');
    if (!checks.number) newFeedback.push('One number');
    if (!checks.special) newFeedback.push('One special character');

    const newStrength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

    setStrength(newStrength);
    setFeedback(newFeedback);

    return { strength: newStrength, feedback: newFeedback, score };
  }, []);

  return {
    strength,
    feedback,
    checkStrength,
  };
}
