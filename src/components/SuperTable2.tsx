import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuperTableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
  hasInsurance: string;
}

interface SuperTable2Props {
  rows: SuperTableRow[];
  setRows: React.Dispatch<React.SetStateAction<SuperTableRow[]>>;
  onAddRow: () => void;
  onEditRow: (row: SuperTableRow) => void;
  setFocusableRef: (key: string, element: HTMLElement | null) => void;
}

const SuperTable2: React.FC<SuperTable2Props> = ({ 
  rows, 
  setRows, 
  onAddRow,
  onEditRow,
  setFocusableRef 
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [lastRowCount, setLastRowCount] = useState<number>(0);
  const focusRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  // Focus new rows when they're added
  useEffect(() => {
    if (rows.length > lastRowCount && rows.length > 0) {
      // A new row was added, focus the newest one using direct DOM query
      const newestRow = rows[rows.length - 1];
      setTimeout(() => {
        // Try multiple approaches to find and focus the element
        console.log(`Attempting to focus newest row: ${newestRow.id}`);
        
        // Approach 1: Use our ref
        let element = focusRefs.current[`super-fund-${newestRow.id}`];
        if (element) {
          element.focus();
          console.log(`SUCCESS via ref: Focused ${newestRow.id}`);
          return;
        }
        
        // Approach 2: Query by attribute or class
        element = document.querySelector(`[data-fund-id="${newestRow.id}"]`) as HTMLElement;
        if (element) {
          element.focus();
          console.log(`SUCCESS via querySelector: Focused ${newestRow.id}`);
          return;
        }
        
        // Approach 3: Query all fund cells and find the right one
        const allFundCells = document.querySelectorAll('[tabindex="0"]');
        console.log(`Found ${allFundCells.length} focusable elements`);
        const lastCell = allFundCells[allFundCells.length - 2] as HTMLElement; // -2 because add button is last
        if (lastCell) {
          lastCell.focus();
          console.log(`SUCCESS via last cell: Focused last fund cell`);
          return;
        }
        
        console.log(`FAILED to focus newest row: ${newestRow.id}`);
      }, 500);
    }
    setLastRowCount(rows.length);
  }, [rows.length, lastRowCount]);

  const handleAddRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Return' || e.key.toLowerCase() === 'a') {
      e.preventDefault();
      onAddRow();
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
                {/* Fund Name Cell - Clickable to Edit */}
                <td className="border border-gray-300 px-3 py-2 bg-white relative text-center">
                  <div className="mx-2">
                    <div 
                      ref={(el) => {
                        setFocusableRef(`super-fund-${row.id}`, el);
                        focusRefs.current[`super-fund-${row.id}`] = el;
                      }}
                      data-fund-id={row.id}
                      tabIndex={0}
                      className="border rounded p-2 bg-white border-black hover:bg-gray-50 transition-all duration-200 cursor-pointer focus:ring-4 focus:ring-blue-600 focus:ring-opacity-90 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.5)] focus:outline-none"
                      onClick={() => onEditRow(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Return') {
                          e.preventDefault();
                          onEditRow(row);
                        }
                        // Handle number keys 1-6 to directly open modal and pre-select fund
                        const num = parseInt(e.key);
                        if (num >= 1 && num <= 6) {
                          e.preventDefault();
                          onEditRow(row);
                        }
                      }}
                      onFocus={(e) => {
                        // When this element gets focus, make sure it's visible
                        e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                      }}
                    >
                      <span className="font-tahoma text-xs text-gray-900 text-center block">
                        {row.fundName}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Owner Cell - Display Only */}
                <td className="border border-gray-300 px-3 py-2 bg-white relative text-center">
                  <div className="mx-2">
                    <div className="border rounded p-2 bg-white border-black hover:bg-gray-50 transition-all duration-200">
                      <span className="font-tahoma text-xs text-gray-900 text-center block">
                        {row.owner}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Type of Rollover Cell - Display Only */}
                <td className="border border-gray-300 px-3 py-2 bg-white relative text-center">
                  <div className="mx-2">
                    <div className="border rounded p-2 bg-white border-black hover:bg-gray-50 transition-all duration-200">
                      <span className="font-tahoma text-xs text-gray-900 text-center block">
                        {row.typeOfRollover}
                      </span>
                    </div>
                  </div>
                  
                  {/* Remove button */}
                  {hoveredRow === row.id && (
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
                  ref={(el) => setFocusableRef('super-add-row-button', el)}
                  onClick={onAddRow}
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

export default SuperTable2;