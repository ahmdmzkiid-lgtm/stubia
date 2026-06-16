import React from 'react';
import Spinner from './Spinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-accent-blue to-accent-violet text-white hover:shadow-lg hover:shadow-accent-blue/20 hover:scale-[1.02] active:scale-[0.98] border border-transparent",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600",
    danger: "bg-accent-red text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-2 text-current" />}
      {children}
    </button>
  );
};

export default Button;
