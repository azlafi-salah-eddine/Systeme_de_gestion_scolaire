import React from 'react';
import Icon from './Icon';
import PermissionGate from './PermissionGate';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onRestore?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showView?: boolean;
  showRestore?: boolean;
  editTitle?: string;
  deleteTitle?: string;
  viewTitle?: string;
  restoreTitle?: string;
  className?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  onView,
  onRestore,
  showEdit = true,
  showDelete = true,
  showView = true,
  showRestore = false,
  editTitle = "Modifier",
  deleteTitle = "Supprimer",
  viewTitle = "Voir",
  restoreTitle = "Restaurer",
  className = "flex items-center space-x-2"
}) => {
  return (
    <div className={className}>
      {showView && onView && (
        <button
          onClick={onView}
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          title={viewTitle}
        >
          <Icon name="eye" size="sm" />
        </button>
      )}
      
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
          title={editTitle}
        >
          <Icon name="edit" size="sm" />
        </button>
      )}
      
      {showDelete && onDelete && (
        <PermissionGate permission="delete">
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title={deleteTitle}
          >
            <Icon name="trash" size="sm" />
          </button>
        </PermissionGate>
      )}
      
      {showRestore && onRestore && (
        <PermissionGate permission="restore">
          <button
            onClick={onRestore}
            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            title={restoreTitle}
          >
            <Icon name="refresh" size="sm" />
          </button>
        </PermissionGate>
      )}
    </div>
  );
};

export default ActionButtons;
