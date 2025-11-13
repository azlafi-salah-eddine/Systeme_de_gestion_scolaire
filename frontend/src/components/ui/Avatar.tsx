import React from 'react';
import classNames from 'classnames';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'rg';
  rounded?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  text?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  size = 'md',
  rounded = true,
  variant = 'primary',
  icon,
  text,
  className
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    rg: 'w-10 h-10 text-base'
  };

  const variantClasses = {
    primary: 'bg-indigo-500 dark:bg-indigo-600 text-white',
    secondary: 'bg-gray-500 dark:bg-gray-600 text-white',
    success: 'bg-green-500 dark:bg-green-600 text-white',
    warning: 'bg-yellow-500 dark:bg-yellow-600 text-white',
    danger: 'bg-red-500 dark:bg-red-600 text-white',
    info: 'bg-blue-500 dark:bg-blue-600 text-white'
  };

  const avatarClasses = classNames(
    'inline-flex items-center justify-center font-semibold',
    sizeClasses[size],
    variantClasses[variant],
    rounded ? 'rounded-full' : 'rounded',
    className
  );

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={classNames(
          'object-cover',
          sizeClasses[size],
          rounded ? 'rounded-full' : 'rounded',
          className
        )}
      />
    );
  }

  if (text) {
    return (
      <div className={avatarClasses}>
        {text}
      </div>
    );
  }

  if (icon) {
    return (
      <div className={avatarClasses}>
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div className={avatarClasses}>
      <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

export default Avatar;
