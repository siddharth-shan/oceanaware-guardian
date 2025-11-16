import React from 'react';

export const Input = ({ 
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'border-gray-300 focus:ring-fire-500',
    dark: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
    error: 'border-red-500 focus:ring-red-500'
  };

  const inputVariant = error ? 'error' : variant;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          className={`input ${variants[inputVariant]} ${Icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;