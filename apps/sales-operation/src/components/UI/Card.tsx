import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
  onClick
}) => {
  const baseClasses = 'bg-white rounded-2xl transition-all duration-200';
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-soft',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const borderClass = border ? 'border border-gray-100' : '';
  const hoverClass = hover ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  const classes = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClass} ${hoverClass} ${clickableClass} ${className}`;

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

// Card Header component
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

// Card Title component
export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <h3 className={`font-bold text-gray-900 ${sizeClasses[size]} ${className}`}>
      {children}
    </h3>
  );
};

// Card Content component
export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`text-gray-600 ${className}`}>
    {children}
  </div>
);

// Card Footer component
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);

export default Card;
