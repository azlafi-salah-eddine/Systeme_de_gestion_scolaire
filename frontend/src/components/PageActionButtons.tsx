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
        const buttonElement = {
          label: action.label,
          link: action.link,
          variant: action.variant || 'primary'
        };

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
