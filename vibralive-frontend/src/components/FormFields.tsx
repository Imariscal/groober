import { ReactNode } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import clsx from 'clsx';

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormFieldError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className={clsx('flex items-center gap-2 text-sm text-red-600', className)}>
      <FiAlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function FormInput({
  label,
  error,
  helperText,
  containerClassName,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        {...props}
        className={clsx(
          'w-full px-4 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-200',
          className
        )}
      />
      {error && <FormFieldError message={error} className="mt-1" />}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}

interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  containerClassName?: string;
}

export function FormSelect({
  label,
  error,
  options,
  placeholder,
  containerClassName,
  className,
  ...props
}: FormSelectProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        {...props}
        className={clsx(
          'w-full px-4 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-200',
          className
        )}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <FormFieldError message={error} className="mt-1" />}
    </div>
  );
}

interface FormTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function FormTextArea({
  label,
  error,
  helperText,
  containerClassName,
  className,
  ...props
}: FormTextAreaProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        {...props}
        className={clsx(
          'w-full px-4 py-2 border rounded-lg transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-200',
          className
        )}
      />
      {error && <FormFieldError message={error} className="mt-1" />}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}

interface InfoAlertProps {
  children: ReactNode;
  onClose?: () => void;
}

export function InfoAlert({ children, onClose }: InfoAlertProps) {
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
      <div className="text-blue-600 flex-shrink-0 mt-0.5">
        <FiAlertCircle className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm text-blue-700">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-700 flex-shrink-0"
        >
          <FiX className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
