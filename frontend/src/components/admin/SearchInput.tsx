import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Wait this long after typing stops before calling onChange. 0 = every keystroke. */
  debounceMs?: number;
  ariaLabel?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value, onChange, placeholder = 'Search…', debounceMs = 300, ariaLabel = 'Search', className,
}) => {
  // Local text so typing stays instant while the parent update is debounced.
  const [text, setText] = useState(value);
  const emit = useDebouncedCallback(onChange, debounceMs);

  // Follow external changes (e.g. FilterBar reset).
  useEffect(() => setText(value), [value]);

  return (
    <div className={`hcx-search ${className ?? ''}`}>
      <Search size={16} className="hcx-search__icon" aria-hidden />
      <input
        type="search"
        className="hcx-search__input"
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => {
          setText(e.target.value);
          emit(e.target.value);
        }}
      />
      {text && (
        <button
          type="button"
          className="hcx-search__clear"
          aria-label="Clear search"
          onClick={() => {
            setText('');
            onChange('');
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
