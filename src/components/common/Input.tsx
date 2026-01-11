import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

interface InputFieldProps extends BaseInputProps, InputHTMLAttributes<HTMLInputElement> {
  type?: 'text' | 'number' | 'email' | 'password' | 'time' | 'date';
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
      w-full px-4 py-3 border-2 rounded-xl transition-colors
      focus:outline-none focus:border-primary
      ${error ? 'border-danger' : 'border-gray-200'}
      ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
      ${className}
    `;

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, rows = 3, className = '', ...props }, ref) => {
    const textareaClasses = `
      w-full px-4 py-3 border-2 rounded-xl transition-colors resize-none
      focus:outline-none focus:border-primary
      ${error ? 'border-danger' : 'border-gray-200'}
      ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
      ${className}
    `;

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        )}
        <textarea ref={ref} rows={rows} className={textareaClasses} {...props} />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
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
    w-full px-4 py-3 border-2 rounded-xl transition-colors appearance-none
    focus:outline-none focus:border-primary bg-white
    ${error ? 'border-danger' : 'border-gray-200'}
    ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

export default Input;
