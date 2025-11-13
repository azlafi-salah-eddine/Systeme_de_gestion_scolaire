import React from 'react';
import Card from './ui/Card';
import Icon from './Icon';

interface StatCardProps {
  title: string;
  count: number;
  subtitle: string;
  color: 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'light-blue' | 'pink' | 'dark-blue';
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, subtitle, color, icon }) => {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    'light-blue': 'bg-cyan-500',
    pink: 'bg-pink-500',
    'dark-blue': 'bg-indigo-600'
  };

  return (
    <Card className="h-full">
      <Card.Body className={`${colorClasses[color]} text-white relative overflow-hidden`}>
        {/* Background Icon */}
        <div className="absolute top-4 right-4 opacity-20">
          <Icon name={icon} size="2xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="text-3xl font-bold mb-1">{count}</div>
          <div className="text-lg font-medium mb-1">{title}</div>
          <div className="text-sm opacity-90">{subtitle}</div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatCard;