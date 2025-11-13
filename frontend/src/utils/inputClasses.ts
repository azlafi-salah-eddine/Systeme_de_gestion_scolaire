/**
 * Utility function to generate input classes with dark mode support
 */
export const getInputClasses = (error?: boolean, className?: string) => {
  const baseClasses = "w-full px-3 py-2 text-sm rounded-lg border transition-all";
  const normalClasses = "bg-white text-gray-900 placeholder-gray-400 border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const darkClasses = "dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-600 dark:focus:border-primary-500 dark:focus:ring-primary-500";
  const errorClasses = error 
    ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500" 
    : "";
  
  return `${baseClasses} ${normalClasses} ${darkClasses} ${errorClasses} ${className || ''}`;
};

export const getTextareaClasses = (error?: boolean, className?: string) => {
  return getInputClasses(error, className);
};

export const getSelectClasses = (error?: boolean, className?: string) => {
  return getInputClasses(error, className);
};

export const getLabelClasses = (className?: string) => {
  return `block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${className || ''}`;
};

