# World Cup 2026 Tracker

Track your FIFA World Cup 2026 Panini sticker album collection. Built with Astro, TypeScript, Supabase, and deployable to Vercel.

## Features

- Mark stickers as owned/missing with a single click
- Real-time progress statistics by country
- Search and filter by player name, country, or status
- Complete open-source sticker catalog (980 stickers, 48 teams)
- Public REST API for the sticker catalog

## Open-Source API

The complete Panini FIFA World Cup 2026 album data is available as a public REST API:

### `GET /api/stickers`

Returns the sticker catalog with optional filters.

| Parameter | Type | Description |
|-----------|------|-------------|
| `country_code` | string | Filter by team code (e.g. `ARG`, `BRA`, `ESP`) |
| `country` | string | Filter by country name (partial match) |
| `page` | number | Filter by album page number |
| `section` | string | `regular` or `special` |
| `limit` | number | Results per page (max 500, default 100) |
| `offset` | number | Pagination offset |

**Example:**
```
GET /api/stickers?country_code=ARG
GET /api/stickers?section=special
GET /api/stickers?limit=20&offset=0
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "number": 17,
      "name": "Lionel Messi",
      "country": "Argentina",
      "country_code": "ARG",
      "page_number": 6,
      "position_in_page": 8,
      "section_type": "regular",
      "image_url": null
    }
  ],
  "count": 20,
  "limit": 100,
  "offset": 0
}
```

### `GET /api/stats`

Returns aggregate statistics for the sticker catalog.

```json
{
  "totalStickers": 980,
  "byCountry": {
    "ARG": { "country": "Argentina", "count": 20 }
  },
  "distribution": {
    "regular": 960,
    "special": 20
  }
}
```

## Album Structure

- **Total:** 980 stickers, 112 pages
- **48 national teams** × 20 stickers each:
  - 1 country emblem
  - 18 player stickers  
  - 1 team photo
- **Special content:** FIFA World Cup history, host country emblems, official emblems

## Setup

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/poethy/world-cup-2026-tracker
cd world-cup-2026-tracker
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run `supabase/schema.sql`
3. Then run `supabase/seed.sql` to populate all 980 stickers

### 3. Environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from your Supabase project dashboard under **Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set the same environment variables in your Vercel project settings.

## Tech Stack

- **Frontend:** [Astro](https://astro.build) + React + TypeScript
- **Database & Auth:** [Supabase](https://supabase.com)
- **Deployment:** [Vercel](https://vercel.com)
- **Data:** Extracted from official Panini FIFA World Cup 2026 album checklist

## Contributing

The sticker catalog data in `src/data/stickers.ts` and `supabase/seed.sql` is open-source. PRs to fix player names, add image URLs, or extend the dataset are welcome.

## License

MIT
