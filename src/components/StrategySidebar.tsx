import React from 'react';
import StrategyCard from './StrategyCard';
import { StrategyType, StrategyCardInfo } from '../types/strategies';

interface StrategySidebarProps {
  activeStrategy: StrategyType;
  onStrategyChange: (strategy: StrategyType) => void;
}

const strategies: StrategyCardInfo[] = [
  {
    id: 'consolidation',
    title: 'Consolidate Superannuation',
    icon: '🏦',
    description: 'Combine multiple super funds into one for better management'
  },
  {
    id: 'loanRepayment',
    title: 'Alter Loan Repayments',
    icon: '💰',
    description: 'Optimize your loan repayment strategy to save on interest'
  }
];

const StrategySidebar: React.FC<StrategySidebarProps> = ({ activeStrategy, onStrategyChange }) => {
  return (
    <div className="w-72 bg-gray-100 h-screen fixed left-0 top-0 p-6 overflow-y-auto shadow-lg">
      <h2 className="font-tahoma text-lg font-bold text-gray-800 mb-6">
        Strategy Selection
      </h2>
      
      <div className="space-y-3">
        {strategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            isActive={activeStrategy === strategy.id}
            onClick={() => onStrategyChange(strategy.id)}
          />
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-200 rounded-lg">
        <p className="font-tahoma text-xs text-gray-600">
          Click on a strategy to view and edit its details. All changes are saved automatically.
        </p>
      </div>
    </div>
  );
};

export default StrategySidebar;