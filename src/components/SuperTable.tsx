import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MultiChoiceSelect from './MultiChoiceSelect';

interface TableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
}

interface SuperTableProps {
  rows: TableRow[];
  setRows: React.Dispatch<React.SetStateAction<TableRow[]>>;
  setFocusableRef: (key: string, element: HTMLElement | null) => void;
  onNavigateToElement?: (elementKey: string) => void;
  onOpenFundModal?: (rowId: string) => void;
}

const SuperTable: React.FC<SuperTableProps> = ({ rows, setRows, setFocusableRef, onNavigateToElement, onOpenFundModal }) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [lastAddedRowId, setLastAddedRowId] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const ownerOptions = ['Jeff', 'Susan'];
  const rolloverOptions = ['Full rollover', 'Partial rollover'];

  const addRow = () => {
    const newRowId = Date.now().toString();
    const newRow: TableRow = {
      id: newRowId,
      fundName: '',
      owner: '',
      typeOfRollover: ''
    };
    setRows([...rows, newRow]);
    setLastAddedRowId(newRowId);
  };

  // Focus on the new row's fund name input after it's added
  useEffect(() => {
    if (lastAddedRowId && inputRefs.current[lastAddedRowId]) {
      const timer = setTimeout(() => {
        inputRefs.current[lastAddedRowId]?.focus();
        setLastAddedRowId(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastAddedRowId]);

  const handleFundNameClick = (rowId: string) => {
    if (onOpenFundModal) {
      onOpenFundModal(rowId);
    }
  };

  const handleFundNameKeyDown = (e: React.KeyboardEvent, rowId: string) => {
    if (e.key === 'Enter' || e.key === 'Return') {
      e.preventDefault();
      // Open fund modal on Enter
      if (onOpenFundModal) {
        onOpenFundModal(rowId);
      }
    }
  };

  const handleAddRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Return' || e.key.toLowerCase() === 'a') {
      e.preventDefault();
      addRow();
    }
  };

  const updateRow = (id: string, field: keyof TableRow, value: string) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  return (
    <div className="mb-6">
      <motion.table 
        className="w-full border-collapse"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Row */}
        <thead>
          <tr>
            <th className="bg-teal-600 text-white font-tahoma text-xs font-normal px-3 py-2 text-center border border-gray-300">
              Fund Name
            </th>
            <th className="bg-teal-600 text-white font-tahoma text-xs font-normal px-3 py-2 text-center border border-gray-300">
              Owner
            </th>
            <th className="bg-teal-600 text-white font-tahoma text-xs font-normal px-3 py-2 text-center border border-gray-300">
              Type of rollover
            </th>
          </tr>
        </thead>
        
        <tbody>
          <AnimatePresence>
            {rows.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredRow(row.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className="group"
              >
                {/* Fund Name Cell */}
                <td className="border border-gray-300 px-3 py-2 bg-white relative text-center">
                  <div className="mx-2">
                    <button
                      ref={(el) => { 
                        setFocusableRef(`table-input-${row.id}`, el);
                      }}
                      onClick={() => handleFundNameClick(row.id)}
                      onKeyDown={(e) => handleFundNameKeyDown(e, row.id)}
                      className="w-full border rounded p-2 bg-white border-black hover:bg-gray-50 transition-all duration-200 focus:ring-4 focus:ring-blue-600 focus:ring-opacity-90 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.5)] focus:outline-none cursor-pointer"
                    >
                      <span className={`font-tahoma text-xs text-center block ${row.fundName ? 'text-gray-900' : 'text-gray-500'}`}>
                        {row.fundName || 'Enter fund name...'}
                      </span>
                    </button>
                  </div>
                </td>

                {/* Owner Cell */}
                <td className="border border-gray-300 px-3 py-2 bg-white relative text-center">
                  <div className="mx-2">
                    <MultiChoiceSelect
                      options={ownerOptions}
                      value={row.owner}
                      onChange={(value) => updateRow(row.id, 'owner', value)}
                      placeholder="Select owner..."
                      setFocusableRef={setFocusableRef}
                      focusKey={`table-owner-${row.id}`}
                      compact={true}
                    />
                  </div>
                </td>

                {/* Type of Rollover Cell */}
                <td className="border border-gray-300 px-3 py-2 bg-white relative text-center">
                  <div className="mx-2">
                    <MultiChoiceSelect
                      options={rolloverOptions}
                      value={row.typeOfRollover}
                      onChange={(value) => updateRow(row.id, 'typeOfRollover', value)}
                      placeholder="Select type..."
                      setFocusableRef={setFocusableRef}
                      focusKey={`table-rollover-${row.id}`}
                      compact={true}
                    />
                  </div>
                  
                  {/* Remove button for multiple rows */}
                  {rows.length > 1 && hoveredRow === row.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => removeRow(row.id)}
                      className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
                      title="Remove row"
                    >
                      ×
                    </motion.button>
                  )}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
          
          {/* Add Row as Table Row */}
          <tr>
            <td colSpan={3} className="border border-gray-300 px-3 py-2 bg-white text-center">
              <div className="mx-2">
                <motion.button
                  ref={(el) => setFocusableRef('add-row-button', el)}
                  onClick={addRow}
                  onKeyDown={handleAddRowKeyDown}
                  className="w-full border rounded p-2 bg-white border-black hover:bg-gray-50 focus:ring-4 focus:ring-blue-600 focus:ring-opacity-90 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.5)] focus:outline-none transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-tahoma text-xs text-gray-700">
                    + Add Row
                  </span>
                </motion.button>
              </div>
            </td>
          </tr>
        </tbody>
      </motion.table>

    </div>
  );
};

export default SuperTable;