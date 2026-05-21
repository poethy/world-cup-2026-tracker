import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { STICKERS } from '../data/stickers';
import {
  COUNTRIES,
  COUNTRY_BY_CODE,
  SECTION_ORDER,
  SECTION_LABELS,
  getStickerSectionKey,
} from '../data/album-structure';
import StickerCard from './StickerCard';
import StickerDetailModal from './StickerDetailModal';
import FlagBlock from './FlagBlock';

type OwnedMap = Record<number, boolean>;

const TOTAL_STICKERS = 980;

// Build a quick section-key lookup for each sticker
const STICKER_SECTIONS: Record<number, string> = {};
for (const s of STICKERS) {
  STICKER_SECTIONS[s.number] = getStickerSectionKey(s.countryCode, s.number);
}

export default function TrackerApp() {
  const [owned, setOwned] = useState<OwnedMap>({});
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [detailNumber, setDetailNumber] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Load user collection
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
        for (const row of result.data ?? []) map[row.sticker_id] = true;
        setOwned(map);
      }
      setLoadingCollection(false);
    }
    loadCollection();
  }, []);

  // Handle section from URL ?section=XXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) setCountryFilter(section);
  }, []);

  const handleToggle = useCallback(async (number: number, newOwned: boolean) => {
    if (toggling.has(number)) return;
    setToggling(prev => new Set(prev).add(number));
    setOwned(prev => ({ ...prev, [number]: newOwned }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      };
      if (newOwned) {
        await fetch('/api/user-collection', {
          method: 'POST', headers,
          body: JSON.stringify({ sticker_id: number }),
        });
      } else {
        await fetch(`/api/user-collection?sticker_id=${number}`, { method: 'DELETE', headers });
      }
    } catch {
      setOwned(prev => ({ ...prev, [number]: !newOwned }));
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(number); return n; });
    }
  }, [toggling]);

  // ----- Stats -----
  const stats = useMemo(() => {
    const total = TOTAL_STICKERS;
    let ownedCount = 0, ownedSpecial = 0, totalSpecial = 0;
    const byCountry: Record<string, { total: number; owned: number }> = {};

    for (const s of STICKERS) {
      const isSpecial = s.sectionType === 'special';
      if (isSpecial) totalSpecial++;
      const isOwned = !!owned[s.number];
      if (isOwned) {
        ownedCount++;
        if (isSpecial) ownedSpecial++;
      }
      const cc = s.countryCode;
      if (COUNTRY_BY_CODE[cc]) {
        if (!byCountry[cc]) byCountry[cc] = { total: 0, owned: 0 };
        byCountry[cc].total++;
        if (isOwned) byCountry[cc].owned++;
      }
    }

    const topMissing = Object.entries(byCountry)
      .map(([code, v]) => ({ code, missing: v.total - v.owned, total: v.total }))
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 5);

    return {
      total, owned: ownedCount, missing: total - ownedCount,
      ownedSpecial, totalSpecial,
      pct: Math.round((ownedCount / total) * 100),
      topMissing,
    };
  }, [owned]);

  // ----- Filtered & Grouped -----
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STICKERS.filter(s => {
      if (filter === 'owned' && !owned[s.number]) return false;
      if (filter === 'missing' && owned[s.number]) return false;
      if (countryFilter !== 'all') {
        const sectionKey = STICKER_SECTIONS[s.number];
        if (sectionKey !== countryFilter) return false;
      }
      if (q) {
        const cc = COUNTRY_BY_CODE[s.countryCode];
        const hay = `${s.name} ${s.countryCode} ${s.country} ${cc?.name ?? ''} ${cc?.region ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [owned, filter, countryFilter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof STICKERS>();
    for (const s of filtered) {
      const key = STICKER_SECTIONS[s.number];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    const ordered: Array<[string, typeof STICKERS]> = [];
    for (const key of SECTION_ORDER) {
      if (map.has(key)) ordered.push([key, map.get(key)!]);
    }
    return ordered;
  }, [filtered]);

  const handleReset = () => { setQuery(''); setFilter('all'); setCountryFilter('all'); };

  const detailSticker = detailNumber != null
    ? STICKERS.find(s => s.number === detailNumber) ?? null
    : null;

  if (loadingCollection) {
    return (
      <div className="loading-state mono">
        Loading your collection…
      </div>
    );
  }

  return (
    <div className="tracker">
      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside className="tracker__sidebar">
        {/* Progress */}
        <div className="sb-section">
          <p className="sb-eyebrow">Your progress</p>
          <div className="progress-headline">
            <span className="progress-headline__num">{stats.owned}</span>
            <span className="progress-headline__total">/ {stats.total}</span>
            <span className="progress-headline__pct" style={{ marginLeft: 'auto' }}>{stats.pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${stats.pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            <span>{stats.owned} OWNED</span>
            <span>{stats.missing} TO GO</span>
          </div>
          <div className="stat-tiles" style={{ marginTop: 14 }}>
            <div className="stat-tile stat-tile--ok">
              <span className="stat-tile__val">{stats.owned}</span>
              <span className="stat-tile__lbl">Owned</span>
            </div>
            <div className="stat-tile stat-tile--miss">
              <span className="stat-tile__val">{stats.missing}</span>
              <span className="stat-tile__lbl">Missing</span>
            </div>
          </div>
        </div>

        {/* Specials */}
        <div className="sb-section">
          <p className="sb-eyebrow">Specials · {stats.ownedSpecial}/{stats.totalSpecial}</p>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 10px' }}>
            Tournament, host nations & cover stickers.
          </p>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${stats.totalSpecial > 0 ? Math.round((stats.ownedSpecial / stats.totalSpecial) * 100) : 0}%` }} />
          </div>
        </div>

        {/* Top missing */}
        <div className="sb-section">
          <p className="sb-eyebrow">Top missing teams</p>
          <div className="top-missing">
            {stats.topMissing.map(row => {
              const c = COUNTRY_BY_CODE[row.code];
              const pct = row.total ? ((row.total - row.missing) / row.total) * 100 : 0;
              return (
                <button
                  key={row.code}
                  className="top-missing__row"
                  onClick={() => setCountryFilter(row.code)}
                >
                  {c && <FlagBlock country={c} size="sm" />}
                  <span className="top-missing__code">{row.code}</span>
                  <span className="top-missing__bar">
                    <span style={{ width: `${pct}%`, background: c?.primary || 'var(--ink-2)' }} />
                  </span>
                  <span className="top-missing__num">−{row.missing}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Jump to */}
        <div className="sb-section">
          <p className="sb-eyebrow">Jump to</p>
          <select
            className="select"
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
          >
            <option value="all">All sections</option>
            <option value="COVER">Cover</option>
            <option value="TRN">Tournament</option>
            <option value="HOST">Host Nations</option>
            <optgroup label="Teams">
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </optgroup>
          </select>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main className="tracker__main">
        {/* Section nav chips */}
        <nav className="section-nav" aria-label="Sections">
          {SECTION_ORDER.map(key => {
            const items = STICKERS.filter(s => STICKER_SECTIONS[s.number] === key);
            if (!items.length) return null;
            const ownedInSection = items.filter(s => owned[s.number]).length;
            const isActive = countryFilter === key;
            return (
              <button
                key={key}
                onClick={() => setCountryFilter(key === countryFilter ? 'all' : key)}
                className={[isActive ? 'is-active' : '', ownedInSection > 0 ? 'has-progress' : ''].filter(Boolean).join(' ')}
              >
                <span className="dot" />
                <span>{SECTION_LABELS[key] || key}</span>
                <span style={{ opacity: 0.5 }}>{ownedInSection}/{items.length}</span>
              </button>
            );
          })}
        </nav>

        {/* Filter bar */}
        <div className="filterbar">
          <div className="filterbar__strip">
            <span className="filterbar__strip-label">Live</span>
            <span className="filterbar__strip-stat">
              Showing <b>{filtered.length}</b> of <b>{TOTAL_STICKERS}</b>
            </span>
            <span className="filterbar__strip-stat">
              Owned <b>{stats.owned}</b> · Missing <b>{stats.missing}</b>
            </span>
            <span className="filterbar__strip-spacer" />
            <span className="filterbar__strip-stat">
              {countryFilter === 'all'
                ? 'All sections'
                : (SECTION_LABELS[countryFilter] || countryFilter)} · {filter.toUpperCase()}
            </span>
          </div>

          <div className="filterbar__controls">
            <div className="filterbar__search">
              <svg className="filterbar__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
              </svg>
              <input
                ref={searchRef}
                className="input"
                type="search"
                placeholder="Search player, team or section…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {!query && <span className="filterbar__search-kbd">⌘K</span>}
            </div>

            <select
              className="select filterbar__select"
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
            >
              <option value="all">All sections</option>
              <option value="COVER">Cover</option>
              <option value="TRN">Tournament</option>
              <option value="HOST">Host Nations</option>
              <optgroup label="Teams">
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </optgroup>
            </select>

            <div className="segmented" role="tablist" aria-label="Filter">
              {(['all', 'owned', 'missing'] as const).map(k => (
                <button
                  key={k}
                  className={filter === k ? 'is-active' : ''}
                  onClick={() => setFilter(k)}
                  role="tab"
                  aria-selected={filter === k}
                >
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>

            {(query || filter !== 'all' || countryFilter !== 'all') && (
              <button className="btn btn--ghost" onClick={handleReset}>Reset</button>
            )}
          </div>
        </div>

        {/* Sticker sections */}
        {grouped.length === 0 && (
          <div className="empty">
            No stickers match your filters.{' '}
            <button className="btn btn--ghost" onClick={handleReset} style={{ display: 'inline-flex', padding: '4px 10px' }}>
              Reset
            </button>
          </div>
        )}

        {grouped.map(([sectionKey, items]) => {
          const ownedInSection = items.filter(s => owned[s.number]).length;
          const countryData = COUNTRY_BY_CODE[sectionKey];
          return (
            <section className="section" key={sectionKey} data-section={sectionKey}>
              <header className="section__head">
                <h2 className="section__title">
                  {countryData && <FlagBlock country={countryData} size="md" />}
                  {SECTION_LABELS[sectionKey] || sectionKey}
                </h2>
                <span className="section__code">{sectionKey}</span>
                <span className="section__progress">
                  <b>{ownedInSection}</b> / {items.length}
                </span>
              </header>
              <div className="sticker-grid">
                {items.map(s => (
                  <StickerCard
                    key={s.number}
                    number={s.number}
                    name={s.name}
                    country={s.country}
                    countryCode={s.countryCode}
                    sectionType={s.sectionType}
                    owned={!!owned[s.number]}
                    onToggle={handleToggle}
                    onOpenDetail={setDetailNumber}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Detail modal */}
      {detailSticker && (
        <StickerDetailModal
          sticker={detailSticker}
          owned={!!owned[detailSticker.number]}
          onClose={() => setDetailNumber(null)}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
