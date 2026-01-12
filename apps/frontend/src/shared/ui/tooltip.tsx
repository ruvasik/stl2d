import React, { createContext, useContext, ReactNode } from 'react';

interface TooltipContextType {
  // Tooltip functionality can be added here if needed
}

const TooltipContext = createContext<TooltipContextType>({});

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <TooltipContext.Provider value={{}}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltip = () => useContext(TooltipContext);
