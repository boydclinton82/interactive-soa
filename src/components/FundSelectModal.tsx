import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FundSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fundName: string) => void;
  currentValue?: string;
}

const FundSelectModal: React.FC<FundSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentValue
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const fundOptions = [
    'AustralianSuper',
    'CBUS Super',
    'Expand Extra Super',
    'Macquarie Super Consolidator II',
    'BT Panorma',
    'MLC Wrap Super Series 2',
    'Sunsuper'
  ];

  // Focus the modal when it opens
  useEffect(() => {
    if (isOpen) {
      // Set initial focus to current selection if any, otherwise first option
      const currentIndex = currentValue ? fundOptions.indexOf(currentValue) : 0;
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      
      // Focus the container
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, currentValue]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle number keys (1-7)
      const num = parseInt(e.key);
      if (num >= 1 && num <= fundOptions.length) {
        e.preventDefault();
        const selectedFund = fundOptions[num - 1];
        onSelect(selectedFund);
        onClose();
        return;
      }

      // Handle arrow keys
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % fundOptions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + fundOptions.length) % fundOptions.length);
        return;
      }

      // Handle Enter on focused option
      if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0) {
          onSelect(fundOptions[focusedIndex]);
          onClose();
        }
        return;
      }

      // Handle Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, fundOptions, onSelect, onClose]);

  // Handle option selection
  const handleOptionSelect = (fundName: string) => {
    onSelect(fundName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-tahoma text-lg font-bold text-black">
              Select Super Fund
            </h2>
          </div>

          {/* Fund Options */}
          <div 
            ref={containerRef}
            tabIndex={0}
            className="px-6 py-4 space-y-2 focus:outline-none"
          >
            {fundOptions.map((fund, index) => {
              const isFocused = focusedIndex === index;
              const isSelected = currentValue === fund;
              
              return (
                <motion.div
                  key={fund}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOptionSelect(fund)}
                  className={`
                    flex items-center gap-3 border rounded cursor-pointer transition-all duration-200 p-3
                    ${isSelected 
                      ? 'border-teal-500 bg-teal-50 shadow-md' 
                      : isFocused 
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm'
                    }
                  `}
                >
                  {/* Number badge */}
                  <div className={`
                    flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white
                    ${isSelected || isFocused ? 'bg-teal-600' : 'bg-gray-500'}
                  `}>
                    {index + 1}
                  </div>
                  
                  {/* Fund name */}
                  <span className="font-tahoma text-sm font-medium text-gray-900 flex-1">
                    {fund}
                  </span>
                  
                  {/* Selected indicator */}
                  <div className="flex items-center justify-center w-4 h-4">
                    {isSelected && (
                      <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-tahoma text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FundSelectModal;