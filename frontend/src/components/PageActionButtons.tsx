import React from 'react';
import PermissionGate from './PermissionGate';

interface PageActionButton {
  label: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  permission?: 'admin' | 'super_admin' | 'delete' | 'restore';
}

interface PageActionButtonsProps {
  actions: PageActionButton[];
}

const PageActionButtons: React.FC<PageActionButtonsProps> = ({ actions }) => {
  return (
    <>
      {actions.map((action, index) => {
        const buttonElement = (
          <a
            key={index}
            href={action.link}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition
              ${action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
              ${action.variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : ''}
              ${!action.variant || action.variant === 'primary' ? 'bg-primary-600 text-white hover:bg-primary-700' : ''}
              ${action.variant === 'secondary' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600' : ''}`}
          >
            {action.label}
          </a>
        );

        if (action.permission) {
            return (
              <PermissionGate key={index} permission={action.permission}>
                {buttonElement}
              </PermissionGate>
            );
        }
        return buttonElement;
      })}
    </>
  );
};

export default PageActionButtons;
