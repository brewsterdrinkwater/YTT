import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

/**
 * Walt-tab Input Components
 * Brutalist style: clean borders, high contrast focus states
 */

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

interface InputFieldProps extends BaseInputProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'number' | 'email' | 'password' | 'time' | 'date' | 'search' | 'tel' | 'url';
}

interface TextAreaProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
}

interface SelectProps extends BaseInputProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const inputClasses = `
      w-full px-4 py-3 border-2 rounded-sm transition-colors duration-150
      focus:outline-none focus:border-black
      placeholder:text-slate
      ${error ? 'border-danger' : 'border-steel'}
      ${props.disabled ? 'bg-concrete cursor-not-allowed text-slate' : 'bg-white text-black'}
      ${className}
    `.trim();

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-semibold text-black mb-2">{label}</label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-slate">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, rows = 3, className = '', ...props }, ref) => {
    const textareaClasses = `
      w-full px-4 py-3 border-2 rounded-sm transition-colors duration-150 resize-none
      focus:outline-none focus:border-black
      placeholder:text-slate
      ${error ? 'border-danger' : 'border-steel'}
      ${props.disabled ? 'bg-concrete cursor-not-allowed text-slate' : 'bg-white text-black'}
      ${className}
    `.trim();

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-semibold text-black mb-2">{label}</label>
        )}
        <textarea ref={ref} rows={rows} className={textareaClasses} {...props} />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-slate">{helperText}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  ...props
}) => {
  const selectClasses = `
    w-full px-4 py-3 border-2 rounded-sm transition-colors duration-150 appearance-none
    focus:outline-none focus:border-black bg-white text-black
    ${error ? 'border-danger' : 'border-steel'}
    ${props.disabled ? 'bg-concrete cursor-not-allowed text-slate' : ''}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-black mb-2">{label}</label>
      )}
      <div className="relative">
        <select className={selectClasses} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-slate">{helperText}</p>}
    </div>
  );
};

export default Input;
