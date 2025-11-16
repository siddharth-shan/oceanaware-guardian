import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  title,
  subtitle,
  actions,
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white border-gray-200',
    dark: 'bg-gray-800 border-gray-700 text-white',
    glass: 'glass border-white/20',
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    success: 'bg-green-50 border-green-200'
  };

  return (
    <div className={`card ${variants[variant]} ${className}`} {...props}>
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;