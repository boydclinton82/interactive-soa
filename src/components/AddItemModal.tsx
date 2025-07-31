import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  title: string; // e.g., "Add Benefit" or "Add Consideration"
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title
}) => {
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setText('');
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate text is not empty
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    // Submit the text
    onSubmit(trimmedText);

    // Reset and close
    setText('');
    onClose();
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Enter/Return to submit (but allow Shift+Enter for new lines)
      if ((e.key === 'Enter' || e.key === 'Return') && !e.shiftKey) {
        const trimmedText = text.trim();
        if (trimmedText) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, text]);

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
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-tahoma text-lg font-bold text-black">
              {title}
            </h2>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="mb-4">
              <label className="block font-tahoma text-sm font-bold text-black mb-2">
                Enter your text:
              </label>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-tahoma text-sm resize-vertical min-h-[100px]"
              />
              <p className="mt-1 text-xs text-gray-500 font-tahoma">
                Press Shift+Enter for new line, Enter to submit
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 font-tahoma text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!text.trim()}
              className={`
                px-4 py-2 font-tahoma text-sm rounded transition-all duration-200
                ${!text.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow-md'
                }
              `}
            >
              Add
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddItemModal;