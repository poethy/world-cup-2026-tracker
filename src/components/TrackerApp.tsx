import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { STICKERS } from '../data/stickers';
import {
  COUNTRIES,
  COUNTRY_BY_CODE,
  SECTION_ORDER,
  getStickerSectionKey,
} from '../data/album-structure';
import StickerCard from './StickerCard';
import StickerDetailModal from './StickerDetailModal';
import FlagBlock from './FlagBlock';
import { LocaleProvider, useI18n } from './LocaleProvider';
import type { Locale } from '../i18n';

type OwnedMap = Record<number, boolean>;

const TOTAL_STICKERS = 980;

const STICKER_SECTIONS: Record<number, string> = {};
for (const s of STICKERS) {
  STICKER_SECTIONS[s.number] = getStickerSectionKey(s.countryCode, s.number);
}

interface TrackerAppProps {
  locale: Locale;
}

function TrackerAppInner() {
  const { tr, getSectionLabel } = useI18n();
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

  // Load user collection — direct Supabase call (browser-side, no server proxy)
  useEffect(() => {
    async function loadCollection() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth/login';
        return;
      }
      const { data, error } = await supabase
        .from('user_stickers')
        .select('sticker_id')
        .eq('user_id', session.user.id);
      if (error) {
        console.error('[TrackerApp] load error:', error.message);
      } else {
        const map: OwnedMap = {};
        for (const row of data ?? []) map[row.sticker_id] = true;
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

      if (newOwned) {
        const { error } = await supabase
          .from('user_stickers')
          .upsert(
            { user_id: session.user.id, sticker_id: number, status: 'have' },
            { onConflict: 'user_id,sticker_id' }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_stickers')
          .delete()
          .eq('user_id', session.user.id)
          .eq('sticker_id', number);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error('[TrackerApp] save error:', e?.message ?? e);
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

    // When there's a text query, sort sections so that country code / name
    // matches float above sections that only match through player names.
    const q = query.trim().toLowerCase();
    if (q) {
      const sectionScore = (key: string): number => {
        const code = key.toLowerCase();
        const name = (COUNTRY_BY_CODE[key]?.name ?? '').toLowerCase();
        if (code === q || name === q)           return 0; // exact
        if (code.startsWith(q) || name.startsWith(q)) return 1; // prefix
        if (code.includes(q)  || name.includes(q))    return 2; // contains
        return 3;                                               // player-name only
      };
      ordered.sort((a, b) => sectionScore(a[0]) - sectionScore(b[0]));
    }

    return ordered;
  }, [filtered, query]);

  const handleReset = () => { setQuery(''); setFilter('all'); setCountryFilter('all'); };

  const detailSticker = detailNumber != null
    ? STICKERS.find(s => s.number === detailNumber) ?? null
    : null;

  const filterLabels = useMemo(() => ({
    all: tr('tracker.filterAll', 'All'),
    owned: tr('tracker.filterOwned', 'Owned'),
    missing: tr('tracker.filterMissing', 'Missing'),
  }), [tr]);

  const activeSectionLabel = countryFilter === 'all'
    ? tr('tracker.allSections', 'All sections')
    : getSectionLabel(countryFilter);

  if (loadingCollection) {
    return (
      <div className="loading-state mono">
        {tr('tracker.loading', 'Loading your collection…')}
      </div>
    );
  }

  return (
    <div className="tracker">
      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside className="tracker__sidebar">
        {/* Progress */}
        <div className="sb-section">
          <p className="sb-eyebrow">{tr('tracker.yourProgress', 'Your progress')}</p>
          <div className="progress-headline">
            <span className="progress-headline__num">{stats.owned}</span>
            <span className="progress-headline__total">/ {stats.total}</span>
            <span className="progress-headline__pct" style={{ marginLeft: 'auto' }}>{stats.pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${stats.pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            <span>{stats.owned} {tr('tracker.owned', 'Owned').toUpperCase()}</span>
            <span>{stats.missing} {tr('tracker.toGo', 'TO GO')}</span>
          </div>
          <div className="stat-tiles" style={{ marginTop: 14 }}>
            <div className="stat-tile stat-tile--ok">
              <span className="stat-tile__val">{stats.owned}</span>
              <span className="stat-tile__lbl">{tr('tracker.owned', 'Owned')}</span>
            </div>
            <div className="stat-tile stat-tile--miss">
              <span className="stat-tile__val">{stats.missing}</span>
              <span className="stat-tile__lbl">{tr('tracker.missing', 'Missing')}</span>
            </div>
          </div>
        </div>

        {/* Specials */}
        <div className="sb-section">
          <p className="sb-eyebrow">{tr('tracker.specials', 'Specials')} · {stats.ownedSpecial}/{stats.totalSpecial}</p>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 10px' }}>
            {tr('tracker.specialsDesc', 'Tournament, host nations & cover stickers.')}
          </p>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${stats.totalSpecial > 0 ? Math.round((stats.ownedSpecial / stats.totalSpecial) * 100) : 0}%` }} />
          </div>
        </div>

        {/* Top missing */}
        <div className="sb-section">
          <p className="sb-eyebrow">{tr('tracker.topMissingTeams', 'Top missing teams')}</p>
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
          <p className="sb-eyebrow">{tr('tracker.jumpTo', 'Jump to')}</p>
          <select
            className="select"
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
          >
            <option value="all">{tr('tracker.allSections', 'All sections')}</option>
            <option value="COVER">{tr('tracker.cover', 'Cover')}</option>
            <option value="TRN">{tr('tracker.tournament', 'Tournament')}</option>
            <option value="HOST">{tr('tracker.hostNations', 'Host Nations')}</option>
            <optgroup label={tr('tracker.teams', 'Teams')}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </optgroup>
          </select>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main className="tracker__main">
        {/* Section nav chips — auto-scrolling carousel, pauses on hover */}
        <nav className="section-nav" aria-label="Sections">
          <div className="section-nav__track">
            {[false, true].map((isDupe) => (
              <div
                key={isDupe ? 'dupe' : 'orig'}
                className="section-nav__set"
                aria-hidden={isDupe ? true : undefined}
              >
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
                      tabIndex={isDupe ? -1 : undefined}
                    >
                      <span className="dot" />
                      <span>{getSectionLabel(key)}</span>
                      <span style={{ opacity: 0.5 }}>{ownedInSection}/{items.length}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        {/* Filter bar */}
        <div className="filterbar">
          <div className="filterbar__strip">
            <span className="filterbar__strip-label">{tr('tracker.live', 'Live')}</span>
            <span className="filterbar__strip-stat">
              {tr('tracker.showing', 'Showing')} <b>{filtered.length}</b> {tr('tracker.of', 'of')} <b>{TOTAL_STICKERS}</b>
            </span>
            <span className="filterbar__strip-stat">
              {tr('tracker.owned', 'Owned')} <b>{stats.owned}</b> · {tr('tracker.missing', 'Missing')} <b>{stats.missing}</b>
            </span>
            <span className="filterbar__strip-spacer" />
            <span className="filterbar__strip-stat">
              {activeSectionLabel} · {filterLabels[filter].toUpperCase()}
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
                placeholder={tr('tracker.searchPlaceholder', 'Search player, team or section…')}
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
              <option value="all">{tr('tracker.allSections', 'All sections')}</option>
              <option value="COVER">{tr('tracker.cover', 'Cover')}</option>
              <option value="TRN">{tr('tracker.tournament', 'Tournament')}</option>
              <option value="HOST">{tr('tracker.hostNations', 'Host Nations')}</option>
              <optgroup label={tr('tracker.teams', 'Teams')}>
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
                  {filterLabels[k]}
                </button>
              ))}
            </div>

            {(query || filter !== 'all' || countryFilter !== 'all') && (
              <button className="btn btn--ghost" onClick={handleReset}>{tr('tracker.reset', 'Reset')}</button>
            )}
          </div>
        </div>

        {/* Sticker sections */}
        {grouped.length === 0 && (
          <div className="empty">
            {tr('tracker.emptyFilters', 'No stickers match your filters.')}{' '}
            <button className="btn btn--ghost" onClick={handleReset} style={{ display: 'inline-flex', padding: '4px 10px' }}>
              {tr('tracker.reset', 'Reset')}
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
                  {getSectionLabel(sectionKey)}
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

export default function TrackerApp({ locale }: TrackerAppProps) {
  return (
    <LocaleProvider locale={locale}>
      <TrackerAppInner />
    </LocaleProvider>
  );
}
