import React from 'react';
import { motion } from 'framer-motion';

interface FilterControlsProps {
  showRejected: boolean;
  setShowRejected: (show: boolean) => void;
  showOnlyPending: boolean;
  setShowOnlyPending: (show: boolean) => void;
  onPreview: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  showRejected,
  setShowRejected,
  showOnlyPending,
  setShowOnlyPending,
  onPreview
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg border"
    >
      {/* Filter Toggles */}
      <div className="flex items-center gap-4">
        {/* Show Rejected Toggle */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRejected(!showRejected)}
              tabIndex={-1}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300
                ${showRejected ? 'bg-red-500' : 'bg-gray-300'}
              `}
            >
              <motion.span
                animate={{ x: showRejected ? 16 : 2 }}
                transition={{ duration: 0.2 }}
                className="inline-block h-3 w-3 transform rounded-full bg-white shadow-sm"
              />
            </motion.button>
            <span className="font-tahoma text-xs text-gray-700">
              Show only removed
            </span>
          </div>
          <div className="ml-11 text-xs text-gray-500 font-tahoma italic">
            (Cmd+Shift+R)
          </div>
        </div>

        {/* Show Only Pending Toggle */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              tabIndex={-1}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300
                ${showOnlyPending ? 'bg-orange-500' : 'bg-gray-300'}
              `}
            >
              <motion.span
                animate={{ x: showOnlyPending ? 16 : 2 }}
                transition={{ duration: 0.2 }}
                className="inline-block h-3 w-3 transform rounded-full bg-white shadow-sm"
              />
            </motion.button>
            <span className="font-tahoma text-xs text-gray-700">
              Show only pending
            </span>
          </div>
          <div className="ml-11 text-xs text-gray-500 font-tahoma italic">
            (Cmd+Shift+P)
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPreview}
        tabIndex={-1}
        className="px-4 py-2 bg-blue-500 text-white font-tahoma text-xs rounded hover:bg-blue-600 transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Preview
      </motion.button>
    </motion.div>
  );
};

export default FilterControls;