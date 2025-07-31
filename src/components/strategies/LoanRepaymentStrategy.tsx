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
import AddItemModal from '../AddItemModal';
import AddButton from '../AddButton';
import AlignedGoalDropdown from '../AlignedGoalDropdown';
import SortableBulletPoint from '../SortableBulletPoint';
import InvisibleDropZone from '../InvisibleDropZone';
import FilterControls from '../FilterControls';
import PreviewModal from '../PreviewModal';
import HighlightedText from '../HighlightedText';
import { BulletPointState } from '../../types/strategies';

interface LoanRepaymentStrategyProps {
  focusableRefs: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
  onElementFocused: (elementKey: string) => void;
  interactionMode: 'mouse' | 'keyboard';
  navigateToNext: () => void;
  navigateToElement: (targetElementKey: string) => void;
  getNextElementKey: (currentElementKey: string) => string | null;
}

function LoanRepaymentStrategy({
  focusableRefs,
  onElementFocused,
  interactionMode,
  navigateToNext,
  navigateToElement,
  getNextElementKey
}: LoanRepaymentStrategyProps) {
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

  // Drag and drop sensors
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

  const loanBenefitsBullets: BulletPointState[] = [
    {
      id: 'loan-benefit-1',
      text: 'By making additional repayments you will reduce the interest over the life of the loan which will help repay the loan sooner.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-2',
      text: 'This will also reduce the impact of fluctuating interest rates on your cash flow.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-3',
      text: 'The quicker the loan is repaid, the sooner you will be able to boost your wealth accumulation plans using the amounts previously directed to loan repayments.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-4',
      text: 'This will free up cash flow of $XXX p/frequency of which can be used to meet your expenditure and other objectives.',
      status: 'pending'
    },
    {
      id: 'loan-benefit-5',
      text: 'Altering the repayment frequency on your mortgage from monthly to fortnightly/weekly will increase the number of repayments you make each year which may help reduce the amount of interest paid over the life of the loan and repay your loan sooner.',
      status: 'pending'
    }
  ];

  const loanConsiderationsBullets: BulletPointState[] = [
    {
      id: 'loan-consideration-1',
      text: 'The interest expense associated with this loan is tax deductible. Increasing the rate at which you repay this debt will reduce the associated tax deduction, potentially increasing your income tax liability in future financial years. You should discuss these implications with your taxation specialist.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-2',
      text: 'Increasing your repayments means that you will have less cashflow to fund your other expenses. Should you need to access these funds in the future, there may be costs associated with this.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-3',
      text: 'Some lenders may charge \'prepayment\' or \'early termination\' fees as a result of early repayment and there may be restrictions on additional repayments. Therefore, it is important you consult with your current lender(s) before making a lump sum repayment.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-4',
      text: 'Decreasing regular repayments will result in a longer loan term and higher ongoing interest charged.',
      status: 'pending'
    },
    {
      id: 'loan-consideration-5',
      text: 'An increase in variable rates will result in higher interest being paid over time which will result in a change to the projections provided.',
      status: 'pending'
    }
  ];

  const [benefitsStates, setBenefitsStates] = useState<BulletPointState[]>(loanBenefitsBullets);
  const [considerationsStates, setConsiderationsStates] = useState<BulletPointState[]>(loanConsiderationsBullets);
  
  // Order state for drag and drop
  const [benefitsOrder, setBenefitsOrder] = useState<string[]>([
    'loan-benefit-1', 'loan-benefit-2', 'loan-benefit-3', 'loan-benefit-4', 'loan-benefit-5'
  ]);
  const [considerationsOrder, setConsiderationsOrder] = useState<string[]>([
    'loan-consideration-1', 'loan-consideration-2', 'loan-consideration-3', 
    'loan-consideration-4', 'loan-consideration-5'
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
      id: `loan-${addItemSection === 'benefits' ? 'benefit' : 'consideration'}-${Date.now()}`,
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

    const isBenefitsItem = (id: string) => id.startsWith('loan-benefit-');
    const isConsiderationsItem = (id: string) => id.startsWith('loan-consideration-');

    if (overId === 'loan-benefits-drop-zone') {
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

    if (overId === 'loan-considerations-drop-zone') {
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
      if (showAddItemModal) {
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
  }, [showRejected, showOnlyPending, showAddItemModal]);

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
        Alter your loan repayments
      </h1>

      {/* Introductory text with highlighted placeholders */}
      <p className="font-tahoma text-sm text-black mb-4">
        After reviewing your cashflow position, we recommend you reduce your debt repayments to{' '}
        <HighlightedText id="loan-amount" type="currency">$XXX</HighlightedText> per{' '}
        <HighlightedText id="loan-frequency" type="frequency">month/fortnight/week</HighlightedText>{' '}
        into your <HighlightedText id="loan-type" type="loanType">XXX</HighlightedText> loan.
      </p>

      {/* Section Divider */}
      <div className="my-1">
        <div className="h-px bg-gray-300"></div>
      </div>

      {/* Aligned Goal Section */}
      <div className="mt-4 mb-4">
        <h2 className="font-tahoma text-sm font-bold text-black mb-3">
          Aligned goal
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
              .map((bullet) => {
                // Special handling for bullets with highlighted text
                let processedText = bullet.text;
                let processedElement = null;

                if (bullet.id === 'loan-benefit-3') {
                  processedElement = (
                    <>
                      The quicker the loan is <span className="underline">repaid</span>, the sooner you will be able to boost your wealth accumulation plans using the amounts previously directed to loan repayments.
                    </>
                  );
                } else if (bullet.id === 'loan-benefit-4') {
                  processedElement = (
                    <>
                      This will free up cash flow of <HighlightedText id="benefit-cash-flow" type="currency">$XXX p/frequency</HighlightedText> of which can be used to meet your expenditure and other objectives.
                    </>
                  );
                } else if (bullet.id === 'loan-benefit-5') {
                  processedElement = (
                    <>
                      Altering the repayment frequency on your mortgage from monthly to <HighlightedText id="benefit-frequency" type="frequency">fortnightly/weekly</HighlightedText> will increase the number of repayments you make each year which may help reduce the amount of interest paid over the life of the loan and repay your loan sooner.
                    </>
                  );
                } else if (bullet.id === 'loan-consideration-3') {
                  processedElement = (
                    <>
                      Some lenders may charge 'prepayment' or 'early termination' fees as <span className="underline">a result of</span> early repayment and there may be restrictions on additional repayments. Therefore, it is important you consult with your current lender(s) before making a lump sum repayment.
                    </>
                  );
                } else if (bullet.id === 'loan-consideration-5') {
                  processedElement = (
                    <>
                      An increase in variable rates will result in higher interest being paid <span className="underline">over time</span> which will result in a change to the projections provided.
                    </>
                  );
                }

                return (
                  <SortableBulletPoint
                    key={bullet.id}
                    id={bullet.id}
                    text={processedText}
                    customContent={processedElement}
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
                );
              })}
          </div>
        </SortableContext>
        <InvisibleDropZone id="loan-benefits-drop-zone" />
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
        <InvisibleDropZone id="loan-considerations-drop-zone" />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddItemModal}
        onClose={handleAddItemModalClose}
        onSubmit={handleAddItemModalSubmit}
        title={addItemSection === 'benefits' ? 'Add Benefit' : 'Add Consideration'}
      />

      {/* Preview Modal - TODO: Update to handle loan strategy */}
      {showPreview && (
        <PreviewModal
          tableRows={[]}
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

export default LoanRepaymentStrategy;