
import React from 'react';

interface MatchTagProps {
  label: string;
  match: boolean;
}

export const MatchTag: React.FC<MatchTagProps> = ({ label, match }) => (
  <span
    style={{
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '12px',
      background: match ? '#d4edda' : '#f8d7da',
      color: match ? '#155724' : '#721c24',
    }}
  >
    {label}
  </span>
);

