import React from 'react'
import classNames from 'classnames'

interface CardProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'cyan';
  children: React.ReactNode;
}

type CardComponent = React.FC<CardProps> & {
  Body: React.FC<BodyProps>;
  Header: React.FC<HeaderProps>;
  Footer: React.FC<FooterProps>;
};

const Card: CardComponent = ({ className, variant, children, ...props }) => {
  const wrapperClass = classNames({
    "border rounded-md": true,
    "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-900": !variant,
    "bg-primary-600 border-primary-600": variant === "primary",
    "bg-gray-600 border-gray-600": variant === "secondary",
    "bg-green-600 border-green-600": variant === "green",
    "bg-red-600 border-red-600": variant === "red",
    "bg-yellow-600 border-yellow-600": variant === "yellow",
    "bg-cyan-600 border-cyan-600": variant === "cyan",
    [`${className}`]: className,
  })
  return (
    <div className={wrapperClass} {...props}>{children}</div>
  )
}

interface BodyProps {
  className?: string;
  children: React.ReactNode;
}

const Body: React.FC<BodyProps> = ({ className, children, ...props }) => {
  const wrapperClass = classNames({
    "p-5 sm:p-6": true,
    [`${className}`]: className,
  })
  return (
    <div className={wrapperClass} {...props}>{children}</div>
  )
}

interface HeaderProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'cyan';
  children: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ className, variant, children, ...props }) => {
  const wrapperClass = classNames({
    "px-5 sm:px-6 py-3 sm:py-4 rounded-t-md border-b": true,
    "border-gray-300 dark:border-gray-900 bg-gray-100 dark:bg-gray-900": !variant,
    "bg-primary-700 bg-opacity-40 border-primary-700 border-opacity-70": variant === "primary",
    "bg-gray-700 bg-opacity-40 border-gray-700 border-opacity-70": variant === "secondary",
    "bg-green-700 bg-opacity-40 border-green-700 border-opacity-70": variant === "green",
    "bg-red-700 bg-opacity-40 border-red-700 border-opacity-70": variant === "red",
    "bg-yellow-700 bg-opacity-40 border-yellow-700 border-opacity-70": variant === "yellow",
    "bg-cyan-700 bg-opacity-40 border-cyan-700 border-opacity-70": variant === "cyan",
    [`${className}`]: className,
  })
  return (
    <div className={wrapperClass} {...props}>{children}</div>
  )
}

interface FooterProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'yellow' | 'cyan';
  children: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ className, variant, children, ...props }) => {
  const wrapperClass = classNames({
    "px-5 sm:px-6 py-3 sm:py-4 rounded-b-md border-t": true,
    "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800": !variant,
    "bg-primary-700 dark:bg-primary-800 bg-opacity-40 dark:bg-opacity-60 border-primary-700 dark:border-primary-800 border-opacity-70 dark:border-opacity-80": variant === "primary",
    "bg-gray-700 dark:bg-gray-800 bg-opacity-40 dark:bg-opacity-60 border-gray-700 dark:border-gray-800 border-opacity-70 dark:border-opacity-80": variant === "secondary",
    "bg-green-700 dark:bg-green-800 bg-opacity-40 dark:bg-opacity-60 border-green-700 dark:border-green-800 border-opacity-70 dark:border-opacity-80": variant === "green",
    "bg-red-700 dark:bg-red-800 bg-opacity-40 dark:bg-opacity-60 border-red-700 dark:border-red-800 border-opacity-70 dark:border-opacity-80": variant === "red",
    "bg-yellow-700 dark:bg-yellow-800 bg-opacity-40 dark:bg-opacity-60 border-yellow-700 dark:border-yellow-800 border-opacity-70 dark:border-opacity-80": variant === "yellow",
    "bg-cyan-700 dark:bg-cyan-800 bg-opacity-40 dark:bg-opacity-60 border-cyan-700 dark:border-cyan-800 border-opacity-70 dark:border-opacity-80": variant === "cyan",
    [`${className}`]: className,
  })
  return (
    <div className={wrapperClass} {...props}>{children}</div>
  )
}

Card.Body = Body as React.FC<BodyProps>;
Card.Header = Header as React.FC<HeaderProps>;
Card.Footer = Footer as React.FC<FooterProps>;

export default Card;
