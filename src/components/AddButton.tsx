import React from 'react';
import { motion } from 'framer-motion';

interface AddButtonProps {
  onClick: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full hover:border-gray-400 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      <span className="text-lg leading-none font-light">+</span>
      <span className="font-tahoma text-xs text-black font-medium">Add</span>
    </motion.button>
  );
};

export default AddButton;