import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Icon from './Icon';

const DarkModeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="dropdown-toggle [&>*]:pointer-events-none peer inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
      title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {isDark ? (
        <Icon name="moon" className="text-lg leading-none text-slate-600 dark:text-slate-300" />
      ) : (
        <Icon name="sun" className="text-lg leading-none text-slate-600 dark:text-slate-300" />
      )}
    </button>
  );
};

export default DarkModeToggle;

