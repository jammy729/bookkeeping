import { type Control, type FieldErrors, type FieldValues, type Path, useController } from 'react-hook-form';

import { Input } from './input';
import { Label } from './label';

interface FormFieldProps<TFieldValues extends FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  step?: string;
}

export function FormField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  errors,
  type = 'text',
  placeholder,
  required,
  disabled,
  step,
}: FormFieldProps<TFieldValues>) {
  const { field } = useController({ name, control });
  const error = (errors as Record<string, { message?: string }>)[name as string]?.message;

  return (
    <div>
      <Label htmlFor={name as string}>
        {label}
        {required && ' *'}
      </Label>
      <Input
        id={name as string}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        {...field}
        value={field.value ?? ''}
      />
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
