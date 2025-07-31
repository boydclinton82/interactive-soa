import React from 'react';
import { StrategyCardInfo } from '../types/strategies';

interface StrategyCardProps {
  strategy: StrategyCardInfo;
  isActive: boolean;
  onClick: () => void;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 mb-3 rounded-lg cursor-pointer transition-all duration-200
        ${isActive 
          ? 'bg-green-600 text-white shadow-lg transform scale-105' 
          : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
        }
      `}
    >
      <div className="flex items-center mb-2">
        <span className={`text-2xl mr-3 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
          {strategy.icon}
        </span>
        <h3 className={`font-tahoma text-sm font-bold ${isActive ? 'text-white' : 'text-gray-800'}`}>
          {strategy.title}
        </h3>
      </div>
      <p className={`font-tahoma text-xs ${isActive ? 'text-green-100' : 'text-gray-600'}`}>
        {strategy.description}
      </p>
    </div>
  );
};

export default StrategyCard;