import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { STICKERS } from '../data/stickers';
import { COUNTRIES } from '../data/album-structure';
import StickerCard from './StickerCard';
import StatsPanel from './StatsPanel';
import SearchFilter, { type FilterStatus } from './SearchFilter';

type OwnedMap = Record<number, boolean>;

const TOTAL_STICKERS = 980;

// Count per country for stats
const COUNTRY_TOTALS: Record<string, number> = {};
for (const s of STICKERS) {
  COUNTRY_TOTALS[s.countryCode] = (COUNTRY_TOTALS[s.countryCode] || 0) + 1;
}

export default function TrackerApp() {
  const [owned, setOwned] = useState<OwnedMap>({});
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  // Load user collection on mount
  useEffect(() => {
    async function loadCollection() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth/login';
        return;
      }

      const response = await fetch('/api/user-collection', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const result = await response.json();
        const map: OwnedMap = {};
        for (const row of result.data ?? []) {
          map[row.sticker_id] = true;
        }
        setOwned(map);
      }
      setLoadingCollection(false);
    }

    loadCollection();
  }, []);

  const handleToggle = useCallback(async (number: number, newOwned: boolean) => {
    if (toggling.has(number)) return;
    setToggling((prev) => new Set(prev).add(number));

    // Optimistic update
    setOwned((prev) => ({ ...prev, [number]: newOwned }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };

      if (newOwned) {
        await fetch('/api/user-collection', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sticker_id: number }),
        });
      } else {
        await fetch(`/api/user-collection?sticker_id=${number}`, {
          method: 'DELETE',
          headers,
        });
      }
    } catch {
      // Revert on error
      setOwned((prev) => ({ ...prev, [number]: !newOwned }));
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(number);
        return next;
      });
    }
  }, [toggling]);

  // Filtered stickers
  const filtered = useMemo(() => {
    return STICKERS.filter((s) => {
      if (selectedCountry && s.countryCode !== selectedCountry) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.country.toLowerCase().includes(q)) return false;
      }
      if (filterStatus === 'owned') return !!owned[s.number];
      if (filterStatus === 'missing') return !owned[s.number];
      return true;
    });
  }, [selectedCountry, searchQuery, filterStatus, owned]);

  // Group filtered stickers by country for display
  const grouped = useMemo(() => {
    const groups: Record<string, typeof STICKERS> = {};
    for (const s of filtered) {
      if (!groups[s.countryCode]) groups[s.countryCode] = [];
      groups[s.countryCode].push(s);
    }
    return groups;
  }, [filtered]);

  const hasCount = useMemo(() => Object.values(owned).filter(Boolean).length, [owned]);

  const byCountry = useMemo(() => {
    const result: Record<string, { country: string; has: number }> = {};
    for (const s of STICKERS) {
      if (owned[s.number]) {
        if (!result[s.countryCode]) result[s.countryCode] = { country: s.country, has: 0 };
        result[s.countryCode].has++;
      }
    }
    return result;
  }, [owned]);

  const groupKeys = Object.keys(grouped);

  return (
    <div className="tracker-app">
      <div className="tracker-sidebar">
        <StatsPanel
          hasCount={hasCount}
          totalStickers={TOTAL_STICKERS}
          byCountry={byCountry}
          allCountryCounts={COUNTRY_TOTALS}
        />
      </div>

      <div className="tracker-main">
        <SearchFilter
          searchQuery={searchQuery}
          selectedCountry={selectedCountry}
          filterStatus={filterStatus}
          onSearchChange={setSearchQuery}
          onCountryChange={setSelectedCountry}
          onStatusChange={setFilterStatus}
          onReset={() => {
            setSearchQuery('');
            setSelectedCountry('');
            setFilterStatus('all');
          }}
        />

        {loadingCollection ? (
          <div className="loading-state">Loading your collection...</div>
        ) : groupKeys.length === 0 ? (
          <div className="empty-state">
            <p>No stickers match your filters.</p>
          </div>
        ) : (
          <div className="sticker-sections">
            {groupKeys.map((code) => {
              const stickers = grouped[code];
              const countryName = stickers[0].country;
              const groupOwned = stickers.filter((s) => owned[s.number]).length;
              const groupTotal = stickers.length;

              return (
                <section key={code} className="sticker-section">
                  <div className="section-header">
                    <h2 className="section-title">
                      {countryName}
                      <span className="section-code">{code}</span>
                    </h2>
                    <span className="section-progress">
                      {groupOwned}/{groupTotal}
                    </span>
                  </div>
                  <div className="sticker-grid">
                    {stickers.map((s) => (
                      <StickerCard
                        key={s.number}
                        number={s.number}
                        name={s.name}
                        country={s.country}
                        countryCode={s.countryCode}
                        sectionType={s.sectionType}
                        owned={!!owned[s.number]}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .tracker-app {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .tracker-sidebar {
          position: sticky;
          top: 1rem;
        }

        .tracker-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 0;
        }

        .loading-state, .empty-state {
          padding: 3rem;
          text-align: center;
          color: #6b7280;
          background: white;
          border-radius: 8px;
        }

        .sticker-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sticker-section {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .section-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .section-code {
          font-size: 0.7rem;
          font-weight: 500;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 1px 6px;
          border-radius: 10px;
        }

        .section-progress {
          font-size: 0.8rem;
          font-weight: 600;
          color: #22c55e;
        }

        .sticker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .tracker-app {
            grid-template-columns: 1fr;
          }

          .tracker-sidebar {
            position: static;
          }
        }

        @media (max-width: 480px) {
          .sticker-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
