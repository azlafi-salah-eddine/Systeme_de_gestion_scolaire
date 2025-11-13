import React from 'react';
import { useNotification, type Notification } from '../contexts/NotificationContext';
import './NotificationContainer.css';

const NotificationContainer: React.FC = () => {
  const { notifications, dismissNotification } = useNotification();

  const getNotificationStyles = (type: Notification['type']) => {
    const baseStyles = "w-96 min-w-80 max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-lg pointer-events-auto ring-1 ring-black dark:ring-gray-700 ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-4 border-green-400 dark:border-green-500 shadow-green-100 dark:shadow-green-900/30`;
      case 'error':
        return `${baseStyles} border-l-4 border-red-400 dark:border-red-500 shadow-red-100 dark:shadow-red-900/30`;
      case 'warning':
        return `${baseStyles} border-l-4 border-yellow-400 dark:border-yellow-500 shadow-yellow-100 dark:shadow-yellow-900/30`;
      case 'info':
        return `${baseStyles} border-l-4 border-blue-400 dark:border-blue-500 shadow-blue-100 dark:shadow-blue-900/30`;
      default:
        return baseStyles;
    }
  };

  const getIconStyles = (type: Notification['type']) => {
    const baseStyles = "h-6 w-6";
    
    switch (type) {
      case 'success':
        return `${baseStyles} text-green-400 dark:text-green-500`;
      case 'error':
        return `${baseStyles} text-red-400 dark:text-red-500`;
      case 'warning':
        return `${baseStyles} text-yellow-400 dark:text-yellow-500`;
      case 'info':
        return `${baseStyles} text-blue-400 dark:text-blue-500`;
      default:
        return baseStyles;
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className={getIconStyles(type)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className={getIconStyles(type)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={getIconStyles(type)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className={getIconStyles(type)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`${getNotificationStyles(notification.type)} notification-item notification-enter`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
          role="alert"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1 pt-0.5 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white notification-text">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 notification-text">
                  {notification.message}
                </p>
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`text-sm font-medium ${
                          action.variant === 'danger'
                            ? 'text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300'
                            : action.variant === 'primary'
                            ? 'text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
