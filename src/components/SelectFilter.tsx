
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
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#ffd966',
      }}
    >
      {label}
    </label>
    <select
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(e) => {
        const val = e.target.value;
        if (val === '') {
          onChange(null);
          return;
        }
        // <select> 的 value 始终是 string；
        // 根据 options 中首个 value 的实际类型还原 T，避免 number 字段被存成 string 导致后续严格比较失败。
        const sample = options[0]?.value;
        onChange((typeof sample === 'number' ? Number(val) : val) as T);
      }}
      style={{
        padding: '5px 8px',
        borderRadius: 4,
        border: '1px solid #5a3a1a',
        fontSize: 12,
        background: '#1a1208',
        color: '#f4e4bc',
        outline: 'none',
      }}
    >
      <option value="">全部</option>
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
