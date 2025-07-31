import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface InvisibleDropZoneProps {
  id: string;
}

const InvisibleDropZone: React.FC<InvisibleDropZoneProps> = ({ id }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-2 w-full transition-colors duration-200 ${
        isOver ? 'bg-blue-100 bg-opacity-50' : 'bg-transparent'
      }`}
      style={{
        // Make it invisible but still capture drops
        minHeight: '8px',
        pointerEvents: 'auto',
      }}
    />
  );
};

export default InvisibleDropZone;