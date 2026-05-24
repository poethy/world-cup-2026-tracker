import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export type AlbumVersion = 'v1' | 'v2' | 'v3' | 'v4';

interface AlbumVersionPickerProps {
  onSelect: (version: AlbumVersion) => void;
}

const VERSIONS: {
  id: AlbumVersion;
  label: string;
  count: string;
  regions: string;
}[] = [
  {
    id: 'v1',
    label: 'Canada & United States',
    count: '12 Coca-Cola stickers',
    regions: 'Album sold in Canada and the United States',
  },
  {
    id: 'v2',
    label: 'Latin America',
    count: '14 Coca-Cola stickers',
    regions: 'Colombia, Argentina, Mexico, Ecuador and the rest of Latin America',
  },
  {
    id: 'v3',
    label: 'Europe',
    count: '12 Coca-Cola stickers',
    regions: 'France, Germany, Serbia, Spain, UK — includes Silver & Gold hardcover editions',
  },
  {
    id: 'v4',
    label: 'Rest of the World',
    count: '14 Coca-Cola stickers',
    regions: 'All other countries not listed above',
  },
];

export default function AlbumVersionPicker({ onSelect }: AlbumVersionPickerProps) {
  const [selected, setSelected] = useState<AlbumVersion | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: session.user.id, album_version: selected }, { onConflict: 'user_id' });
      if (error) throw error;
      onSelect(selected);
    } catch (e: any) {
      console.error('[AlbumVersionPicker] save error:', e?.message ?? e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="version-picker">
      <div className="version-picker__card">
        <p className="version-picker__eyebrow">One-time setup</p>
        <h2 className="version-picker__title">
          Which Coca-Cola stickers<br />does your album include?
        </h2>
        <p className="version-picker__sub">
          Check the back cover of your album. This selection is permanent and cannot be changed later.
        </p>

        <div className="version-picker__options">
          {VERSIONS.map(v => (
            <button
              key={v.id}
              className={`version-option${selected === v.id ? ' is-selected' : ''}`}
              onClick={() => setSelected(v.id)}
            >
              <div className="version-option__top">
                <span className="version-option__label">{v.label}</span>
                <span className={`version-option__check${selected === v.id ? ' is-visible' : ''}`}>
                  ✓
                </span>
              </div>
              <span className="version-option__count">{v.count}</span>
              <span className="version-option__regions">{v.regions}</span>
            </button>
          ))}
        </div>

        <button
          className="btn btn--primary btn--lg"
          disabled={!selected || saving}
          onClick={handleConfirm}
          style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
        >
          {saving ? 'Saving…' : 'Confirm and open album'}
        </button>
      </div>
    </div>
  );
}
