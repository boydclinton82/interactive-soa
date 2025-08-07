import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (variables: {[key: string]: string}) => void;
  initialValues: {[key: string]: string};
}

const VariablesModal: React.FC<VariablesModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialValues
}) => {
  const [variables, setVariables] = useState<{[key: string]: string}>({
    var1: '', // subtitle-amount (currency)
    var2: '', // subtitle-frequency (frequency)
    var3: '', // subtitle-loan-type (text)
    var4: '', // benefit4-amount (currency)
    var5: '', // benefit4-frequency & benefit5-frequency (frequency)
  });

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fieldRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);
  const variableDefinitions = [
    {
      key: 'var1',
      label: 'Debt Repayment Amount',
      placeholder: 'e.g., 1500',
      type: 'currency',
      description: 'Monthly/fortnightly/weekly payment amount',
      color: 'bg-blue-500'
    },
    {
      key: 'var2',
      label: 'Payment Frequency',
      placeholder: 'monthly, fortnightly, or weekly',
      type: 'frequency',
      description: 'How often payments are made',
      color: 'bg-green-500'
    },
    {
      key: 'var3',
      label: 'Loan Type',
      placeholder: 'e.g., home loan, investment loan',
      type: 'text',
      description: 'Type of loan being repaid',
      color: 'bg-purple-500'
    },
    {
      key: 'var4',
      label: 'Cash Flow Amount',
      placeholder: 'e.g., 800',
      type: 'currency',
      description: 'Amount freed up in cash flow',
      color: 'bg-orange-500'
    },
    {
      key: 'var5',
      label: 'New Payment Frequency',
      placeholder: 'fortnightly or weekly',
      type: 'frequency',
      description: 'Recommended new payment frequency',
      color: 'bg-pink-500'
    }
  ];

  // Load initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setVariables({
        var1: initialValues['subtitle-amount'] || '',
        var2: initialValues['subtitle-frequency'] || '',
        var3: initialValues['subtitle-loan-type'] || '',
        var4: initialValues['benefit4-amount'] || '',
        var5: initialValues['benefit4-frequency'] || initialValues['benefit5-frequency'] || '',
      });
      setCurrentFieldIndex(0);
      // Focus first field after modal opens
      setTimeout(() => {
        fieldRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, initialValues]);

  // Check if all fields are filled and auto-close
  useEffect(() => {
    const allFieldsFilled = variableDefinitions.every(def => {
      const value = variables[def.key];
      return value && value.trim() !== '';
    });

    if (allFieldsFilled && isOpen) {
      // Auto-submit after a short delay
      setTimeout(() => {
        handleSubmit();
      }, 500);
    }
  }, [variables, isOpen, variableDefinitions]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Map back to the original keys
    const mappedVariables = {
      'subtitle-amount': variables.var1,
      'subtitle-frequency': variables.var2,
      'subtitle-loan-type': variables.var3,
      'benefit4-amount': variables.var4,
      'benefit4-frequency': variables.var5,
      'benefit5-frequency': variables.var5, // Same value for both frequency fields
    };
    
    onSubmit(mappedVariables);
    onClose();
  };

  const handleInputChange = (key: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if dropdown is open
      if (isDropdownOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentFieldIndex + 1, variableDefinitions.length - 1);
        setCurrentFieldIndex(nextIndex);
        fieldRefs.current[nextIndex]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentFieldIndex - 1, 0);
        setCurrentFieldIndex(prevIndex);
        fieldRefs.current[prevIndex]?.focus();
      } else if (e.key === 'Enter') {
        const currentField = variableDefinitions[currentFieldIndex];
        if (currentField.type === 'frequency') {
          e.preventDefault();
          const select = fieldRefs.current[currentFieldIndex] as HTMLSelectElement;
          if (select) {
            select.click();
            setIsDropdownOpen(true);
          }
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentFieldIndex, isDropdownOpen, onClose]);

  const handleFieldFocus = (index: number) => {
    setCurrentFieldIndex(index);
  };

  const handleDropdownChange = (key: string, value: string) => {
    handleInputChange(key, value);
    setIsDropdownOpen(false);
    // Move to next field after dropdown selection
    const nextIndex = Math.min(currentFieldIndex + 1, variableDefinitions.length - 1);
    if (nextIndex !== currentFieldIndex) {
      setTimeout(() => {
        setCurrentFieldIndex(nextIndex);
        fieldRefs.current[nextIndex]?.focus();
      }, 100);
    }
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
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-tahoma font-bold text-gray-900">
              Enter Variables
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {variableDefinitions.map((variable, index) => (
                <div key={variable.key} className="group">
                  {/* Label */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`
                      flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shadow-sm
                      ${variable.color}
                    `}>
                      {index + 1}
                    </span>
                    <div>
                      <label className="font-tahoma font-semibold text-gray-800 text-sm">
                        {variable.label}
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {variable.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Input Field */}
                  <div className="ml-10">
                    {variable.type === 'frequency' ? (
                      <select
                        ref={(el) => { fieldRefs.current[index] = el; }}
                        value={variables[variable.key]}
                        onChange={(e) => handleDropdownChange(variable.key, e.target.value)}
                        onFocus={() => handleFieldFocus(index)}
                        onBlur={() => setIsDropdownOpen(false)}
                        className={`
                          w-full px-4 py-3 border-2 rounded-lg shadow-sm 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                          font-tahoma text-sm transition-all duration-200
                          ${currentFieldIndex === index ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
                          hover:border-gray-300
                        `}
                      >
                        <option value="">Select {variable.label.toLowerCase()}...</option>
                        <option value="monthly">Monthly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    ) : (
                      <input
                        ref={(el) => { fieldRefs.current[index] = el; }}
                        type="text"
                        placeholder={variable.placeholder}
                        value={variables[variable.key]}
                        onChange={(e) => handleInputChange(variable.key, e.target.value)}
                        onFocus={() => handleFieldFocus(index)}
                        className={`
                          w-full px-4 py-3 border-2 rounded-lg shadow-sm 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                          font-tahoma text-sm transition-all duration-200
                          ${currentFieldIndex === index ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
                          hover:border-gray-300
                        `}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with instructions */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 font-tahoma">
                <strong>Keyboard shortcuts:</strong> Use ↑↓ arrows to navigate fields, Enter to open dropdowns, Esc to close.
                Modal will auto-close when all fields are completed.
              </p>
            </div>

            {/* Buttons - Hidden by default, form will auto-submit */}
            <div className="hidden mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-tahoma text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-tahoma font-medium text-sm"
              >
                Apply Variables
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VariablesModal;