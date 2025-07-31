import React, { useState, useEffect, useRef } from 'react';
import StrategySidebar from './components/StrategySidebar';
import ConsolidationStrategy from './components/strategies/ConsolidationStrategy';
import LoanRepaymentStrategy from './components/strategies/LoanRepaymentStrategy';
import { StrategyType } from './types/strategies';

function App() {
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('consolidation');
  const [interactionMode, setInteractionMode] = useState<'mouse' | 'keyboard'>('mouse');
  
  // Focus management
  const [currentFocusIndex, setCurrentFocusIndex] = useState<number>(0);
  const focusableRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [focusableElements, setFocusableElements] = useState<string[]>([]);

  // Handle strategy changes
  const handleStrategyChange = (strategy: StrategyType) => {
    setActiveStrategy(strategy);
    // Reset focus when switching strategies
    setCurrentFocusIndex(0);
  };

  // Track interaction mode for focus priority
  useEffect(() => {
    const handleMouseMove = () => {
      // When switching to mouse mode, blur the currently focused element
      if (interactionMode === 'keyboard' && document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
      setInteractionMode('mouse');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only switch to keyboard mode for navigation keys
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter') {
        setInteractionMode('keyboard');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [interactionMode]);

  // Update focusable elements list when data changes
  useEffect(() => {
    const elements: string[] = [];
    
    if (activeStrategy === 'consolidation') {
      // Elements will be populated by ConsolidationStrategy
    } else if (activeStrategy === 'loanRepayment') {
      // Elements will be populated by LoanRepaymentStrategy
    }
    
    setFocusableElements(elements);
  }, [activeStrategy]);

  // Focus management functions
  const focusElement = (elementKey: string) => {
    const element = focusableRefs.current[elementKey];
    if (element) {
      element.focus();
      const index = focusableElements.indexOf(elementKey);
      if (index >= 0) {
        setCurrentFocusIndex(index);
      }
    }
  };

  // Handle when an element gets focused (for click-based tab pickup)
  const handleElementFocused = (elementKey: string) => {
    const index = focusableElements.indexOf(elementKey);
    if (index >= 0) {
      setCurrentFocusIndex(index);
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
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentFocusIndex, focusableElements]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <StrategySidebar 
        activeStrategy={activeStrategy}
        onStrategyChange={handleStrategyChange}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-72">
        <div className="py-8">
          <div className="max-w-4xl mx-auto bg-white shadow-lg p-8">
            {activeStrategy === 'consolidation' && (
              <ConsolidationStrategy 
                focusableRefs={focusableRefs}
                onElementFocused={handleElementFocused}
                interactionMode={interactionMode}
                navigateToNext={navigateToNext}
                navigateToElement={navigateToElement}
                getNextElementKey={getNextElementKey}
              />
            )}
            
            {activeStrategy === 'loanRepayment' && (
              <LoanRepaymentStrategy 
                focusableRefs={focusableRefs}
                onElementFocused={handleElementFocused}
                interactionMode={interactionMode}
                navigateToNext={navigateToNext}
                navigateToElement={navigateToElement}
                getNextElementKey={getNextElementKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;