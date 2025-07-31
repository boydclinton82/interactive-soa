import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiChoiceSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  setFocusableRef: (key: string, element: HTMLElement | null) => void;
  focusKey: string;
  compact?: boolean; // For table usage - smaller size
}

const MultiChoiceSelect: React.FC<MultiChoiceSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  setFocusableRef,
  focusKey,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for no selection, collapse after selection
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Color schemes for different options
  const colorSchemes = [
    { bg: 'bg-blue-50', border: 'border-blue-500', badge: 'bg-blue-500', hoverBg: 'hover:bg-blue-100' },
    { bg: 'bg-yellow-50', border: 'border-yellow-500', badge: 'bg-yellow-500', hoverBg: 'hover:bg-yellow-100' },
    { bg: 'bg-purple-50', border: 'border-purple-500', badge: 'bg-purple-500', hoverBg: 'hover:bg-purple-100' },
    { bg: 'bg-orange-50', border: 'border-orange-500', badge: 'bg-orange-500', hoverBg: 'hover:bg-orange-100' },
    { bg: 'bg-pink-50', border: 'border-pink-500', badge: 'bg-pink-500', hoverBg: 'hover:bg-pink-100' },
  ];

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this component is focused
      if (document.activeElement !== containerRef.current) return;

      // Handle number keys (1, 2, 3...) - only when expanded
      if (isExpanded) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= options.length) {
          e.preventDefault();
          const selectedOption = options[num - 1];
          onChange(selectedOption);
          setIsExpanded(false);
          setFocusedIndex(-1);
          return;
        }
      }

      // Handle arrow keys - only when expanded
      if (isExpanded) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % options.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + options.length) % options.length);
          return;
        }
      }

      // Handle Enter on focused option or to expand when collapsed
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!isExpanded) {
          setIsExpanded(true);
          setFocusedIndex(value ? options.indexOf(value) : 0);
        } else if (focusedIndex >= 0) {
          onChange(options[focusedIndex]);
          setIsExpanded(false);
          setFocusedIndex(-1);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, focusedIndex, options, value, onChange]);

  // Handle option selection
  const handleOptionSelect = (option: string) => {
    onChange(option);
    setIsExpanded(false); // Collapse after selection
    setFocusedIndex(-1);
  };

  // Handle container click to expand when collapsed
  const handleContainerClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setFocusedIndex(value ? options.indexOf(value) : 0);
    }
  };

  // Auto-expand if no value is selected
  React.useEffect(() => {
    if (!value) {
      setIsExpanded(true);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div
        ref={(el) => {
          containerRef.current = el;
          setFocusableRef(focusKey, el);
        }}
        tabIndex={0}
        className="focus:outline-none focus:ring-4 focus:ring-blue-600 focus:ring-opacity-90 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.5)] rounded"
        onFocus={() => {
          // Focus handling for integration with existing focus management
        }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            // Expanded state - show all options with beautiful colors by default
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={compact ? "space-y-1" : "space-y-2"}
            >
              {options.map((option, index) => {
                const colors = colorSchemes[index % colorSchemes.length];
                const isSelected = value === option;
                const isFocused = focusedIndex === index;
                
                return (
                  <motion.div
                    key={option}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(option)}
                    className={`
                      flex items-center gap-3 border rounded cursor-pointer transition-all duration-200
                      ${compact ? 'p-2' : 'p-3'}
                      ${isSelected 
                        ? `${colors.border} ${colors.bg} shadow-md` 
                        : isFocused 
                          ? `${colors.border} ${colors.bg} shadow-md`
                          : `${colors.border} ${colors.bg} ${colors.hoverBg} hover:shadow-sm`
                      }
                    `}
                  >
                    {/* Number badge */}
                    <div className={`
                      flex items-center justify-center rounded text-xs font-bold text-white
                      ${compact ? 'w-5 h-5' : 'w-6 h-6'}
                      ${colors.badge}
                    `}>
                      {index + 1}
                    </div>
                    {/* Option text */}
                    <span className={`font-tahoma font-medium text-gray-900 flex-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                      {option}
                    </span>
                    {/* Selected indicator - always reserve space to prevent layout shift */}
                    <div className="flex items-center justify-center w-4 h-4">
                      {isSelected && (
                        <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            // Collapsed state - show selected option with plain black border and white background
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleContainerClick}
              className={`
                border rounded cursor-pointer hover:shadow-sm transition-all duration-200
                ${compact ? 'p-2' : 'p-3'}
                ${value 
                  ? 'border-black bg-white hover:bg-gray-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
              `}
            >
              <span className={`font-tahoma font-medium ${compact ? 'text-xs' : 'text-sm'} ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                {value || placeholder}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MultiChoiceSelect;