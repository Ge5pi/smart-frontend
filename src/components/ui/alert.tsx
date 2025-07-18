import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: 'border-gray-200 bg-white text-gray-900',
    destructive: 'border-red-200 bg-red-50 text-red-900',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    success: 'border-green-200 bg-green-50 text-green-900'
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};
