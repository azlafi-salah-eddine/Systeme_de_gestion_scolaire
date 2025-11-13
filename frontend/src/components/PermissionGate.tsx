import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGateProps {
  children: ReactNode;
  permission: 'delete' | 'restore' | 'admin' | 'super_admin';
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
        return isSuperAdmin();
      default:
        return false;
    }
  };

  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;
