import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  iconBg?: string;
}

export function MetricCard({ title, value, change, icon, iconBg }: MetricCardProps) {
  return (
    <div className="bg-dark-bgSecondary rounded-2xl shadow-2xl p-6 border border-dark-border hover:border-green-500/50 hover:shadow-green-500/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg || 'bg-gradient-to-br from-gray-500 to-gray-600'} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-dark-textSecondary">{title}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-3xl font-bold text-dark-text group-hover:text-green-400 transition-colors duration-300">
          {value}
        </p>
        
        {change && (
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              change.type === 'increase' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <svg 
                className={`w-3 h-3 mr-1 ${change.type === 'increase' ? 'rotate-0' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
              {change.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}