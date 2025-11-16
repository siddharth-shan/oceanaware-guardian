import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';

/**
 * Enhanced Card Component with consistent styling and accessibility
 */
const EnhancedCard = ({
  children,
  title,
  subtitle,
  icon: Icon,
  variant = 'default',
  clickable = false,
  onClick,
  href,
  external = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  loading = false,
  ...props
}) => {
  const variantStyles = {
    default: 'enhanced-card',
    success: 'enhanced-card border-green-200 bg-green-50',
    warning: 'enhanced-card border-yellow-200 bg-yellow-50',
    error: 'enhanced-card border-red-200 bg-red-50',
    info: 'enhanced-card border-blue-200 bg-blue-50',
    primary: 'enhanced-card border-orange-200 bg-orange-50'
  };

  const baseClassName = `${variantStyles[variant]} ${className} ${
    clickable || onClick || href ? 'cursor-pointer' : ''
  } ${loading ? 'loading-shimmer' : ''}`;

  const handleClick = (e) => {
    if (href) {
      if (external) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = href;
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  const CardWrapper = href ? 'a' : 'div';

  return (
    <CardWrapper
      className={baseClassName}
      onClick={handleClick}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      role={clickable && !href ? 'button' : undefined}
      tabIndex={clickable && !href ? 0 : undefined}
      onKeyDown={(e) => {
        if (clickable && !href && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e);
        }
      }}
      aria-label={title}
      {...props}
    >
      {/* Header */}
      {(title || Icon) && (
        <div className={`flex items-center justify-between p-4 pb-2 ${headerClassName}`}>
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-600" aria-hidden="true" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Clickable indicator */}
          {(clickable || onClick || href) && (
            <div className="flex-shrink-0 text-gray-400">
              {external ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {children && (
        <div className={`p-4 ${title || Icon ? 'pt-2' : ''} ${contentClassName}`}>
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </CardWrapper>
  );
};

/**
 * Enhanced Card with Stats Layout
 */
export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  variant = 'default',
  className = '',
  ...props
}) => {
  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }[trendDirection];

  return (
    <EnhancedCard
      variant={variant}
      className={`p-6 ${className}`}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 leading-tight">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trendColor}`}>
              {trend}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        )}
      </div>
    </EnhancedCard>
  );
};

/**
 * Enhanced Card with Action Buttons
 */
export const ActionCard = ({
  title,
  description,
  icon: Icon,
  actions = [],
  variant = 'default',
  className = '',
  ...props
}) => {
  return (
    <EnhancedCard
      variant={variant}
      className={className}
      icon={Icon}
      title={title}
      {...props}
    >
      {description && (
        <p className="text-gray-600 mb-4">
          {description}
        </p>
      )}
      
      {actions.length > 0 && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`enhanced-button ${action.className || ''} ${
                action.variant === 'secondary' 
                  ? 'bg-gray-600 hover:bg-gray-700' 
                  : ''
              }`}
              disabled={action.disabled}
              aria-label={action.label}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </EnhancedCard>
  );
};

export default EnhancedCard;