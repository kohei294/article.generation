import React from 'react';
import { AppStep } from '../types';

interface HeaderProps {
  currentStep: AppStep;
  setCurrentStep: (step: AppStep) => void;
}

const Header: React.FC<HeaderProps> = ({ currentStep, setCurrentStep }) => {
  const navItems = [
    { step: AppStep.Preparation },
    { step: AppStep.Creation },
    { step: AppStep.Analysis },
  ];

  return (
    <header className="flex flex-col items-center space-y-6">
      <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
        AI SEO Content Assistant
      </h1>
      <nav>
        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              className={`px-3 py-1 text-lg font-medium transition-colors duration-200 relative ${
                currentStep === item.step
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.step}
              {currentStep === item.step && (
                <span className="absolute bottom-[-10px] left-0 right-0 h-1 bg-blue-600 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;