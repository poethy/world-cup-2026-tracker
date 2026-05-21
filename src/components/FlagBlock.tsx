import React from 'react';
import type { Country } from '../data/album-structure';

interface FlagBlockProps {
  country: Country;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

const DIMS = {
  hero: { w: 72, h: 50 },
  lg:   { w: 44, h: 30 },
  md:   { w: 36, h: 24 },
  sm:   { w: 28, h: 20 },
};

export default function FlagBlock({ country, size = 'sm' }: FlagBlockProps) {
  const { w, h } = DIMS[size];
  return (
    <div
      className={`flag flag--${country.dir}`}
      style={{ width: w, height: h, flexShrink: 0 }}
      aria-label={country.name}
      title={country.name}
    >
      <span style={{ background: country.stripes[0] }} />
      <span style={{ background: country.stripes[1] }} />
      <span style={{ background: country.stripes[2] }} />
    </div>
  );
}
