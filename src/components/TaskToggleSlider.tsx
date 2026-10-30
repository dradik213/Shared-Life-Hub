import React from 'react';

interface TaskToggleSliderProps {
  checked: boolean;
  onChange: (newChecked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const TaskToggleSlider: React.FC<TaskToggleSliderProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || 'Task completed status'}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
        checked ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
};
