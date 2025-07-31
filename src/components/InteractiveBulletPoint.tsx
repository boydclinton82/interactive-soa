import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveBulletPointProps {
  id: string;
  text: string;
  customContent?: React.ReactNode;
  summary?: string;
  status: 'pending' | 'approved' | 'rejected';
  onStatusChange: (id: string, status: 'pending' | 'approved' | 'rejected') => void;
  showRejected?: boolean;
  isRejecting?: boolean;
  interactionMode?: 'mouse' | 'keyboard';
  activeBulletId?: string | null;
  setActiveBulletId?: (id: string | null) => void;
  setFocusableRef: (key: string, element: HTMLElement | null) => void;
  onElementFocused?: (elementKey: string) => void;
  onStartRejecting?: (id: string) => void;
  onStopRejecting?: (id: string) => void;
  onNavigateNext?: () => void;
  onNavigateToElement?: (targetElementKey: string) => void;
  onGetNextElementKey?: (currentElementKey: string) => string | null;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onBulkStatusUpdate?: (status: 'approved' | 'rejected') => void;
  selectedCount?: number;
  isBulkApproving?: boolean;
  isBulkRejecting?: boolean;
}

const InteractiveBulletPoint: React.FC<InteractiveBulletPointProps> = ({ 
  id, 
  text, 
  customContent,
  summary,
  status, 
  onStatusChange,
  showRejected = false,
  isRejecting = false,
  interactionMode = 'mouse',
  activeBulletId,
  setActiveBulletId,
  setFocusableRef,
  onElementFocused,
  onStartRejecting,
  onStopRejecting,
  onNavigateNext,
  onNavigateToElement,
  onGetNextElementKey,
  isSelected = false,
  onToggleSelection,
  onBulkStatusUpdate,
  selectedCount = 0,
  isBulkApproving = false,
  isBulkRejecting = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = () => {
    setIsApproving(true);
    
    // Calculate next element BEFORE status change to avoid array reordering issues
    const nextElementKey = onGetNextElementKey?.(`bullet-${id}`);
    
    // Brief animation feedback, then change status
    setTimeout(() => {
      onStatusChange(id, 'approved');
      setIsApproving(false);
      // Navigate to pre-calculated next element
      setTimeout(() => {
        if (nextElementKey && onNavigateToElement) {
          onNavigateToElement(nextElementKey);
        } else {
          onNavigateNext?.(); // Fallback to old method
        }
      }, 100);
    }, 300);
  };

  const handleReject = () => {
    if (onStartRejecting) {
      onStartRejecting(id);
      
      // Calculate next element BEFORE status change to avoid array reordering issues
      const nextElementKey = onGetNextElementKey?.(`bullet-${id}`);
      
      // Brief red animation to match approve timing, then change status and hide
      setTimeout(() => {
        onStatusChange(id, 'rejected');
      }, 300);
      
      // Reset rejecting state after animation and navigate
      setTimeout(() => {
        if (onStopRejecting) {
          onStopRejecting(id);
        }
        // Navigate to pre-calculated next element
        setTimeout(() => {
          if (nextElementKey && onNavigateToElement) {
            onNavigateToElement(nextElementKey);
          } else {
            onNavigateNext?.(); // Fallback to old method
          }
        }, 100);
      }, 400);
    }
  };


  // Handle keyboard shortcuts - only respond if this bullet is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only respond to keyboard shortcuts if this bullet is the currently active one
      // Allow keyboard shortcuts for rejected items when they're visible (showRejected is true)
      if (activeBulletId === id && (status !== 'rejected' || (status === 'rejected' && showRejected))) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          // If there are any selected items, bulk approve them, otherwise approve this one
          if (onBulkStatusUpdate && selectedCount > 0) {
            onBulkStatusUpdate('approved');
          } else {
            handleApprove();
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          // If there are any selected items, bulk reject them, otherwise reject this one
          if (onBulkStatusUpdate && selectedCount > 0) {
            onBulkStatusUpdate('rejected');
          } else {
            handleReject();
          }
        } else if (e.key.toLowerCase() === 's' || e.key === ' ') {
          e.preventDefault();
          // Toggle selection for this bullet
          onToggleSelection?.(id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeBulletId, id, status, handleApprove, handleReject, isSelected, onBulkStatusUpdate, onToggleSelection, selectedCount]);


  const getStatusStyles = () => {
    // Animation states take priority (including bulk animations)
    if (isRejecting || isBulkRejecting) {
      return 'border-red-400 bg-red-100 shadow-lg';
    }
    if (isApproving || isBulkApproving) {
      return 'border-green-400 bg-green-100 shadow-lg';
    }
    
    // Regular states
    switch (status) {
      case 'approved':
        return 'border-green-300 bg-green-50 shadow-sm';
      case 'rejected':
        return 'border-red-300 bg-red-50 shadow-sm';
      case 'pending':
      default:
        return 'border-orange-200 bg-orange-50 shadow-sm';
    }
  };

  const getHoverStyles = () => {
    if (status === 'rejected' && !isRejecting) return '';
    
    if (isHovered || isFocused) {
      return 'transform scale-[1.02] shadow-md';
    }
    return '';
  };

  // Don't render if rejected and not showing rejected items (unless in rejecting animation)
  if (status === 'rejected' && !showRejected && !isRejecting) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: (isRejecting || isBulkRejecting) ? -16 : (isApproving || isBulkApproving) ? -8 : 0,
          scale: (isRejecting || isBulkRejecting) ? 1.12 : (isApproving || isBulkApproving) ? 1.05 : 1,
          rotateX: (isRejecting || isBulkRejecting) ? 6 : (isApproving || isBulkApproving) ? 2 : 0,
          rotateZ: (isRejecting || isBulkRejecting) ? 2 : 0
        }}
        exit={{ 
          opacity: 0, 
          y: -10, 
          scale: 0.95,
          transition: { duration: 0.3 }
        }}
        whileHover={{ 
          scale: status !== 'rejected' && !isRejecting && !isApproving && !isBulkRejecting && !isBulkApproving ? 1.02 : undefined,
          y: status !== 'rejected' && !isRejecting && !isApproving && !isBulkRejecting && !isBulkApproving ? -2 : undefined
        }}
        transition={{ 
          duration: (isRejecting || isBulkRejecting) ? 0.15 : (isApproving || isBulkApproving) ? 0.2 : 0.2,
          type: "spring",
          stiffness: (isRejecting || isBulkRejecting) ? 600 : 300,
          damping: (isRejecting || isBulkRejecting) ? 10 : 20
        }}
        className={`
          relative p-3 mb-2 rounded-lg border-2 transition-all duration-300 cursor-pointer
          ${getStatusStyles()}
          ${getHoverStyles()}
          ${isFocused ? 'ring-4 ring-blue-600 ring-opacity-90 shadow-[0_0_0_4px_rgba(37,99,235,0.5)]' : ''}
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        `}
        ref={(el) => setFocusableRef(`bullet-${id}`, el)}
        onMouseEnter={() => {
          setIsHovered(true);
          setActiveBulletId?.(id);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // Only clear activeBulletId if we're in mouse mode or element is not focused
          // In keyboard mode, mouse movements shouldn't interfere with keyboard focus
          if (activeBulletId === id && (interactionMode === 'mouse' || !isFocused)) {
            setActiveBulletId?.(null);
          }
        }}
        onFocus={() => {
          setIsFocused(true);
          setActiveBulletId?.(id);
          onElementFocused?.(`bullet-${id}`);
        }}
        onBlur={() => {
          setIsFocused(false);
          if (activeBulletId === id) {
            setActiveBulletId?.(null);
          }
        }}
        tabIndex={0}
      >
        {/* Multi-select checkbox - positioned in top right */}
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection?.(id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            tabIndex={-1}
          />
        </div>

        {/* Content without bullet points */}
        <div className="font-tahoma text-sm text-black leading-relaxed pr-8">
          {summary && (
            <div className="font-bold text-gray-800 mb-1">
              {summary}
            </div>
          )}
          <p className={summary ? "text-gray-700" : ""}>
            {customContent || text}
          </p>
        </div>

        {/* Action Buttons - Only show for one interaction mode at a time */}
        <AnimatePresence>
          {activeBulletId === id && (status !== 'rejected' || (status === 'rejected' && showRejected)) && !isRejecting && !isApproving && !isBulkRejecting && !isBulkApproving && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-3 bottom-3 flex gap-2"
            >
              {/* Approve Button - Show for pending and rejected items (when showRejected is true) */}
              {(status === 'pending' || (status === 'rejected' && showRejected)) && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleApprove}
                  tabIndex={-1}
                  className="w-8 h-8 bg-green-500 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Approve (O key)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.button>
              )}

              {/* Reject Button - Show for pending and approved items only */}
              {(status === 'pending' || status === 'approved') && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleReject}
                  tabIndex={-1}
                  className="w-8 h-8 bg-red-500 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md"
                  title={status === 'approved' ? "Remove (P key)" : "Reject (P key)"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Indicator */}
        <div className="absolute -top-1 -left-1">
          {status === 'approved' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
          
          {status === 'rejected' && (isRejecting || isBulkRejecting) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
          )}
        </div>

      </motion.div>
    </AnimatePresence>
  );
};

export default InteractiveBulletPoint;