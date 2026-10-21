# kiln-website

The marketing and download site for [Kiln](https://github.com/muhammadhassan2/Kiln), the live shader editor for mobile video effects.

Next.js (App Router) on Node.js, deployed to Vercel, with anonymous first-party analytics stored in Supabase and a password-protected admin dashboard.

## Pages

| Route | What it is |
|---|---|
| `/` | The story: a live WebGL run of Kiln's own `examples/molten.frag` with working sliders, then the four stages (Load, Shape, Fire, Ship) |
| `/download` | OS-detected download button, all platforms, first-run steps, build from source, FAQ |
| `/features` | Every feature, grouped by stage |
| `/guide` | Quick start, uniform controls, built-ins, export, shortcuts |
| `/changelog` | Release notes |
| `/admin` | Analytics dashboard (username + password) |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

Without Supabase variables the site works normally and simply doesn't record anything.

## Analytics

- `POST /api/track` records page views, time on page and clicks on any element with `data-track="name"` (plus outbound links).
- `GET /api/download/:platform` records the download, then redirects to the file (`windows`, `mac`, `mac-intel`, `source`).
- No cookies and no stored IPs: a visitor is a salted SHA-256 of IP + user agent + date, so it changes every day. Country and city come from Vercel's geo headers.
- Ad links can carry `?utm_source=…&utm_campaign=…` (or `?ref=…`); they show up under Campaigns.

The table is in [`supabase/schema.sql`](supabase/schema.sql). Row level security is on with no policies, so only the server (service role key) can read or write it.

## Environment

See [`.env.example`](.env.example). Download buttons point at `DOWNLOAD_URL_*` when set, and at the GitHub releases page otherwise.

## Design notes

Colours follow a kiln's firing temperatures (soot, brick, cherry, ember, flame, white heat), section markers are temperatures, the scroll gauge heats from 20 °C to 1300 °C, and the sparks come from the app icon. Fonts are Big Shoulders, IBM Plex Sans and IBM Plex Mono. All motion respects `prefers-reduced-motion`.
