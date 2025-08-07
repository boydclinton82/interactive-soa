import React from 'react';
import { StrategyCardInfo } from '../types/strategies';

interface StrategyCardProps {
  strategy: StrategyCardInfo;
  isActive: boolean;
  onClick: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{strategy.icon}</span>
        <div className="flex-1">
          <h3 className={`font-tahoma text-sm font-bold ${
            isActive ? 'text-blue-900' : 'text-gray-800'
          }`}>
            {strategy.title}
          </h3>
          <p className={`font-tahoma text-xs mt-1 ${
            isActive ? 'text-blue-700' : 'text-gray-600'
          }`}>
            {strategy.description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default StrategyCard;