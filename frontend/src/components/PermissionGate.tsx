import React, { type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGateProps {
  children: ReactNode;
  permission: 'delete' | 'restore' | 'admin' | 'super_admin' | 'force-delete';
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  children, 
  permission, 
  fallback = null 
}) => {
  const { canDelete, canRestore, isAdmin, isSuperAdmin } = useAuth();

  const hasPermission = () => {
    switch (permission) {
      case 'delete':
        return canDelete();
      case 'restore':
        return canRestore();
      case 'admin':
        return isAdmin();
      case 'super_admin':
      case 'force-delete':
        return isSuperAdmin();
      default:
        return false;
    }
  };

  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;
