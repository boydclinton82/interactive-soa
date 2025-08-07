import React, { useState, useEffect } from 'react';
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
import SuperTable2 from '../SuperTable2';
import AddRowModal from '../AddRowModal';
import AddItemModal from '../AddItemModal';
import AddButton from '../AddButton';
import AlignedGoalDropdown from '../AlignedGoalDropdown';
import SortableBulletPoint from '../SortableBulletPoint';
import InvisibleDropZone from '../InvisibleDropZone';
import FilterControls from '../FilterControls';
import PreviewModal from '../PreviewModal';
import { SuperTableRow, BulletPointState } from '../../types/strategies';

interface ConsolidationStrategyProps {
  focusableRefs: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
  onElementFocused: (elementKey: string) => void;
  interactionMode: 'mouse' | 'keyboard';
  navigateToNext: () => void;
  navigateToElement: (targetElementKey: string) => void;
  getNextElementKey: (currentElementKey: string) => string | null;
}

function ConsolidationStrategy({
  focusableRefs,
  onElementFocused,
  interactionMode,
  navigateToNext,
  navigateToElement,
  getNextElementKey
}: ConsolidationStrategyProps) {
  const [superTableRows, setSuperTableRows] = useState<SuperTableRow[]>([]);
  const [showAddRowModal, setShowAddRowModal] = useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [addItemSection, setAddItemSection] = useState<'benefits' | 'considerations'>('benefits');
  
  const [alignedGoal, setAlignedGoal] = useState<string>('');
  const [showRejected, setShowRejected] = useState<boolean>(false);
  const [showOnlyPending, setShowOnlyPending] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [rejectingItems, setRejectingItems] = useState<Set<string>>(new Set());
  const [activeBulletId, setActiveBulletId] = useState<string | null>(null);
  const [selectedBulletIds, setSelectedBulletIds] = useState<Set<string>>(new Set());
  const [bulkApprovingIds, setBulkApprovingIds] = useState<Set<string>>(new Set());
  const [bulkRejectingIds, setBulkRejectingIds] = useState<Set<string>>(new Set());
  
  // Track items being moved to drop zones to disable transition
  const [itemsMovingToDropZone, setItemsMovingToDropZone] = useState<Set<string>>(new Set());

  // Drag and drop sensors with permissive configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const [benefitsStates, setBenefitsStates] = useState<BulletPointState[]>(benefitsBullets);
  const [considerationsStates, setConsiderationsStates] = useState<BulletPointState[]>(considerationsBullets);
  
  // Order state for drag and drop
  const [benefitsOrder, setBenefitsOrder] = useState<string[]>([
    'benefit-1', 'benefit-2', 'benefit-3', 'benefit-4'
  ]);
  const [considerationsOrder, setConsiderationsOrder] = useState<string[]>([
    'consideration-1', 'consideration-2', 'consideration-3', 'consideration-4',
    'consideration-5', 'consideration-6', 'consideration-7', 'consideration-8'
  ]);

  // Helper functions for ordered item rendering
  const getOrderedBenefits = () => {
    const orderedItems = benefitsOrder
      .map(id => benefitsStates.find(item => item.id === id))
      .filter((item): item is BulletPointState => item !== undefined);
    
    const unorderedItems = benefitsStates.filter(item => !benefitsOrder.includes(item.id));
    return [...orderedItems, ...unorderedItems];
  };

  const getOrderedConsiderations = () => {
    const orderedItems = considerationsOrder
      .map(id => considerationsStates.find(item => item.id === id))
      .filter((item): item is BulletPointState => item !== undefined);
    
    const unorderedItems = considerationsStates.filter(item => !considerationsOrder.includes(item.id));
    return [...orderedItems, ...unorderedItems];
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
      setBulkApprovingIds(new Set(selectedBulletIds));
      
      setTimeout(() => {
        setBenefitsStates(prev => 
          prev.map(bullet => 
            selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
          )
        );

        setConsiderationsStates(prev => 
          prev.map(bullet => 
            selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
          )
        );

        setBulkApprovingIds(new Set());
        clearAllSelections();
      }, 300);
    } else {
      setBulkRejectingIds(new Set(selectedBulletIds));
      
      selectedBulletIds.forEach(id => {
        setRejectingItems(prev => new Set(prev).add(id));
      });
      
      setTimeout(() => {
        setBenefitsStates(prev => 
          prev.map(bullet => 
            selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
          )
        );

        setConsiderationsStates(prev => 
          prev.map(bullet => 
            selectedBulletIds.has(bullet.id) ? { ...bullet, status } : bullet
          )
        );
      }, 300);
      
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
    if (editingRow) {
      setSuperTableRows(prev => prev.map(row => 
        row.id === editingRow.id ? { ...editingRow, ...rowData } : row
      ));
      setTimeout(() => {
        navigateToElement('super-add-row-button');
      }, 100);
    } else {
      const newRow: SuperTableRow = {
        id: Date.now().toString(),
        ...rowData
      };
      setSuperTableRows(prev => [...prev, newRow]);
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
      status: 'approved'
    };

    if (addItemSection === 'benefits') {
      setBenefitsStates(prev => [newItem, ...prev]);
      setBenefitsOrder(prev => [newItem.id, ...prev]);
    } else {
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

    const isBenefitsItem = (id: string) => id.startsWith('benefit-');
    const isConsiderationsItem = (id: string) => id.startsWith('consideration-');

    if (overId === 'benefits-drop-zone') {
      setItemsMovingToDropZone(prev => new Set(prev).add(activeId));
      
      setBenefitsOrder((items) => {
        const filteredItems = items.filter(id => id !== activeId);
        return [...filteredItems, activeId];
      });
      
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
      setItemsMovingToDropZone(prev => new Set(prev).add(activeId));
      
      setConsiderationsOrder((items) => {
        const filteredItems = items.filter(id => id !== activeId);
        return [...filteredItems, activeId];
      });
      
      setTimeout(() => {
        setItemsMovingToDropZone(prev => {
          const newSet = new Set(prev);
          newSet.delete(activeId);
          return newSet;
        });
      }, 50);
      
      return;
    }

    if (active.id !== over.id) {
      if (isBenefitsItem(activeId) && isBenefitsItem(overId)) {
        setBenefitsOrder((items) => {
          const oldIndex = items.indexOf(activeId);
          const newIndex = items.indexOf(overId);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else if (isConsiderationsItem(activeId) && isConsiderationsItem(overId)) {
        setConsiderationsOrder((items) => {
          const oldIndex = items.indexOf(activeId);
          const newIndex = items.indexOf(overId);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

  const setFocusableRef = (key: string, element: HTMLElement | null) => {
    focusableRefs.current[key] = element;
  };

  // Handle filter shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAddRowModal || showAddItemModal) {
        return;
      }

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showRejected, showOnlyPending, showAddRowModal, showAddItemModal]);

  return (
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
                  onElementFocused={onElementFocused}
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
                  onStatusChange={(id, status) => {
                    setBenefitsStates(prev => 
                      prev.map(b => b.id === id ? { ...b, status } : b)
                    );
                  }}
                />
              ))}
          </div>
        </SortableContext>
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
                  onElementFocused={onElementFocused}
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
                  onStatusChange={(id, status) => {
                    setConsiderationsStates(prev => 
                      prev.map(b => b.id === id ? { ...b, status } : b)
                    );
                  }}
                />
              ))}
          </div>
        </SortableContext>
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
          benefitsStates={benefitsStates}
          considerationsStates={considerationsStates}
          benefitsOrder={benefitsOrder}
          considerationsOrder={considerationsOrder}
          onClose={() => setShowPreview(false)}
        />
      )}
    </DndContext>
  );
}

export default ConsolidationStrategy;