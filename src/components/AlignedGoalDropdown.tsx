import React from 'react';
import MultiChoiceSelect from './MultiChoiceSelect';

interface AlignedGoalDropdownProps {
  value: string;
  onChange: (value: string) => void;
  setFocusableRef: (key: string, element: HTMLElement | null) => void;
}

const AlignedGoalDropdown: React.FC<AlignedGoalDropdownProps> = ({ value, onChange, setFocusableRef }) => {
  const goalOptions = [
    'Build your retirement savings',
    'Repay your debt more quickly',
    'Save for children\'s education'
  ];

  return (
    <div className="max-w-md">
      <MultiChoiceSelect
        options={goalOptions}
        value={value}
        onChange={onChange}
        placeholder="ENTER GOAL HERE"
        setFocusableRef={setFocusableRef}
        focusKey="aligned-goal-dropdown"
        compact={true}
      />
    </div>
  );
};

export default AlignedGoalDropdown;