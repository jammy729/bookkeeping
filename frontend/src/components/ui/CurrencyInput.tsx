import { useState, useCallback, useRef } from 'react';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import { Input } from './input';
import { Label } from './label';
import { cn } from '../../lib/utils';

interface CurrencyInputProps<TFieldValues extends FieldValues> {
  label: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  errors?: Record<string, { message?: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * Currency input that displays formatted CAD values (e.g., "$1,234.56")
 * and stores the raw number. Works with React Hook Form via useController.
 */
export function CurrencyInput<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  errors,
  placeholder = '0.00',
  required,
  disabled,
  min = 0,
  max,
  className,
}: CurrencyInputProps<TFieldValues>) {
  const { field } = useController({ name, control });
  const error = errors?.[name as string]?.message;

  // Store the raw numeric value (what gets submitted)
  const rawValue: number = typeof field.value === 'number' ? field.value : 0;

  // Display value is formatted string
  const [displayValue, setDisplayValue] = useState(() => formatDisplay(rawValue));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function formatDisplay(value: number): string {
    if (value === 0) return '';
    return value.toFixed(2);
  }

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show raw number on focus for easy editing
    setDisplayValue(rawValue === 0 ? '' : rawValue.toFixed(2));
    // Select all on focus
    setTimeout(() => inputRef.current?.select(), 0);
  }, [rawValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Format back for display
    setDisplayValue(formatDisplay(rawValue));
    field.onBlur();
  }, [rawValue, field]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow empty (will be treated as 0)
    if (input === '') {
      setDisplayValue('');
      field.onChange(0);
      return;
    }

    // Allow only digits and one decimal point
    const cleaned = input.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');

    // Enforce max 2 decimal places
    if (parts.length > 2) {
      const integer = parts[0];
      const decimals = parts[1].slice(0, 2);
      const parsed = parseFloat(`${integer}.${decimals}`);
      if (!isNaN(parsed)) {
        setDisplayValue(`${integer}.${decimals}`);
        field.onChange(parsed);
      }
      return;
    }

    if (parts.length === 2 && parts[1].length > 2) {
      const truncated = cleaned.slice(0, cleaned.indexOf('.') + 3);
      const parsed = parseFloat(truncated);
      if (!isNaN(parsed)) {
        setDisplayValue(truncated);
        field.onChange(parsed);
      }
      return;
    }

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      setDisplayValue(cleaned);
      field.onChange(parsed);
    } else if (cleaned === '.' || cleaned === '0.') {
      // Allow typing "0." or "."
      setDisplayValue(cleaned);
    }
  }, [field]);

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name as string}>
        {label}
        {required && ' *'}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          $
        </span>
        <Input
          ref={inputRef}
          id={name as string}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={isFocused ? displayValue : (rawValue === 0 ? '' : displayValue)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-7 font-mono"
          min={min}
          max={max}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
