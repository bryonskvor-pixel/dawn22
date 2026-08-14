# dawn-22

A private, single-page anniversary gift. 22 mile markers from Atlanta to Albuquerque. August 14, 2026.

## Stack

Plain static HTML/CSS/JS — no framework, no build step, no backend, no API keys.

- `index.html` — the whole page: gate, opening, 22 markers, map, audio
- `styles.css` — desert-dawn design system
- `main.js` — gate logic, scroll-linked sky, marker entrances, map draw, audio player
- `photos/`, `art/` — compressed images (originals in `originals/`)
- `audio/` — **drop `anniversary.m4a` here** and redeploy; the play button enables itself automatically

## Deploy (Vercel)

New Vercel project → link this repo → framework preset **Other**, no build command, output directory left blank (root). That's it.

## Notes

- The gate answer is anything starting with "dill" (case-insensitive). Success is kept in `sessionStorage`, so a refresh doesn't re-lock.
- `noindex, nofollow` is set; keep the repo private.
- Test on a phone at 390px first.
