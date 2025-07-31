import React from 'react';

interface HighlightedTextProps {
  id: string;
  type: 'currency' | 'frequency' | 'text' | 'loanType';
  children: string;
  className?: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ id, type, children, className = '' }) => {
  return (
    <span
      data-highlight-id={id}
      data-highlight-type={type}
      className={`bg-yellow-200 px-1 rounded ${className}`}
    >
      {children}
    </span>
  );
};

export default HighlightedText;