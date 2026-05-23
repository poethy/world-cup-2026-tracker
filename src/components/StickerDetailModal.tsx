import React, { useEffect } from 'react';
import { COUNTRY_BY_CODE, getStickerType } from '../data/album-structure';
import type { Sticker } from '../data/album-structure';
import { getStickerDisplayCode } from '../data/stickers';
import PLAYER_IMAGES from '../data/player-images.json';
import FlagBlock from './FlagBlock';
import { useI18n } from './LocaleProvider';

interface StickerDetailModalProps {
  sticker: Omit<Sticker, 'id' | 'imageUrl' | 'createdAt'>;
  owned: boolean;
  onClose: () => void;
  onToggle: (number: number, owned: boolean) => void;
}

export default function StickerDetailModal({ sticker, owned, onClose, onToggle }: StickerDetailModalProps) {
  const { tr, getSectionLabel } = useI18n();
  // Close on Escape, lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const country = sticker.countryCode && COUNTRY_BY_CODE[sticker.countryCode]
    ? COUNTRY_BY_CODE[sticker.countryCode]
    : null;

  const stickerType = getStickerType(sticker.name, sticker.countryCode, sticker.number);
  const displayCode = getStickerDisplayCode(sticker.countryCode, sticker.number);
  const photoUrl: string | null = (PLAYER_IMAGES as Record<string, string | null>)[sticker.number] ?? null;

  const typeLabel =
      stickerType === 'cover'   ? tr('modal.coverEdition', 'Cover Edition')
    : stickerType === 'emblem'  ? tr('modal.tournamentEmblem', 'Tournament · Emblem')
    : stickerType === 'mascot'  ? tr('modal.tournamentMascot', 'Tournament · Mascot')
    : stickerType === 'slogan'  ? tr('modal.tournamentSlogan', 'Tournament · Slogan')
    : stickerType === 'ball'    ? tr('modal.tournamentBall', 'Tournament · Match Ball')
    : stickerType === 'trophy'  ? tr('modal.tournamentTrophy', 'Tournament · Trophy')
    : stickerType === 'host'    ? tr('modal.hostNation', 'Host Nation')
    : stickerType === 'squad'   ? `${country?.name || ''} · ${tr('modal.teamPhoto', 'Team Photo')}`
    : stickerType === 'player'  ? `${country?.name || ''} · ${tr('modal.player', 'Player')}`
    : tr('modal.sticker', 'Sticker');

  const photoLabel =
      stickerType === 'player'  ? tr('modal.playerPhoto', 'PLAYER PHOTO')
    : stickerType === 'squad'   ? tr('modal.teamPhotoArt', 'TEAM PHOTO')
    : stickerType === 'host'    ? tr('modal.hostEmblem', 'HOST EMBLEM')
    : stickerType === 'mascot'  ? tr('modal.mascotArt', 'MASCOT ART')
    : stickerType === 'emblem'  ? tr('modal.emblemArt', 'EMBLEM ART')
    : stickerType === 'trophy'  ? tr('modal.trophyArt', 'TROPHY ART')
    : stickerType === 'ball'    ? tr('modal.matchBall', 'MATCH BALL')
    : stickerType === 'slogan'  ? tr('modal.sloganArt', 'SLOGAN ART')
    : tr('modal.coverArt', 'COVER ART');

  const sectionLabel = getSectionLabel(sticker.countryCode) || sticker.country;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Sticker ${sticker.number} details`}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card">
        {/* Header */}
        <header className="modal__head">
          <div className="modal__head-left">
            <span className="mono modal__id">{displayCode}</span>
            <span className="modal__type mono">{typeLabel}</span>
          </div>
          <button className="modal__close" onClick={onClose} aria-label={tr('modal.closeAria', 'Close')}>{tr('modal.close', '×')}</button>
        </header>

        <div className="modal__body">
          {/* Photo (left) */}
          <div className="modal__photo">
            <div className="modal__photo-frame" aria-label={photoUrl ? sticker.name : 'Photo placeholder'}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={sticker.name}
                  className="modal__photo-img"
                  draggable={false}
                />
              ) : (
                <>
                  <span className="modal__photo-label mono">{photoLabel}</span>
                  <span className="modal__photo-hint mono">{tr('modal.dropHint', 'drop {code}.jpg here', { code: displayCode })}</span>
                  {country && (
                    <div className="modal__photo-flag" aria-hidden="true">
                      <FlagBlock country={country} size="md" />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={`modal__status ${owned ? 'is-owned' : ''}`}>
              <span className="mono">{tr('modal.status', 'STATUS')}</span>
              <strong>{owned ? tr('modal.inCollection', 'IN COLLECTION') : tr('modal.missing', 'MISSING')}</strong>
            </div>
          </div>

          {/* Info column */}
          <div className="modal__info">
            <h2 className="modal__name">{sticker.name}</h2>

            {country && (
              <div className="modal__country">
                <FlagBlock country={country} size="lg" />
                <div>
                  <div className="modal__country-name">{country.name}</div>
                  <div className="modal__country-meta mono">
                    {country.code} · {country.region}
                    {country.host ? tr('modal.hostSuffix', ' · HOST') : ''}
                  </div>
                </div>
              </div>
            )}

            <dl className="modal__facts">
              <div className="modal__fact">
                <dt className="mono">{tr('modal.section', 'Section')}</dt>
                <dd>{sectionLabel}</dd>
              </div>
              <div className="modal__fact">
                <dt className="mono">{tr('modal.stickerNumber', 'Sticker N°')}</dt>
                <dd>{displayCode}</dd>
              </div>
              <div className="modal__fact">
                <dt className="mono">{tr('modal.type', 'Type')}</dt>
                <dd style={{ textTransform: 'capitalize' }}>{stickerType}</dd>
              </div>
              {sticker.sectionType === 'special' && (
                <div className="modal__fact">
                  <dt className="mono">{tr('modal.variant', 'Variant')}</dt>
                  <dd>{tr('modal.special', 'Special')}</dd>
                </div>
              )}
              {sticker.pageNumber && (
                <div className="modal__fact">
                  <dt className="mono">{tr('modal.page', 'Page')}</dt>
                  <dd>{sticker.pageNumber}</dd>
                </div>
              )}
            </dl>

            <div className="modal__actions">
              <button
                className={`btn ${owned ? '' : 'btn--primary'}`}
                onClick={() => onToggle(sticker.number, !owned)}
              >
                {owned ? tr('modal.removeFromCollection', 'Remove from collection') : tr('modal.markAsOwned', 'Mark as owned')}
              </button>
            </div>

            <p className="modal__note">
              {tr('modal.note', 'Player photos and emblems will be added when official artwork releases. This placeholder remains until you drop in your own scan.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
