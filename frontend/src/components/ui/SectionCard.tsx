import React from 'react';

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, actions, children, className = '', ...rest }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm ${className}`} {...rest}>
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {actions}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default SectionCard;


