
import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs
                       bg-white text-gray-700 text-xs rounded-md py-1.5 px-3
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300
                       pointer-events-none shadow-lg border border-gray-200 z-10">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;