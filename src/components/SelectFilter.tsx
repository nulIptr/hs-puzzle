
import React from 'react';

interface SelectFilterProps<T> {
  label: string;
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T | null) => void;
}

export const SelectFilter = <T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectFilterProps<T>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>{label}</label>
    <select
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? null : (val as T));
      }}
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        border: '1px solid #d9d9d9',
        fontSize: '14px',
      }}
    >
      <option value="">全部</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

