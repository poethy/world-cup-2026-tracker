import React from 'react';

interface StickerCardProps {
  number: number;
  name: string;
  country: string;
  countryCode: string;
  sectionType: string;
  owned: boolean;
  onToggle: (number: number, owned: boolean) => void;
}

export default function StickerCard({
  number,
  name,
  country,
  countryCode,
  sectionType,
  owned,
  onToggle,
}: StickerCardProps) {
  const isSpecial = sectionType === 'special';

  return (
    <button
      onClick={() => onToggle(number, !owned)}
      className={`sticker-card ${owned ? 'owned' : 'missing'} ${isSpecial ? 'special' : ''}`}
      title={owned ? 'Click to unmark' : 'Click to mark as owned'}
      aria-label={`Sticker #${number}: ${name} (${country}) - ${owned ? 'owned' : 'missing'}`}
    >
      <div className="sticker-image">
        <span className="sticker-number">#{number}</span>
        {isSpecial && <span className="special-badge">✦</span>}
        {owned && <span className="owned-check">✓</span>}
      </div>
      <div className="sticker-info">
        <span className="sticker-name">{name}</span>
        <span className="sticker-country">{countryCode}</span>
      </div>

      <style>{`
        .sticker-card {
          display: flex;
          flex-direction: column;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          background: white;
          transition: all 0.15s ease;
          text-align: left;
          padding: 0;
          width: 100%;
        }

        .sticker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .sticker-card.owned {
          border-color: #22c55e;
          background: #f0fdf4;
        }

        .sticker-card.missing {
          border-color: #e5e7eb;
          opacity: 0.75;
        }

        .sticker-card.missing:hover {
          opacity: 1;
        }

        .sticker-card.special {
          border-style: dashed;
        }

        .sticker-card.special.owned {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .sticker-image {
          position: relative;
          background: #f3f4f6;
          aspect-ratio: 3/4;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 600;
        }

        .sticker-number {
          font-size: 1rem;
          font-weight: 700;
          color: #6b7280;
        }

        .sticker-card.owned .sticker-number {
          color: #16a34a;
        }

        .special-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 0.65rem;
          color: #f59e0b;
        }

        .owned-check {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 700;
        }

        .sticker-info {
          padding: 4px 6px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .sticker-name {
          font-size: 0.65rem;
          color: #374151;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .sticker-country {
          font-size: 0.6rem;
          color: #9ca3af;
          font-weight: 400;
        }
      `}</style>
    </button>
  );
}
