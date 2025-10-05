'use client';

import React, { useEffect, useState } from 'react';

interface GameLabelSelectorProps {
  readonly inputId: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

const GameLabelSelector: React.FC<GameLabelSelectorProps> = ({ inputId, value, onChange }) => {
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const fetchLabels = async () => {
      try {
        setIsLoading(true);
        // Fetch all accounts and aggregate unique labels
        const res = await fetch(`/api/accounts`, { cache: 'no-store' });
        if (!res.ok) return;
        const accounts = await res.json();
        const labelsSet = new Set<string>();
        if (Array.isArray(accounts)) {
          for (const acc of accounts) {
            const tokens = Array.isArray(acc?.privyTokens) ? acc.privyTokens : [];
            for (const pt of tokens) {
              const label = typeof pt?.gameLabel === 'string' ? pt.gameLabel : '';
              if (label) labelsSet.add(label);
            }
          }
        }
        if (mounted) setOptions(Array.from(labelsSet).sort());
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void fetchLabels();
    return () => { mounted = false; };
  }, []);

  return (
    <select
      id={inputId}
      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Select game label"
    >
      <option value="">{isLoading ? 'Loading…' : 'Select a label'}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};

export default GameLabelSelector;


