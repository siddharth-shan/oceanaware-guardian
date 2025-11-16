import React from 'react';

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'fire', 
  text,
  className = '',
  enhanced = false
}) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colors = {
    fire: 'border-orange-500',
    gray: 'border-gray-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500'
  };

  if (enhanced) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="relative">
          <div 
            className={`animate-spin rounded-full border-2 border-gray-200 ${colors[color]} ${sizes[size]}`}
            style={{ borderTopColor: 'transparent' }}
          />
          <div 
            className={`absolute inset-0 animate-ping rounded-full border-2 ${colors[color]} opacity-30`}
          />
        </div>
        {text && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-gray-700">{text}</p>
            <div className="mt-2 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-200 ${colors[color]} ${sizes[size]}`}
        style={{ borderTopColor: 'transparent' }}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

export const LoadingDots = ({ className = '' }) => {
  return (
    <div className={`loading-dots ${className}`}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default LoadingSpinner;