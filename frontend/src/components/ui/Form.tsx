import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form: React.FC<FormProps> = ({ className = '', children, ...props }) => {
  return (
    <form className={`space-y-4 ${className}`} {...props}>
      {children}
    </form>
  );
};

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({ className = '', children }) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {children}
    </div>
  );
};

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({ className = '', children, required, ...props }) => {
  return (
    <label 
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`} 
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
};

interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ className = '', children }) => {
  return (
    <p className={`text-sm text-red-600 dark:text-red-400 ${className}`}>
      {children}
    </p>
  );
};

interface FormHelperTextProps {
  children: React.ReactNode;
  className?: string;
}

const FormHelperText: React.FC<FormHelperTextProps> = ({ className = '', children }) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

export { Form, FormGroup, FormLabel, FormError, FormHelperText };
