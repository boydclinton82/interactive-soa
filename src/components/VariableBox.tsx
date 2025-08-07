import React from 'react';

interface VariableBoxProps {
  number: number;
  value: string;
  type: 'currency' | 'frequency' | 'text';
  placeholder: string;
}

const VariableBox: React.FC<VariableBoxProps> = ({ number, value, type, placeholder }) => {
  // Color schemes for different variable numbers
  const colorSchemes = [
    { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800', badge: 'bg-blue-500' },
    { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', badge: 'bg-green-500' },
    { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800', badge: 'bg-purple-500' },
    { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800', badge: 'bg-orange-500' },
    { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-800', badge: 'bg-pink-500' },
  ];

  const colors = colorSchemes[(number - 1) % colorSchemes.length];
  const hasValue = value && value.trim() !== '';
  
  const formatValue = (val: string) => {
    if (!val) return placeholder;
    
    if (type === 'currency') {
      const numericValue = val.replace(/[^0-9]/g, '');
      const number = parseInt(numericValue);
      if (isNaN(number) || number === 0) return placeholder;
      return number.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    
    return val;
  };

  return (
    <span 
      className={`
        inline-flex items-center px-2 py-1 rounded border-2 font-tahoma text-sm
        ${colors.bg} ${colors.border} ${colors.text}
        ${hasValue ? '' : 'gap-1'}
      `}
    >
      {/* Number badge - only show when empty */}
      {!hasValue && (
        <span className={`
          flex items-center justify-center w-4 h-4 rounded text-xs font-bold text-white
          ${colors.badge}
        `}>
          {number}
        </span>
      )}
      
      {/* Value or placeholder */}
      <span className="font-medium">
        {formatValue(value)}
      </span>
    </span>
  );
};

export default VariableBox;