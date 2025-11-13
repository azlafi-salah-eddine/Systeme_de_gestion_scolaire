import React, { Fragment } from 'react';
import { Menu } from '@headlessui/react';
import { Icon } from '../components';

const NotificationDropdown: React.FC = () => {
  // Mock notifications - vous pouvez remplacer par de vraies données
  const notifications = [
    {
      id: 1,
      title: 'Nouvel élève inscrit',
      message: 'Ahmed Alami a été inscrit en 6ème A',
      time: 'Il y a 5 minutes',
      type: 'success'
    },
    {
      id: 2,
      title: 'Paiement reçu',
      message: 'Paiement de 500 DH reçu de Sara Benali',
      time: 'Il y a 1 heure',
      type: 'info'
    },
    {
      id: 3,
      title: 'Absence signalée',
      message: 'Mohammed Hassan absent aujourd\'hui',
      time: 'Il y a 2 heures',
      type: 'warning'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'warning': return 'alert';
      case 'error': return 'x-circle';
      default: return 'info';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <Menu as="div" className="dropdown relative">
      {({ open }) => (
        <>
          <Menu.Button className="dropdown-toggle [&>*]:pointer-events-none peer inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900">
            <div className="relative inline-flex after:content-[''] after:absolute after:rounded-full after:end-0 after:top-px after:h-2.5 after:w-2.5 after:border-2 after:border-white dark:after:border-gray-950 after:bg-sky-400">
              <Icon name="bell" className="text-2xl leading-none text-slate-600 dark:text-slate-300" />
            </div>
          </Menu.Button>
          
          <Menu.Items modal={false} className="dropdown-menu absolute end-0 top-full mt-2.5 max-xs:min-w-[240px] max-xs:max-w-[240px] min-w-[320px] max-w-[320px] border border-t-3 border-gray-200 dark:border-gray-700 border-t-primary-600 bg-white dark:bg-gray-800 rounded shadow z-[1000]">
            {/* Header */}
            <div className="px-7 py-5 bg-slate-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-white">Notifications</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">{notifications.length} nouvelles</span>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto bg-white dark:bg-gray-800">
              {notifications.length > 0 ? (
                <ul className="py-3">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <Menu.Item as={Fragment}>
                        <button className="w-full px-7 py-3 flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                          <div className="flex-shrink-0 mt-1">
                            <Icon 
                              name={getNotificationIcon(notification.type)} 
                              className={`text-lg ${getNotificationColor(notification.type)}`} 
                            />
                          </div>
                          <div className="ms-3 flex-1 text-start">
                            <p className="text-sm font-medium text-slate-700 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </button>
                      </Menu.Item>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-7 py-8 text-center">
                  <Icon name="bell" className="text-4xl text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aucune notification</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-7 py-3 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
                <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  Voir toutes les notifications
                </button>
              </div>
            )}
          </Menu.Items>
        </>
      )}
    </Menu>
  );
};

export default NotificationDropdown;
