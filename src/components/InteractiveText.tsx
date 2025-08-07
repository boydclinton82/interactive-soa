import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InteractiveTextProps {
  id: string;
  type: 'currency' | 'frequency' | 'text';
  placeholder?: string;
  defaultValue?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  setFocusableRef?: (key: string, element: HTMLElement | null) => void;
  className?: string;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({
  id,
  type,
  placeholder = '',
  defaultValue = '',
  onFocus,
  onBlur,
  onChange,
  setFocusableRef,
  className = ''
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const frequencyOptions = ['monthly', 'fortnightly', 'weekly'];

  // Register with focus management system
  useEffect(() => {
    if (setFocusableRef) {
      const element = type === 'frequency' ? containerRef.current : inputRef.current;
      setFocusableRef(`interactive-${id}`, element);
    }
    return () => {
      if (setFocusableRef) {
        setFocusableRef(`interactive-${id}`, null);
      }
    };
  }, [id, setFocusableRef, type]);

  const formatCurrency = (val: string): string => {
    if (!val) return '';
    const numericValue = val.replace(/[^0-9]/g, '');
    const number = parseInt(numericValue);
    
    if (isNaN(number) || number === 0) return '';
    
    return number.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleInputChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleInputFocus = () => {
    onFocus?.();
  };

  const handleInputBlur = () => {
    onBlur?.();
  };

  // Frequency dropdown keyboard handling
  useEffect(() => {
    if (type !== 'frequency') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== containerRef.current) return;

      // Handle number keys (1, 2, 3) - only when expanded
      if (isExpanded) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= frequencyOptions.length) {
          e.preventDefault();
          const selectedOption = frequencyOptions[num - 1];
          handleInputChange(selectedOption);
          setIsExpanded(false);
          setFocusedIndex(-1);
          return;
        }
      }

      // Handle arrow keys - only when expanded
      if (isExpanded) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % frequencyOptions.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + frequencyOptions.length) % frequencyOptions.length);
          return;
        }
      }

      // Handle Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isExpanded) {
          setIsExpanded(true);
          setFocusedIndex(value ? frequencyOptions.indexOf(value) : 0);
        } else if (focusedIndex >= 0) {
          handleInputChange(frequencyOptions[focusedIndex]);
          setIsExpanded(false);
          setFocusedIndex(-1);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [type, isExpanded, focusedIndex, value]);

  const handleFrequencySelect = (option: string) => {
    handleInputChange(option);
    setIsExpanded(false);
    setFocusedIndex(-1);
  };

  const handleContainerClick = () => {
    if (type === 'frequency' && !isExpanded) {
      setIsExpanded(true);
      setFocusedIndex(value ? frequencyOptions.indexOf(value) : 0);
    }
  };

  const getDisplayValue = () => {
    if (type === 'currency' && value) {
      return formatCurrency(value);
    }
    return value || placeholder;
  };

  // Common styling - always yellow background, compact size, blue focus
  const baseClasses = `
    inline-block font-tahoma text-sm
    bg-yellow-200 border border-yellow-300 rounded
    focus:outline-none focus:ring-4 focus:ring-blue-600 focus:ring-opacity-90 
    focus:shadow-[0_0_0_4px_rgba(37,99,235,0.5)]
    transition-all duration-200
    ${className}
  `;

  if (type === 'frequency') {
    return (
      <div className="relative inline-block">
        <div
          ref={containerRef}
          tabIndex={0}
          className={`${baseClasses} cursor-pointer min-w-[6rem] px-2 py-1`}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        >
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-300 rounded shadow-lg min-w-[8rem]"
              >
                {frequencyOptions.map((option, index) => {
                  const isSelected = value === option;
                  const isFocused = focusedIndex === index;
                  
                  return (
                    <motion.div
                      key={option}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFrequencySelect(option)}
                      className={`
                        flex items-center gap-2 p-2 cursor-pointer transition-all duration-200
                        ${isSelected || isFocused 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <span className="font-tahoma text-sm text-gray-900 flex-1">
                        {option}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div onClick={handleContainerClick} className="text-gray-900">
                {getDisplayValue()}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Text and currency inputs
  const minWidth = type === 'currency' ? '5rem' : type === 'text' ? '6rem' : '4rem';
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      placeholder=""
      onChange={(e) => handleInputChange(e.target.value)}
      onFocus={handleInputFocus}
      onBlur={handleInputBlur}
      className={`${baseClasses} px-2 py-1`}
      style={{ 
        minWidth,
        width: `${Math.max(parseInt(minWidth), getDisplayValue().length + 2)}ch`
      }}
    />
  );
};

export default InteractiveText;