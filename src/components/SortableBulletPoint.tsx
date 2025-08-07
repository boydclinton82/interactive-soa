import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import InteractiveBulletPoint from './InteractiveBulletPoint';

interface SortableBulletPointProps {
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
  disableTransition?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  onBulkStatusUpdate?: (status: 'approved' | 'rejected') => void;
  selectedCount?: number;
  isBulkApproving?: boolean;
  isBulkRejecting?: boolean;
  // Interactive text props
  interactiveValues?: {[key: string]: string};
  onInteractiveValueChange?: (id: string, value: string) => void;
}

const SortableBulletPoint: React.FC<SortableBulletPointProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: props.disableTransition ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <div {...listeners} className="touch-none">
        <InteractiveBulletPoint {...props} />
      </div>
    </div>
  );
};

export default SortableBulletPoint;