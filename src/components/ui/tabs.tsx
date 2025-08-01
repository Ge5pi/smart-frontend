import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultValue,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  value,
  className = ''
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium
        transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        disabled:pointer-events-none disabled:opacity-50
        ${isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:bg-gray-200'
        }
        ${className}
      `}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({
  children,
  value,
  className = ''
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { activeTab } = context;

  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={`mt-2 ${className}`}>
      {children}
    </div>
  );
};
