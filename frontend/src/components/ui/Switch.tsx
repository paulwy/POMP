
import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, id }) => {
  return (
    <button
      id={id}
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 translate-x-0 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

