import React from 'react';
import Icon from './Icon';
import PermissionGate from './PermissionGate';

interface TableActionButtonsProps {
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
  disabled?: boolean;
}

const TableActionButtons: React.FC<TableActionButtonsProps> = ({
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
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      {showView && onView && (
        <button
          onClick={onView}
          className="p-1 text-indigo-600 rounded-md hover:text-indigo-900 hover:bg-indigo-50 disabled:opacity-50"
          title={viewTitle}
          disabled={disabled}
        >
          <Icon name="eye" className="w-4 h-4" />
        </button>
      )}
      
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="p-1 text-blue-600 rounded-md hover:text-blue-900 hover:bg-blue-50 disabled:opacity-50"
          title={editTitle}
          disabled={disabled}
        >
          <Icon name="edit" className="w-4 h-4" />
        </button>
      )}
      
      {showDelete && onDelete && (
        <PermissionGate permission="delete">
          <button
            onClick={onDelete}
            className="p-1 text-red-600 rounded-md hover:text-red-900 hover:bg-red-50 disabled:opacity-50"
            title={deleteTitle}
            disabled={disabled}
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </PermissionGate>
      )}
      
      {showRestore && onRestore && (
        <PermissionGate permission="restore">
          <button
            onClick={onRestore}
            className="p-1 text-green-600 rounded-md hover:text-green-900 hover:bg-green-50 disabled:opacity-50"
            title={restoreTitle}
            disabled={disabled}
          >
            <Icon name="refresh" className="w-4 h-4" />
          </button>
        </PermissionGate>
      )}
    </div>
  );
};

export default TableActionButtons;
