import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import Icon from '../Icon';

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface ActionItem {
  label: string;
  link?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  icon?: string;
  hidden?: boolean;
}

interface PageHeadProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ActionItem[];
  children?: React.ReactNode;
}

const PageHead: React.FC<PageHeadProps> = ({ 
  title, 
  subtitle, 
  breadcrumb, 
  actions, 
  children 
}) => {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumb.map((item, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <Icon name="chevron-right" size="sm" className="text-gray-400 dark:text-gray-500 mx-1" />
                )}
                {index === breadcrumb.length - 1 || !item.link ? (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.link}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <div className="flex flex-col sm:flex-row gap-2">
              {actions.filter(action => !action.hidden).map((action, index) => (
                <div key={index}>
                  {action.link ? (
                    <Link to={action.link}>
                      <Button variant={action.variant || 'primary'}>
                        {action.icon && <Icon name={action.icon} />}
                        <span className={action.icon ? 'ml-2' : ''}>{action.label}</span>
                      </Button>
                    </Link>
                  ) : (
      <Button 
                      variant={action.variant || 'primary'}
                      onClick={action.onClick}
      >
                      {action.icon && <Icon name={action.icon} />}
                      <span className={action.icon ? 'ml-2' : ''}>{action.label}</span>
      </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional content */}
      {children && (
        <div className="mt-4">
        {children}
      </div>
      )}
    </div>
  );
};

export default PageHead;
