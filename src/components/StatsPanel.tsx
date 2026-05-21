import React from 'react';

interface StatsPanelProps {
  hasCount: number;
  totalStickers: number;
  byCountry: Record<string, { country: string; has: number }>;
  allCountryCounts: Record<string, number>;
}

export default function StatsPanel({
  hasCount,
  totalStickers,
  byCountry,
  allCountryCounts,
}: StatsPanelProps) {
  const missingCount = totalStickers - hasCount;
  const pct = totalStickers > 0 ? (hasCount / totalStickers) * 100 : 0;

  // Top 5 countries with most missing stickers
  const topMissing = Object.entries(allCountryCounts)
    .map(([code, total]) => ({
      code,
      total,
      has: byCountry[code]?.has ?? 0,
      missing: total - (byCountry[code]?.has ?? 0),
      country: byCountry[code]?.country ?? code,
    }))
    .filter((c) => c.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 5);

  return (
    <div className="stats-panel">
      <h2>Your Progress</h2>

      <div className="progress-section">
        <div className="progress-numbers">
          <span className="big-number">{hasCount}</span>
          <span className="divider"> / </span>
          <span className="total-number">{totalStickers}</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="progress-labels">
          <span className="pct-label">{pct.toFixed(1)}% complete</span>
          <span className="missing-label">{missingCount} missing</span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card green">
          <span className="stat-value">{hasCount}</span>
          <span className="stat-label">Have</span>
        </div>
        <div className="stat-card red">
          <span className="stat-value">{missingCount}</span>
          <span className="stat-label">Missing</span>
        </div>
        <div className="stat-card blue">
          <span className="stat-value">{pct.toFixed(0)}%</span>
          <span className="stat-label">Complete</span>
        </div>
      </div>

      {topMissing.length > 0 && (
        <div className="top-missing">
          <h3>Most Missing</h3>
          {topMissing.map((c) => (
            <div key={c.code} className="country-bar-row">
              <span className="country-code">{c.code}</span>
              <div className="country-bar-bg">
                <div
                  className="country-bar-fill"
                  style={{ width: `${(c.has / c.total) * 100}%` }}
                />
              </div>
              <span className="country-missing">-{c.missing}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .stats-panel {
          background: white;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .stats-panel h2 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #111827;
        }

        .progress-section {
          margin-bottom: 1.25rem;
        }

        .progress-numbers {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 0.5rem;
        }

        .big-number {
          font-size: 2rem;
          font-weight: 700;
          color: #22c55e;
        }

        .divider {
          font-size: 1.25rem;
          color: #9ca3af;
        }

        .total-number {
          font-size: 1.25rem;
          color: #6b7280;
        }

        .progress-bar-container {
          height: 10px;
          background: #e5e7eb;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 0.35rem;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border-radius: 5px;
          transition: width 0.4s ease;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }

        .pct-label {
          color: #16a34a;
          font-weight: 500;
        }

        .missing-label {
          color: #ef4444;
        }

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .stat-card {
          padding: 0.75rem 0.5rem;
          border-radius: 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-card.green { background: #f0fdf4; }
        .stat-card.red   { background: #fef2f2; }
        .stat-card.blue  { background: #eff6ff; }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .stat-card.green .stat-value { color: #16a34a; }
        .stat-card.red   .stat-value { color: #dc2626; }
        .stat-card.blue  .stat-value { color: #2563eb; }

        .stat-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .top-missing h3 {
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .country-bar-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
        }

        .country-code {
          font-size: 0.7rem;
          font-weight: 600;
          color: #374151;
          width: 32px;
          flex-shrink: 0;
        }

        .country-bar-bg {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .country-bar-fill {
          height: 100%;
          background: #22c55e;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .country-missing {
          font-size: 0.7rem;
          color: #ef4444;
          width: 28px;
          text-align: right;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
