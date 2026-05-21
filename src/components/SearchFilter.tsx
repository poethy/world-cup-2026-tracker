import React from 'react';
import { COUNTRIES } from '../data/album-structure';

export type FilterStatus = 'all' | 'owned' | 'missing';

interface SearchFilterProps {
  searchQuery: string;
  selectedCountry: string;
  filterStatus: FilterStatus;
  onSearchChange: (q: string) => void;
  onCountryChange: (code: string) => void;
  onStatusChange: (status: FilterStatus) => void;
  onReset: () => void;
}

export default function SearchFilter({
  searchQuery,
  selectedCountry,
  filterStatus,
  onSearchChange,
  onCountryChange,
  onStatusChange,
  onReset,
}: SearchFilterProps) {
  const hasFilters = searchQuery || selectedCountry || filterStatus !== 'all';

  return (
    <div className="search-filter">
      <div className="filter-row">
        <input
          type="search"
          placeholder="Search player name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className="country-select"
        >
          <option value="">All Countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="status-row">
        <div className="status-buttons">
          {(['all', 'owned', 'missing'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`status-btn ${filterStatus === s ? 'active' : ''} ${s}`}
            >
              {s === 'all' ? 'All' : s === 'owned' ? 'Have' : 'Missing'}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={onReset} className="reset-btn">
            Clear filters
          </button>
        )}
      </div>

      <style>{`
        .search-filter {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-row {
          display: flex;
          gap: 0.75rem;
        }

        .search-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          min-width: 0;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }

        .country-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .country-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .status-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .status-btn {
          padding: 0.375rem 0.875rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s;
        }

        .status-btn:hover {
          border-color: #9ca3af;
          color: #374151;
        }

        .status-btn.active.all    { background: #667eea; border-color: #667eea; color: white; }
        .status-btn.active.owned  { background: #22c55e; border-color: #22c55e; color: white; }
        .status-btn.active.missing { background: #ef4444; border-color: #ef4444; color: white; }

        .reset-btn {
          font-size: 0.75rem;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .reset-btn:hover {
          color: #374151;
        }

        @media (max-width: 480px) {
          .filter-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
