import React from 'react';

export interface Step {
  key: number | string;
  title: string;
  subtitle?: string;
}

interface StepperProps {
  steps: Step[];
  current: number; // 1-based index
  onStepClick?: (index: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, current }) => {
  // Une seule couleur pour tous - neutre et simple
  const getColorClass = (isActive: boolean, isCompleted: boolean) => {
    if (isActive || isCompleted) {
      return 'text-blue-600 dark:text-blue-400'; // Bleu pour actif et terminé
    }
    return 'text-gray-500 dark:text-gray-400'; // Gris pour les autres
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Steps */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = current === stepNumber;
          const isCompleted = stepNumber < current;
          const isUpcoming = stepNumber > current;
          
          return (
            <div key={step.key} className="flex flex-col items-center relative flex-1">
              {/* Step Container */}
              <div 
                className={`relative px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                {/* Step Title */}
                <div className={`text-xs font-medium ${getColorClass(isActive, isCompleted)} dark:text-gray-300 text-center`}>
                  Étape {stepNumber}
                </div>
                
                {/* Step Subtitle */}
                <div className={`text-xs ${getColorClass(isActive, isCompleted)} dark:text-gray-400 text-center mt-0.5`}>
                  {step.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Responsive Layout */}
      <div className="block md:hidden mt-4">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-blue-600 dark:bg-blue-700 text-white">
              {current}
            </div>
            <div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Étape {current}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-400">
                {steps[current - 1]?.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {current} sur {steps.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stepper;