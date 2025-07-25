import React, { forwardRef } from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          text-sm font-medium leading-none text-gray-700
          peer-disabled:cursor-not-allowed peer-disabled:opacity-70
          ${className}
        `}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';
