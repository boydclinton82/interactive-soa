import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MultiChoiceSelect from './MultiChoiceSelect';
import InsuranceSelect from './InsuranceSelect';

interface SuperTableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
  hasInsurance: string;
}

interface AddRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (row: Omit<SuperTableRow, 'id'>) => void;
  editingRow?: SuperTableRow | null;
}

const AddRowModal: React.FC<AddRowModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingRow
}) => {
  const [fundName, setFundName] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [typeOfRollover, setTypeOfRollover] = useState<string>('');
  const [hasInsurance, setHasInsurance] = useState<string>('');

  // Focus management for modal
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);
  const sectionRefs = React.useRef<{ [key: string]: HTMLElement | null }>({});

  const fundOptions = [
    'AustralianSuper',
    'CBUS Super',
    'Expand Extra Super',
    'Macquarie Super Consolidator II',
    'BT Panorma',
    'MLC Wrap Super Series 2'
  ];

  const ownerOptions = ['Jeff', 'Susan'];
  const rolloverOptions = ['Full rollover', 'Partial rollover'];

  const sections = ['fund', 'owner', 'rollover', 'insurance', 'submit'];

  // Focus management for modal sections
  const setFocusableRef = (key: string, element: HTMLElement | null) => {
    sectionRefs.current[key] = element;
  };

  // Focus current section
  const focusCurrentSection = () => {
    const sectionKey = sections[currentSectionIndex];
    const element = sectionRefs.current[sectionKey];
    if (element) {
      element.focus();
    }
  };

  // Initialize form with editing data or reset
  useEffect(() => {
    if (isOpen) {
      if (editingRow) {
        // Populate form with existing data
        setFundName(editingRow.fundName);
        setOwner(editingRow.owner);
        setTypeOfRollover(editingRow.typeOfRollover);
        setHasInsurance(editingRow.hasInsurance);
      } else {
        // Reset form for new row
        setFundName('');
        setOwner('');
        setTypeOfRollover('');
        setHasInsurance('');
      }
      setCurrentSectionIndex(0);
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        focusCurrentSection();
      }, 100);
    }
  }, [isOpen, editingRow]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate all fields are filled
    if (!fundName || !owner || !typeOfRollover || !hasInsurance) {
      return; // Could add validation feedback later
    }

    // Submit the data
    onSubmit({
      fundName,
      owner,
      typeOfRollover,
      hasInsurance
    });

    // Reset form
    setFundName('');
    setOwner('');
    setTypeOfRollover('');
    setHasInsurance('');
    
    // Close modal
    onClose();
  };

  // Submit with specific values (for auto-submit when state hasn't updated yet)
  const handleSubmitWithValues = (currentFundName: string, currentOwner: string, currentTypeOfRollover: string, currentHasInsurance: string) => {
    // Validate all fields are filled
    if (!currentFundName || !currentOwner || !currentTypeOfRollover || !currentHasInsurance) {
      return;
    }

    // Submit the data
    onSubmit({
      fundName: currentFundName,
      owner: currentOwner,
      typeOfRollover: currentTypeOfRollover,
      hasInsurance: currentHasInsurance
    });

    // Reset form
    setFundName('');
    setOwner('');
    setTypeOfRollover('');
    setHasInsurance('');
    
    // Close modal
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFundName('');
    setOwner('');
    setTypeOfRollover('');
    setHasInsurance('');
    setCurrentSectionIndex(0);
    onClose();
  };

  // Auto-advance to next section when option is selected
  const handleSectionComplete = () => {
    if (currentSectionIndex < sections.length - 2) { // Stop before submit button
      setTimeout(() => {
        setCurrentSectionIndex(prev => prev + 1);
      }, 200); // Small delay for smooth transition
    }
  };

  // Handle keyboard events for modal navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Up/Down arrows to navigate between sections
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        if (e.key === 'ArrowUp' && currentSectionIndex > 0) {
          setCurrentSectionIndex(prev => prev - 1);
        } else if (e.key === 'ArrowDown' && currentSectionIndex < sections.length - 1) {
          setCurrentSectionIndex(prev => prev + 1);
        }
        
        // Focus will be handled by useEffect below
        return;
      }

      // Enter to submit if all fields filled or if submit button is focused
      if (e.key === 'Enter' || e.key === 'Return') {
        // If submit button is focused, always submit
        if (currentSectionIndex === 4 && fundName && owner && typeOfRollover && hasInsurance) {
          e.preventDefault();
          handleSubmit();
          return;
        }
        
        // Only check for submit if not expanding/collapsing a dropdown
        const activeElement = document.activeElement;
        const isDropdownFocused = activeElement && (
          activeElement.getAttribute('tabindex') === '0' &&
          activeElement.getAttribute('class')?.includes('focus:ring-blue-600')
        );
        
        if (!isDropdownFocused && fundName && owner && typeOfRollover && hasInsurance) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSectionIndex, sections.length, fundName, owner, typeOfRollover, hasInsurance]);

  // Focus current section when index changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        focusCurrentSection();
      }, 50);
    }
  }, [currentSectionIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
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
              {editingRow ? 'Edit Super Fund Row' : 'Add Super Fund Row'}
            </h2>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Fund Name */}
            <div className={`p-3 rounded-lg transition-all duration-200 ${
              currentSectionIndex === 0 ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-transparent'
            }`}>
              <label className="block font-tahoma text-sm font-bold text-black mb-2">
                Fund Name
              </label>
              <MultiChoiceSelect
                options={fundOptions}
                value={fundName}
                onChange={(value) => {
                  setFundName(value);
                  handleSectionComplete();
                }}
                placeholder="Select fund..."
                setFocusableRef={setFocusableRef}
                focusKey="fund"
              />
            </div>

            {/* Owner */}
            <div className={`p-3 rounded-lg transition-all duration-200 ${
              currentSectionIndex === 1 ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-transparent'
            }`}>
              <label className="block font-tahoma text-sm font-bold text-black mb-2">
                Owner
              </label>
              <MultiChoiceSelect
                options={ownerOptions}
                value={owner}
                onChange={(value) => {
                  setOwner(value);
                  handleSectionComplete();
                }}
                placeholder="Select owner..."
                setFocusableRef={setFocusableRef}
                focusKey="owner"
              />
            </div>

            {/* Type of Rollover */}
            <div className={`p-3 rounded-lg transition-all duration-200 ${
              currentSectionIndex === 2 ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-transparent'
            }`}>
              <label className="block font-tahoma text-sm font-bold text-black mb-2">
                Type of Rollover
              </label>
              <MultiChoiceSelect
                options={rolloverOptions}
                value={typeOfRollover}
                onChange={(value) => {
                  setTypeOfRollover(value);
                  handleSectionComplete();
                }}
                placeholder="Select type..."
                setFocusableRef={setFocusableRef}
                focusKey="rollover"
              />
            </div>

            {/* Insurance */}
            <div className={`p-3 rounded-lg transition-all duration-200 ${
              currentSectionIndex === 3 ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-transparent'
            }`}>
              <label className="block font-tahoma text-sm font-bold text-black mb-2">
                Does it have insurance?
              </label>
              <InsuranceSelect
                value={hasInsurance}
                onChange={(value) => {
                  setHasInsurance(value);
                  // Check if all fields will be filled after this change
                  if (fundName && owner && typeOfRollover && value) {
                    // All fields will be filled, auto-submit with current values
                    setTimeout(() => {
                      handleSubmitWithValues(fundName, owner, typeOfRollover, value);
                    }, 200);
                  } else {
                    handleSectionComplete(); // Normal advancement logic
                  }
                }}
                placeholder="Select option..."
                setFocusableRef={setFocusableRef}
                focusKey="insurance"
              />
            </div>
          </form>

          {/* Footer */}
          <div className={`px-6 py-4 border-t border-gray-200 flex justify-end gap-3 transition-all duration-200 ${
            currentSectionIndex === 4 ? 'ring-2 ring-blue-500 bg-blue-50 rounded-b-lg' : 'bg-transparent'
          }`}>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 font-tahoma text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              ref={(el) => setFocusableRef('submit', el)}
              type="button"
              onClick={() => handleSubmit()}
              disabled={!fundName || !owner || !typeOfRollover || !hasInsurance}
              className={`
                px-4 py-2 font-tahoma text-sm rounded transition-all duration-200
                ${(!fundName || !owner || !typeOfRollover || !hasInsurance)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow-md'
                }
                ${currentSectionIndex === 4 && fundName && owner && typeOfRollover && hasInsurance 
                  ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                }
              `}
            >
              Enter
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddRowModal;