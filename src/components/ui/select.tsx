import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = ''
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  const { isOpen, setIsOpen } = context;

  return (
    <button
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300
        bg-white px-3 py-2 text-sm placeholder:text-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder = 'Выберите...',
  className = ''
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  const { value } = context;

  return (
    <span className={`block truncate ${!value ? 'text-gray-500' : ''} ${className}`}>
      {value || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = ''
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div className={`
      absolute z-50 min-w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg
      max-h-60 overflow-auto
      ${className}
    `}>
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({
  children,
  value,
  className = ''
}) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const { value: selectedValue, onValueChange, setIsOpen } = context;
  const isSelected = selectedValue === value;

  return (
    <div
      className={`
        relative flex cursor-pointer items-center px-3 py-2 text-sm
        hover:bg-gray-100 focus:bg-gray-100
        ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
        ${className}
      `}
      onClick={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
    >
      {children}
      {isSelected && (
        <Check className="ml-auto h-4 w-4" />
      )}
    </div>
  );
};
