import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SuperTable2 from './components/SuperTable2';
import AddRowModal from './components/AddRowModal';
import AddItemModal from './components/AddItemModal';
import AddButton from './components/AddButton';
import AlignedGoalDropdown from './components/AlignedGoalDropdown';
import SortableBulletPoint from './components/SortableBulletPoint';
import InvisibleDropZone from './components/InvisibleDropZone';
import FilterControls from './components/FilterControls';
import PreviewModal from './components/PreviewModal';
import StrategySidebar from './components/StrategySidebar';
import { StrategyType } from './types/strategies';
import VariableBox from './components/VariableBox';
import VariablesModal from './components/VariablesModal';

interface SuperTableRow {
  id: string;
  fundName: string;
  owner: string;
  typeOfRollover: string;
  hasInsurance: string; // Will store "Yes" or "No"
}

interface BulletPointState {
  id: string;
  text: string;
  summary?: string; // Optional concise subheading
  status: 'pending' | 'approved' | 'rejected';
}

function App() {
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('consolidation');
  const [superTableRows, setSuperTableRows] = useState<SuperTableRow[]>([]);
  const [showAddRowModal, setShowAddRowModal] = useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [addItemSection, setAddItemSection] = useState<'benefits' | 'considerations'>('benefits');
  
  const [alignedGoal, setAlignedGoal] = useState<string>('');
  const [loanAlignedGoal, setLoanAlignedGoal] = useState<string>('');
  const [showRejected, setShowRejected] = useState<boolean>(false);
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showVariablesModal, setShowVariablesModal] = useState<boolean>(false);
  const [rejectingItems, setRejectingItems] = useState<Set<string>>(new Set());
  const [interactionMode, setInteractionMode] = useState<'mouse' | 'keyboard'>('mouse');
  const [activeBulletId, setActiveBulletId] = useState<string | null>(null);
  const [selectedBulletIds, setSelectedBulletIds] = useState<Set<string>>(new Set());
  const [bulkApprovingIds, setBulkApprovingIds] = useState<Set<string>>(new Set());
  const [bulkRejectingIds, setBulkRejectingIds] = useState<Set<string>>(new Set());
  
  // Interactive text field values
  const [interactiveValues, setInteractiveValues] = useState<{[key: string]: string}>({
    'subtitle-amount': '',
    'subtitle-frequency': '',
    'subtitle-loan-type': '',
    'benefit4-amount': '',
    'benefit4-frequency': '',
    'benefit5-frequency': ''
  });
  
  // Focus management
  const [currentFocusIndex, setCurrentFocusIndex] = useState<number>(0);
  const focusableRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [focusableElements, setFocusableElements] = useState<string[]>([]);
  
  // Track items being moved to drop zones to disable transition
  const [itemsMovingToDropZone, setItemsMovingToDropZone] = useState<Set<string>>(new Set());

  // Handler for interactive text changes
  const handleInteractiveValueChange = (id: string, value: string) => {
    setInteractiveValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Variables modal handlers
  const handleVariablesSubmit = (variables: {[key: string]: string}) => {
    setInteractiveValues(prev => ({
      ...prev,
      ...variables
    }));
  };

  // Drag and drop sensors with permissive configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      keyboardCodes: {
        start: ['Enter'],
        cancel: ['Escape'],
        end: ['Enter'],
      },
    })
  );

  const benefitsBullets: BulletPointState[] = [
    {
      id: 'benefit-1',
      summary: 'Simplified Administration',
      text: 'Consolidating these funds will simplify the administration of your superannuation. It will be easier to manage and keep track of your investments to ensure your superannuation is invested in line with your long-term goals and objectives.',
      status: 'pending'
    },
    {
      id: 'benefit-2',
      summary: 'Better Insurance Coverage',
      text: 'You would like to structure your personal insurances via superannuation; however, your current funds do not provide adequate cover.',
      status: 'pending'
    },
    {
      id: 'benefit-3',
      summary: 'Keep Existing Insurance',
      text: 'You can transfer your existing insurance cover to your new superannuation fund without having to provide further health evidence or undergo any further underwriting. Please note, that your insurance premiums will be recalculated based on your current personal circumstances.',
      status: 'pending'
    },
    {
      id: 'benefit-4',
      summary: 'Partial Fund Retention',
      text: 'A portion will be retained in your existing superannuation fund to maintain your existing insurance cover.',
      status: 'pending'
    }
  ];

  const considerationsBullets: BulletPointState[] = [
    {
      id: 'consideration-1',
      summary: 'Temporary Investment Gap',
      text: 'When your funds are rolled over, there may be a period of time where your funds are not fully invested. During this time, your funds will not benefit from any market upside or, conversely, be subject to any market falls during this period.',
      status: 'pending'
    },
    {
      id: 'consideration-2',
      summary: 'Update Employer Details',
      text: 'You should inform your employer to direct your future superannuation contributions to the new fund.',
      status: 'pending'
    },
    {
      id: 'consideration-3',
      summary: 'Exit Fees Apply',
      text: 'Any accrued administration fees, risk insurance premiums, applicable capital gains and superannuation fund tax, will be deducted from your account balance prior to the transfer taking place.',
      status: 'pending'
    },
    {
      id: 'consideration-4',
      summary: 'Personal Tax Deductions',
      text: 'If you have made personal contributions for which you wish to claim a tax deduction you must lodge a notice of deductibility form with your superannuation fund before you rollover your funds.',
      status: 'pending'
    },
    {
      id: 'consideration-5',
      summary: 'Review Insurance Needs',
      text: 'We note your current superannuation fund has existing insurance cover. You should review your insurance needs and ensure that any replacement covers are in place prior to closing your existing superannuation fund. You may have to provide further health evidence or undergo further underwriting to obtain insurance cover in the recommended fund.',
      status: 'pending'
    },
    {
      id: 'consideration-6',
      summary: 'Potential Bonus Loss',
      text: 'You may lose some, or all, of the retirement bonus that may apply upon the commencement of a retirement income stream in future. The amount of bonus that you will lose depends on a range of factors and is determined on an individual basis by your fund\'s provider.',
      status: 'pending'
    },
    {
      id: 'consideration-7',
      summary: 'Transaction Costs',
      text: 'Transaction costs apply when redeeming investments or switching superannuation funds. For more information, please refer to the relevant Product Disclosure Statement (PDS).',
      status: 'pending'
    },
    {
      id: 'consideration-8',
      summary: 'Capital Gains Tax',
      text: 'Capital gains tax may be payable on the growth of investment when sold. Where a capital loss is realised on an investment, this loss may be carried forward to offset against future capital gains within the portfolio. More detailed information on the estimated capital gains tax liability will be provided later in this document.',
      status: 'pending'
    }
  ];

  // Loan repayment data arrays
  const loanBenefitsBullets: BulletPointState[] = [
    {
      id: 'loan-benefit-1',
      summary: 'Reduced Interest & Faster Repayment',
      text: 'By making additional repayments you will reduce the interest over the life of the loan which will help repay the loan sooner.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-2',
      summary: 'Interest Rate Protection',
      text: 'This will also reduce the impact of fluctuating interest rates on your cash flow.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-3',
      summary: 'Accelerated Wealth Building',
      text: 'The quicker the loan is repaid, the sooner you will be able to boost your wealth accumulation plans using the amounts previously directed to loan repayments.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-4',
      summary: 'Improved Cash Flow',
      text: 'This will free up cash flow of $XXX p/frequency of which can be used to meet your expenditure and other objectives.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-5',
      summary: 'Payment Frequency Optimization',
      text: 'Altering the repayment frequency on your mortgage from monthly to fortnightly/weekly will increase the number of repayments you make each year which may help reduce the amount of interest paid over the life of the loan and repay your loan sooner.',
      status: 'pending'
    }
  ];

  const loanConsiderationsBullets: BulletPointState[] = [
    {
      id: 'loan-consideration-1',
      summary: 'Tax Deduction Impact',
      text: 'The interest expense associated with this loan is tax deductible. Increasing the rate at which you repay this debt will reduce the associated tax deduction, potentially increasing your income tax liability in future financial years. You should discuss these implications with your taxation specialist.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-2',
      summary: 'Reduced Cash Flow',
      text: 'Increasing your repayments means that you will have less cashflow to fund your other expenses. Should you need to access these funds in the future, there may be costs associated with this.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-3',
      summary: 'Prepayment Fees & Restrictions',
      text: 'Some lenders may charge \'prepayment\' or \'early termination\' fees as a result of early repayment and there may be restrictions on additional repayments. Therefore, it is important you consult with your current lender(s) before making a lump sum repayment.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-4',
      summary: 'Extended Loan Term Risk',
      text: 'Decreasing regular repayments will result in a longer loan term and higher ongoing interest charged.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-5',
      summary: 'Variable Rate Changes',
      text: 'An increase in variable rates will result in higher interest being paid over time which will result in a change to the projections provided.',
      status: 'pending'
    }
  ];

  const [benefitsStates, setBenefitsStates] = useState<BulletPointState[]>(benefitsBullets);
  const [considerationsStates, setConsiderationsStates] = useState<BulletPointState[]>(considerationsBullets);
  
  // Loan repayment states
  const [loanBenefitsStates, setLoanBenefitsStates] = useState<BulletPointState[]>(loanBenefitsBullets);
  const [loanConsiderationsStates, setLoanConsiderationsStates] = useState<BulletPointState[]>(loanConsiderationsBullets);
  
  // Order state for drag and drop
  const [benefitsOrder, setBenefitsOrder] = useState<string[]>([
    'benefit-1', 'benefit-2', 'benefit-3', 'benefit-4'
  ]);
  const [considerationsOrder, setConsiderationsOrder] = useState<string[]>([
    'consideration-1', 'consideration-2', 'consideration-3', 'consideration-4',
    'consideration-5', 'consideration-6', 'consideration-7', 'consideration-8'
  ]);
  
  // Loan repayment order states
  const [loanBenefitsOrder, setLoanBenefitsOrder] = useState<string[]>([
    'loan-benefit-1', 'loan-benefit-2', 'loan-benefit-3', 'loan-benefit-4', 'loan-benefit-5'
  ]);
  const [loanConsiderationsOrder, setLoanConsiderationsOrder] = useState<string[]>([
    'loan-consideration-1', 'loan-consideration-2', 'loan-consideration-3', 
    'loan-consideration-4', 'loan-consideration-5'
  ]);

  // Helper functions for ordered item rendering
  const getOrderedBenefits = () => {
    if (activeStrategy === 'loanRepayment') {
      const orderedItems = loanBenefitsOrder
        .map(id => loanBenefitsStates.find(item => item.id === id))
        .filter((item): item is BulletPointState => item !== undefined);
      
      const unorderedItems = loanBenefitsStates.filter(item => !loanBenefitsOrder.includes(item.id));
      return [...orderedItems, ...unorderedItems];
    } else {
      const orderedItems = benefitsOrder
        .map(id => benefitsStates.find(item => item.id === id))
        .filter((item): item is BulletPointState => item !== undefined);
      
      const unorderedItems = benefitsStates.filter(item => !benefitsOrder.includes(item.id));
      return [...orderedItems, ...unorderedItems];
    }
  };

  const getOrderedConsiderations = () => {
    if (activeStrategy === 'loanRepayment') {
      const orderedItems = loanConsiderationsOrder
        .map(id => loanConsiderationsStates.find(item => item.id === id))
        .filter((item): item is BulletPointState => item !== undefined);
      
      const unorderedItems = loanConsiderationsStates.filter(item => !loanConsiderationsOrder.includes(item.id));
      return [...orderedItems, ...unorderedItems];
    } else {
      const orderedItems = considerationsOrder
        .map(id => considerationsStates.find(item => item.id === id))
        .filter((item): item is BulletPointState => item !== undefined);
      
      const unorderedItems = considerationsStates.filter(item => !considerationsOrder.includes(item.id));
      return [...orderedItems, ...unorderedItems];
    }
  };

  // Helper functions for managing rejecting state
  const startRejecting = (id: string) => {
    setRejectingItems(prev => new Set(prev).add(id));
  };

  const stopRejecting = (id: string) => {
    setRejectingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // Helper functions for managing multi-select
  const toggleBulletSelection = (id: string) => {
    setSelectedBulletIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearAllSelections = () => {
    setSelectedBulletIds(new Set());
  };

  const bulkUpdateBulletStatus = (status: 'approved' | 'rejected') => {
    if (selectedBulletIds.size === 0) return;

    if (status === 'approved') {
      // Start bulk approving animation for all selected items
      setBulkApprovingIds(new Set(selectedBulletIds));
      
      // After animation delay, update status
      setTimeout(() => {
        if (activeStrategy === 'loanRepayment') {
          // Update loan benefits
          setLoanBenefitsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );

          // Update loan considerations
          setLoanConsiderationsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );
        } else {
          // Update benefits
          setBenefitsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );

          // Update considerations
          setConsiderationsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );
        }

        // Clear animations and selections
        setBulkApprovingIds(new Set());
        clearAllSelections();
      }, 300);
    } else {
      // Start bulk rejecting animation for all selected items
      setBulkRejectingIds(new Set(selectedBulletIds));
      
      // Update rejecting items state for individual card animations
      selectedBulletIds.forEach(id => {
        setRejectingItems(prev => new Set(prev).add(id));
      });
      
      // After animation delay, update status
      setTimeout(() => {
        if (activeStrategy === 'loanRepayment') {
          // Update loan benefits
          setLoanBenefitsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );

          // Update loan considerations
          setLoanConsiderationsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );
        } else {
          // Update benefits
          setBenefitsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );

          // Update considerations
          setConsiderationsStates(prev => 
            prev.map(bullet => 
              selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
            )
          );
        }
      }, 300);
      
      // Clear animations and selections after full animation
      setTimeout(() => {
        setBulkRejectingIds(new Set());
        selectedBulletIds.forEach(id => {
          setRejectingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        });
        clearAllSelections();
      }, 400);
    }
  };

  // SuperTable2 handlers
  const [editingRow, setEditingRow] = useState<SuperTableRow | null>(null);

  const handleAddRowModalOpen = () => {
    setEditingRow(null);
    setShowAddRowModal(true);
  };

  const handleEditRowModalOpen = (row: SuperTableRow) => {
    setEditingRow(row);
    setShowAddRowModal(true);
  };

  const handleAddRowModalClose = () => {
    setShowAddRowModal(false);
    setEditingRow(null);
  };

  const handleAddRowModalSubmit = (rowData: Omit<SuperTableRow, 'id'>) => {
    let newRowId: string | null = null;
    
    if (editingRow) {
      // Update existing row
      setSuperTableRows(prev => prev.map(row => 
        row.id === editingRow.id ? { ...editingRow, ...rowData } : row
      ));
      // For editing, focus the add row button
      setTimeout(() => {
        navigateToElement('super-add-row-button');
      }, 100);
    } else {
      // Add new row
      const newRow: SuperTableRow = {
        id: Date.now().toString(),
        ...rowData
      };
      newRowId = newRow.id;
      setSuperTableRows(prev => [...prev, newRow]);
      
      // Focus will be handled by SuperTable2 component directly
    }
  };

  // AddItemModal handlers
  const handleAddBenefitModalOpen = () => {
    setAddItemSection('benefits');
    setShowAddItemModal(true);
  };

  const handleAddConsiderationModalOpen = () => {
    setAddItemSection('considerations');
    setShowAddItemModal(true);
  };

  const handleAddItemModalClose = () => {
    setShowAddItemModal(false);
  };

  const handleAddItemModalSubmit = (text: string) => {
    const newItem: BulletPointState = {
      id: `${addItemSection === 'benefits' ? 'benefit' : 'consideration'}-${Date.now()}`,
      text: text,
      status: 'approved' // New items start as approved (green tick)
    };

    if (addItemSection === 'benefits') {
      // Add to benefits state and order (at the top)
      setBenefitsStates(prev => [newItem, ...prev]);
      setBenefitsOrder(prev => [newItem.id, ...prev]);
    } else {
      // Add to considerations state and order (at the top)
      setConsiderationsStates(prev => [newItem, ...prev]);
      setConsiderationsOrder(prev => [newItem.id, ...prev]);
    }
  };



  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine which section the items belong to
    const isBenefitsItem = (id: string) => id.startsWith('benefit-') || id.startsWith('loan-benefit-');
    const isConsiderationsItem = (id: string) => id.startsWith('consideration-') || id.startsWith('loan-consideration-');

    // Check if dropped on invisible drop zones
    if (overId === 'benefits-drop-zone') {
      // Mark item as moving to drop zone to disable transition
      setItemsMovingToDropZone(prev => new Set(prev).add(activeId));
      
      // Move to end of benefits section
      if (activeStrategy === 'loanRepayment') {
        setLoanBenefitsOrder((items) => {
          const filteredItems = items.filter(id => id !== activeId);
          return [...filteredItems, activeId];
        });
      } else {
        setBenefitsOrder((items) => {
          const filteredItems = items.filter(id => id !== activeId);
          return [...filteredItems, activeId];
        });
      }
      
      // Reset transition state after a short delay
      setTimeout(() => {
        setItemsMovingToDropZone(prev => {
          const newSet = new Set(prev);
          newSet.delete(activeId);
          return newSet;
        });
      }, 50);
      
      return;
    }

    if (overId === 'considerations-drop-zone') {
      // Mark item as moving to drop zone to disable transition
      setItemsMovingToDropZone(prev => new Set(prev).add(activeId));
      
      // Move to end of considerations section
      if (activeStrategy === 'loanRepayment') {
        setLoanConsiderationsOrder((items) => {
          const filteredItems = items.filter(id => id !== activeId);
          return [...filteredItems, activeId];
        });
      } else {
        setConsiderationsOrder((items) => {
          const filteredItems = items.filter(id => id !== activeId);
          return [...filteredItems, activeId];
        });
      }
      
      // Reset transition state after a short delay
      setTimeout(() => {
        setItemsMovingToDropZone(prev => {
          const newSet = new Set(prev);
          newSet.delete(activeId);
          return newSet;
        });
      }, 50);
      
      return;
    }

    // Normal reordering within sections
    if (active.id !== over.id) {
      // Only allow reordering within the same section
      if (isBenefitsItem(activeId) && isBenefitsItem(overId)) {
        if (activeStrategy === 'loanRepayment') {
          setLoanBenefitsOrder((items) => {
            const oldIndex = items.indexOf(activeId);
            const newIndex = items.indexOf(overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        } else {
          setBenefitsOrder((items) => {
            const oldIndex = items.indexOf(activeId);
            const newIndex = items.indexOf(overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      } else if (isConsiderationsItem(activeId) && isConsiderationsItem(overId)) {
        if (activeStrategy === 'loanRepayment') {
          setLoanConsiderationsOrder((items) => {
            const oldIndex = items.indexOf(activeId);
            const newIndex = items.indexOf(overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        } else {
          setConsiderationsOrder((items) => {
            const oldIndex = items.indexOf(activeId);
            const newIndex = items.indexOf(overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }
    }
  };

  // Track interaction mode for focus priority and handle filter shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when modal is open
      if (showAddRowModal || showAddItemModal) {
        return;
      }

      // Handle filter shortcuts
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setShowRejected(!showRejected);
          return;
        }
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setShowOnlyPending(!showOnlyPending);
          return;
        }
      }
      
      // Only switch to keyboard mode for navigation keys
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter') {
        setInteractionMode('keyboard');
      }
    };

    const handleMouseMove = () => {
      // When switching to mouse mode, blur the currently focused element
      if (interactionMode === 'keyboard' && document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
      setInteractionMode('mouse');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showRejected, showOnlyPending, interactionMode, showAddRowModal, showAddItemModal]);

  // Update focusable elements list when data changes
  useEffect(() => {
    const elements: string[] = [];
    
    // SuperTable2 elements (only for consolidation strategy)
    if (activeStrategy === 'consolidation') {
      superTableRows.forEach((row) => {
        elements.push(`super-fund-${row.id}`);
      });
      elements.push('super-add-row-button');
    }
    
    // Enter Variables button (only for loan repayment strategy)
    if (activeStrategy === 'loanRepayment') {
      elements.push('enter-variables-button');
    }
    
    // Aligned goal dropdown
    elements.push('aligned-goal-dropdown');
    
    // Bullet points - using ordered arrays
    getOrderedBenefits().forEach(bullet => {
      if (showOnlyPending && bullet.status === 'pending') {
        elements.push(`bullet-${bullet.id}`);
      } else if (showRejected && bullet.status === 'rejected') {
        elements.push(`bullet-${bullet.id}`);
      } else if (!showOnlyPending && !showRejected && bullet.status !== 'rejected') {
        elements.push(`bullet-${bullet.id}`);
      }
      
    });
    
    getOrderedConsiderations().forEach(bullet => {
      if (showOnlyPending && bullet.status === 'pending') {
        elements.push(`bullet-${bullet.id}`);
      } else if (showRejected && bullet.status === 'rejected') {
        elements.push(`bullet-${bullet.id}`);
      } else if (!showOnlyPending && !showRejected && bullet.status !== 'rejected') {
        elements.push(`bullet-${bullet.id}`);
      }
    });
    
    setFocusableElements(elements);
  }, [superTableRows, benefitsStates, considerationsStates, benefitsOrder, considerationsOrder, loanBenefitsStates, loanConsiderationsStates, loanBenefitsOrder, loanConsiderationsOrder, activeStrategy, showRejected, showOnlyPending]);


  // Focus management functions
  const setFocusableRef = (key: string, element: HTMLElement | null) => {
    focusableRefs.current[key] = element;
  };

  const focusElement = (elementKey: string) => {
    const element = focusableRefs.current[elementKey];
    if (element) {
      element.focus();
      const index = focusableElements.indexOf(elementKey);
      if (index >= 0) {
        setCurrentFocusIndex(index);
      }
      
      // If this is a bullet point, immediately set it as active
      // This prevents the timing issue where Left/Right arrows need to be pressed twice
      if (elementKey.startsWith('bullet-')) {
        const bulletId = elementKey.replace('bullet-', '');
        setActiveBulletId(bulletId);
      } else {
        // Clear active bullet when focusing non-bullet elements
        setActiveBulletId(null);
      }
    }
  };

  // Handle when an element gets focused (for click-based tab pickup)
  const handleElementFocused = (elementKey: string) => {
    const index = focusableElements.indexOf(elementKey);
    if (index >= 0) {
      setCurrentFocusIndex(index);
    }
    
    // Also handle activeBulletId for consistency
    if (elementKey.startsWith('bullet-')) {
      const bulletId = elementKey.replace('bullet-', '');
      setActiveBulletId(bulletId);
    } else {
      setActiveBulletId(null);
    }
  };

  // Navigate to next element (for bullet point auto-advance)
  const navigateToNext = () => {
    if (focusableElements.length > 0) {
      const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
      const nextElementKey = focusableElements[nextIndex];
      focusElement(nextElementKey);
    }
  };

  // Navigate to a specific element (used when we pre-calculate the target)
  const navigateToElement = (targetElementKey: string) => {
    // Safety check: only navigate if the target element still exists in focusableElements
    if (focusableElements.includes(targetElementKey) && focusableRefs.current[targetElementKey]) {
      focusElement(targetElementKey);
    }
    // If target is invalid, just stay put - don't make crazy jumps with fallback navigation
  };

  // Navigate to element with retry (for when element might not be rendered yet)
  const navigateToElementWithRetry = (targetElementKey: string, maxRetries: number = 10, delay: number = 50) => {
    const attemptFocus = (retryCount: number) => {
      const element = focusableRefs.current[targetElementKey];
      if (element) {
        // Element exists, focus it directly
        element.focus();
        // Update the focus index if it's in focusableElements
        const index = focusableElements.indexOf(targetElementKey);
        if (index >= 0) {
          setCurrentFocusIndex(index);
        }
        // Set active bullet if it's a bullet point
        if (targetElementKey.startsWith('bullet-')) {
          const bulletId = targetElementKey.replace('bullet-', '');
          setActiveBulletId(bulletId);
        } else {
          setActiveBulletId(null);
        }
        return;
      }
      
      if (retryCount < maxRetries) {
        setTimeout(() => attemptFocus(retryCount + 1), delay);
      }
    };
    
    attemptFocus(0);
  };

  // Get the next element key for a given current element (before any state changes)
  const getNextElementKey = (currentElementKey: string): string | null => {
    const currentIndex = focusableElements.indexOf(currentElementKey);
    if (currentIndex >= 0 && focusableElements.length > 1) {
      const nextIndex = (currentIndex + 1) % focusableElements.length;
      const nextKey = focusableElements[nextIndex];
      // Double-check that the next element exists
      if (nextKey && focusableRefs.current[nextKey]) {
        return nextKey;
      }
    }
    return null;
  };

  // Global key handler for focus trapping (Tab) and navigation (Arrows)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't handle background navigation when modal is open
      if (showAddRowModal || showAddItemModal) {
        return;
      }

      // Handle Tab key for focus trapping (keeps focus within app)
      if (e.key === 'Tab' && focusableElements.length > 0) {
        e.preventDefault();
        
        const nextIndex = e.shiftKey 
          ? (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length
          : (currentFocusIndex + 1) % focusableElements.length;
        
        const nextElementKey = focusableElements[nextIndex];
        focusElement(nextElementKey);
      }
      
      // Handle Up/Down arrows for navigation
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && focusableElements.length > 0) {
        e.preventDefault();
        
        // Find the currently focused element dynamically to avoid stale index issues
        const activeElement = document.activeElement;
        let currentIndex = currentFocusIndex;
        
        // Try to find the active element in our focusable elements
        if (activeElement) {
          for (const [key, element] of Object.entries(focusableRefs.current)) {
            if (element === activeElement) {
              const foundIndex = focusableElements.indexOf(key);
              if (foundIndex >= 0) {
                currentIndex = foundIndex;
                break;
              }
            }
          }
        }
        
        const nextIndex = e.key === 'ArrowUp'
          ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
          : (currentIndex + 1) % focusableElements.length;
        
        const nextElementKey = focusableElements[nextIndex];
        focusElement(nextElementKey);
      }
      
      // Left/Right arrows are handled by individual bullet points when they're active
      // so we don't need to handle them here
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentFocusIndex, focusableElements, showAddRowModal, showAddItemModal]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <StrategySidebar 
        activeStrategy={activeStrategy}
        onStrategyChange={setActiveStrategy}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-72">
        <div className="py-8">
          <div className="max-w-4xl mx-auto bg-white shadow-lg p-8">
            {activeStrategy === 'consolidation' && (
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragEnd={handleDragEnd}
              >
        
        {/* Filter Controls */}
        <FilterControls 
          showRejected={showRejected}
          setShowRejected={setShowRejected}
          showOnlyPending={showOnlyPending}
          setShowOnlyPending={setShowOnlyPending}
          onPreview={() => setShowPreview(true)}
        />

        {/* Main Heading */}
        <h1 className="font-tahoma text-lg font-normal text-black mb-4">
          Consolidate your superannuation funds
        </h1>

        {/* Subtitle */}
        <p className="font-tahoma text-sm text-black mb-4">
          We recommend you consolidate your superannuation funds as listed below.
        </p>

        {/* Super Fund Table */}
        <div className="mt-4 mb-4">
          <SuperTable2
            rows={superTableRows}
            setRows={setSuperTableRows}
            onAddRow={handleAddRowModalOpen}
            onEditRow={handleEditRowModalOpen}
            setFocusableRef={setFocusableRef}
          />
        </div>

        {/* Section Divider */}
        <div className="my-1">
          <div className="h-px bg-gray-300"></div>
        </div>

        {/* Aligned Goal Section */}
        <div className="mt-4 mb-4">
          <h2 className="font-tahoma text-sm font-bold text-black mb-3">
            Aligned Goal
          </h2>
          <AlignedGoalDropdown 
            value={alignedGoal}
            onChange={setAlignedGoal}
            setFocusableRef={setFocusableRef}
          />
        </div>

        {/* Section Divider */}
        <div className="my-1">
          <div className="h-px bg-gray-300"></div>
        </div>

        {/* Why this benefits you */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-tahoma text-sm font-bold text-black">
              Why this benefits you
            </h2>
            <AddButton onClick={handleAddBenefitModalOpen} />
          </div>
          <SortableContext
            items={getOrderedBenefits()
              .filter(bullet => {
                if (showOnlyPending) return bullet.status === 'pending';
                if (showRejected) return bullet.status === 'rejected';
                return bullet.status !== 'rejected';
              })
              .map(bullet => bullet.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {getOrderedBenefits()
                .filter(bullet => {
                  if (showOnlyPending) return bullet.status === 'pending';
                  if (showRejected) return bullet.status === 'rejected';
                  return bullet.status !== 'rejected';
                })
                .map((bullet) => (
                  <SortableBulletPoint
                    key={bullet.id}
                    id={bullet.id}
                    text={bullet.text}
                    summary={bullet.summary}
                    status={bullet.status}
                    showRejected={showRejected}
                    isRejecting={rejectingItems.has(bullet.id)}
                    interactionMode={interactionMode}
                    activeBulletId={activeBulletId}
                    setActiveBulletId={setActiveBulletId}
                    setFocusableRef={setFocusableRef}
                    onElementFocused={handleElementFocused}
                    onStartRejecting={startRejecting}
                    onStopRejecting={stopRejecting}
                    onNavigateNext={navigateToNext}
                    onNavigateToElement={navigateToElement}
                    onGetNextElementKey={getNextElementKey}
                    disableTransition={itemsMovingToDropZone.has(bullet.id)}
                    isSelected={selectedBulletIds.has(bullet.id)}
                    onToggleSelection={toggleBulletSelection}
                    onBulkStatusUpdate={bulkUpdateBulletStatus}
                    selectedCount={selectedBulletIds.size}
                    isBulkApproving={bulkApprovingIds.has(bullet.id)}
                    isBulkRejecting={bulkRejectingIds.has(bullet.id)}
                    interactiveValues={interactiveValues}
                    onInteractiveValueChange={handleInteractiveValueChange}
                    onStatusChange={(id, status) => {
                      setBenefitsStates(prev => 
                        prev.map(b => b.id === id ? { ...b, status } : b)
                      );
                    }}
                  />
                ))}
            </div>
          </SortableContext>
          {/* Invisible drop zone for benefits section */}
          <InvisibleDropZone id="benefits-drop-zone" />
        </div>

        {/* Section Divider */}
        <div className="my-1">
          <div className="h-px bg-gray-300"></div>
        </div>

        {/* Things you should consider */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-tahoma text-sm font-bold text-black">
              Things you should consider
            </h2>
            <AddButton onClick={handleAddConsiderationModalOpen} />
          </div>
          <SortableContext
            items={getOrderedConsiderations()
              .filter(bullet => {
                if (showOnlyPending) return bullet.status === 'pending';
                if (showRejected) return bullet.status === 'rejected';
                return bullet.status !== 'rejected';
              })
              .map(bullet => bullet.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {getOrderedConsiderations()
                .filter(bullet => {
                  if (showOnlyPending) return bullet.status === 'pending';
                  if (showRejected) return bullet.status === 'rejected';
                  return bullet.status !== 'rejected';
                })
                .map((bullet) => (
                  <SortableBulletPoint
                    key={bullet.id}
                    id={bullet.id}
                    text={bullet.text}
                    summary={bullet.summary}
                    status={bullet.status}
                    showRejected={showRejected}
                    isRejecting={rejectingItems.has(bullet.id)}
                    interactionMode={interactionMode}
                    activeBulletId={activeBulletId}
                    setActiveBulletId={setActiveBulletId}
                    setFocusableRef={setFocusableRef}
                    onElementFocused={handleElementFocused}
                    onStartRejecting={startRejecting}
                    onStopRejecting={stopRejecting}
                    onNavigateNext={navigateToNext}
                    onNavigateToElement={navigateToElement}
                    onGetNextElementKey={getNextElementKey}
                    disableTransition={itemsMovingToDropZone.has(bullet.id)}
                    isSelected={selectedBulletIds.has(bullet.id)}
                    onToggleSelection={toggleBulletSelection}
                    onBulkStatusUpdate={bulkUpdateBulletStatus}
                    selectedCount={selectedBulletIds.size}
                    isBulkApproving={bulkApprovingIds.has(bullet.id)}
                    isBulkRejecting={bulkRejectingIds.has(bullet.id)}
                    interactiveValues={interactiveValues}
                    onInteractiveValueChange={handleInteractiveValueChange}
                    onStatusChange={(id, status) => {
                      setConsiderationsStates(prev => 
                        prev.map(b => b.id === id ? { ...b, status } : b)
                      );                    }}
                  />
                ))}
            </div>
          </SortableContext>
          {/* Invisible drop zone for considerations section */}
          <InvisibleDropZone id="considerations-drop-zone" />
        </div>

        {/* Add Row Modal */}
        <AddRowModal
          isOpen={showAddRowModal}
          onClose={handleAddRowModalClose}
          onSubmit={handleAddRowModalSubmit}
          editingRow={editingRow}
        />

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={showAddItemModal}
          onClose={handleAddItemModalClose}
          onSubmit={handleAddItemModalSubmit}
          title={addItemSection === 'benefits' ? 'Add Benefit' : 'Add Consideration'}
        />


              {/* Preview Modal */}
              {showPreview && (
                <PreviewModal
                  tableRows={superTableRows}
                  alignedGoal={alignedGoal}
                  loanAlignedGoal={loanAlignedGoal}
                  benefitsStates={benefitsStates}
                  considerationsStates={considerationsStates}
                  loanBenefitsStates={loanBenefitsStates}
                  loanConsiderationsStates={loanConsiderationsStates}
                  benefitsOrder={benefitsOrder}
                  considerationsOrder={considerationsOrder}
                  loanBenefitsOrder={loanBenefitsOrder}
                  loanConsiderationsOrder={loanConsiderationsOrder}
                  activeStrategy={activeStrategy}
                  interactiveValues={interactiveValues}
                  onClose={() => setShowPreview(false)}
                />
              )}
              </DndContext>
            )}
            
            {activeStrategy === 'loanRepayment' && (
              <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragEnd={handleDragEnd}
              >
        
        {/* Filter Controls */}
        <FilterControls 
          showRejected={showRejected}
          setShowRejected={setShowRejected}
          showOnlyPending={showOnlyPending}
          setShowOnlyPending={setShowOnlyPending}
          onPreview={() => setShowPreview(true)}
        />

        {/* Main Heading and Enter Variables Button */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-tahoma text-lg font-normal text-black">
            Alter your loan repayments
          </h1>
          <button
            ref={(el) => setFocusableRef('enter-variables-button', el)}
            onClick={() => setShowVariablesModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-tahoma font-medium text-sm"
          >
            Enter Variables
          </button>
        </div>

        {/* Subtitle */}
        <p className="font-tahoma text-sm text-black mb-4">
          After reviewing your cashflow position, we recommend you reduce your debt repayments to{' '}
          <VariableBox
            number={1}
            value={interactiveValues['subtitle-amount']}
            type="currency"
            placeholder="$XXX"
          />
          {' '}per{' '}
          <VariableBox
            number={2}
            value={interactiveValues['subtitle-frequency']}
            type="frequency"
            placeholder="month/fortnight/week"
          />
          {' '}into your{' '}
          <VariableBox
            number={3}
            value={interactiveValues['subtitle-loan-type']}
            type="text"
            placeholder="XXX loan"
          />
          .
        </p>

        {/* Aligned Goal Section */}
        <div className="mt-4 mb-4">
          <h2 className="font-tahoma text-sm font-bold text-black mb-3">
            Aligned goal
          </h2>
          <AlignedGoalDropdown 
            value={loanAlignedGoal}
            onChange={setLoanAlignedGoal}
            setFocusableRef={setFocusableRef}
          />
        </div>

        {/* Section Divider */}
        <div className="my-1">
          <div className="h-px bg-gray-300"></div>
        </div>

        {/* Why this benefits you */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-tahoma text-sm font-bold text-black">
              Why this benefits you
            </h2>
            <AddButton onClick={handleAddBenefitModalOpen} />
          </div>
          <SortableContext
            items={getOrderedBenefits()
              .filter(bullet => {
                if (showOnlyPending) return bullet.status === 'pending';
                if (showRejected) return bullet.status === 'rejected';
                return bullet.status !== 'rejected';
              })
              .map(bullet => bullet.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {getOrderedBenefits()
                .filter(bullet => {
                  if (showOnlyPending) return bullet.status === 'pending';
                  if (showRejected) return bullet.status === 'rejected';
                  return bullet.status !== 'rejected';
                })
                .map((bullet) => (
                  <SortableBulletPoint
                    key={bullet.id}
                    id={bullet.id}
                    text={bullet.text}
                    summary={bullet.summary}
                    status={bullet.status}
                    showRejected={showRejected}
                    isRejecting={rejectingItems.has(bullet.id)}
                    interactionMode={interactionMode}
                    activeBulletId={activeBulletId}
                    setActiveBulletId={setActiveBulletId}
                    setFocusableRef={setFocusableRef}
                    onElementFocused={handleElementFocused}
                    onStartRejecting={startRejecting}
                    onStopRejecting={stopRejecting}
                    onNavigateNext={navigateToNext}
                    onNavigateToElement={navigateToElement}
                    onGetNextElementKey={getNextElementKey}
                    disableTransition={itemsMovingToDropZone.has(bullet.id)}
                    isSelected={selectedBulletIds.has(bullet.id)}
                    onToggleSelection={toggleBulletSelection}
                    onBulkStatusUpdate={bulkUpdateBulletStatus}
                    selectedCount={selectedBulletIds.size}
                    isBulkApproving={bulkApprovingIds.has(bullet.id)}
                    isBulkRejecting={bulkRejectingIds.has(bullet.id)}
                    interactiveValues={interactiveValues}
                    onInteractiveValueChange={handleInteractiveValueChange}
                    onStatusChange={(id, status) => {
                      if (activeStrategy === 'loanRepayment') {
                        setLoanBenefitsStates(prev => 
                          prev.map(b => b.id === id ? { ...b, status } : b)
                        );
                      } else {
                        setBenefitsStates(prev => 
                          prev.map(b => b.id === id ? { ...b, status } : b)
                        );
                      }
                    }}
                  />
                ))}
            </div>
          </SortableContext>
          {/* Invisible drop zone for benefits section */}
          <InvisibleDropZone id="benefits-drop-zone" />
        </div>

        {/* Section Divider */}
        <div className="my-1">
          <div className="h-px bg-gray-300"></div>
        </div>

        {/* Things you should consider */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-tahoma text-sm font-bold text-black">
              Things you should consider
            </h2>
            <AddButton onClick={handleAddConsiderationModalOpen} />
          </div>
          <SortableContext
            items={getOrderedConsiderations()
              .filter(bullet => {
                if (showOnlyPending) return bullet.status === 'pending';
                if (showRejected) return bullet.status === 'rejected';
                return bullet.status !== 'rejected';
              })
              .map(bullet => bullet.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {getOrderedConsiderations()
                .filter(bullet => {
                  if (showOnlyPending) return bullet.status === 'pending';
                  if (showRejected) return bullet.status === 'rejected';
                  return bullet.status !== 'rejected';
                })
                .map((bullet) => (
                  <SortableBulletPoint
                    key={bullet.id}
                    id={bullet.id}
                    text={bullet.text}
                    summary={bullet.summary}
                    status={bullet.status}
                    showRejected={showRejected}
                    isRejecting={rejectingItems.has(bullet.id)}
                    interactionMode={interactionMode}
                    activeBulletId={activeBulletId}
                    setActiveBulletId={setActiveBulletId}
                    setFocusableRef={setFocusableRef}
                    onElementFocused={handleElementFocused}
                    onStartRejecting={startRejecting}
                    onStopRejecting={stopRejecting}
                    onNavigateNext={navigateToNext}
                    onNavigateToElement={navigateToElement}
                    onGetNextElementKey={getNextElementKey}
                    disableTransition={itemsMovingToDropZone.has(bullet.id)}
                    isSelected={selectedBulletIds.has(bullet.id)}
                    onToggleSelection={toggleBulletSelection}
                    onBulkStatusUpdate={bulkUpdateBulletStatus}
                    selectedCount={selectedBulletIds.size}
                    isBulkApproving={bulkApprovingIds.has(bullet.id)}
                    isBulkRejecting={bulkRejectingIds.has(bullet.id)}
                    interactiveValues={interactiveValues}
                    onInteractiveValueChange={handleInteractiveValueChange}
                    onStatusChange={(id, status) => {
                      if (activeStrategy === 'loanRepayment') {
                        setLoanConsiderationsStates(prev => 
                          prev.map(b => b.id === id ? { ...b, status } : b)
                        );
                      } else {
                        setConsiderationsStates(prev => 
                          prev.map(b => b.id === id ? { ...b, status } : b)
                        );
                      }
                    }}
                  />
                ))}
            </div>
          </SortableContext>
          {/* Invisible drop zone for considerations section */}
          <InvisibleDropZone id="considerations-drop-zone" />
        </div>

        {/* Add Row Modal */}
        <AddRowModal
          isOpen={showAddRowModal}
          onClose={handleAddRowModalClose}
          onSubmit={handleAddRowModalSubmit}
          editingRow={editingRow}
        />

        {/* Add Item Modal */}
        <AddItemModal
          isOpen={showAddItemModal}
          onClose={handleAddItemModalClose}
          onSubmit={handleAddItemModalSubmit}
          title={addItemSection === 'benefits' ? 'Add Benefit' : 'Add Consideration'}
        />


              {/* Variables Modal */}
              <VariablesModal
                isOpen={showVariablesModal}
                onClose={() => setShowVariablesModal(false)}
                onSubmit={handleVariablesSubmit}
                initialValues={interactiveValues}
              />

              {/* Preview Modal */}
              {showPreview && (
                <PreviewModal
                  tableRows={[]}
                  alignedGoal={alignedGoal}
                  loanAlignedGoal={loanAlignedGoal}
                  benefitsStates={benefitsStates}
                  considerationsStates={considerationsStates}
                  loanBenefitsStates={loanBenefitsStates}
                  loanConsiderationsStates={loanConsiderationsStates}
                  benefitsOrder={benefitsOrder}
                  considerationsOrder={considerationsOrder}
                  loanBenefitsOrder={loanBenefitsOrder}
                  loanConsiderationsOrder={loanConsiderationsOrder}
                  activeStrategy={activeStrategy}
                  interactiveValues={interactiveValues}
                  onClose={() => setShowPreview(false)}
                />
              )}
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;