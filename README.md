# PostLabel - Printing your Royal Mail post labels in bulk

PostLabel is a small static web tool that lets you convert Royal Mail, ParcelForce and eBay shipping labels into easily printable A4 pages, suitable for home office printing.

🖨️ See it live and print some labels: [PostLabel](https://postlabel.neveroff.dev/)

The live site does not collect or store PDF contents. Aggregate product analytics and browser error telemetry may be collected via PostHog without filenames, label text, addresses, tracking numbers, or PDF contents.

## Getting Started

If you want to run PostLabel on your own machine:

1. Clone the repository.
2. Install [pnpm](https://pnpm.io/) if needed.
3. Run `pnpm install` from the root directory.
4. Optionally copy `.env.example` to `.env` and set `PUBLIC_POSTHOG_KEY` for analytics (events are proxied via `/plb` on your domain).
5. Run `pnpm dev` to start the development server.

## Environment Variables

Only `PUBLIC_` variables are exposed to the browser. Do not put private PostHog API keys in these values.

- `PUBLIC_POSTHOG_KEY` — optional publishable PostHog browser key.
- `PUBLIC_POSTHOG_UI_HOST` — optional PostHog app host for UI links, defaults to `https://eu.posthog.com`.
- `PUBLIC_APP_ENVIRONMENT`, `PUBLIC_APP_VERSION`, `PUBLIC_DEPLOY_PROVIDER`, `PUBLIC_VERCEL_GIT_COMMIT_SHA` — optional non-sensitive build metadata attached to analytics events.

## Scripts

- `pnpm dev` — start Astro dev server
- `pnpm build` — build static site
- `pnpm preview` — preview production build locally
- `pnpm typecheck` — run Astro type checking
- `pnpm lint` — run Oxlint and `tsc --noEmit`

## Contributing

Contributions are encouraged and welcome. The project roadmap, ideas, bugs and issues are tracked in the [Project](https://github.com/users/MNeverOff/projects/1).

## Structure & Quality Note

This project was initially built in 2023 to solve bulk label printing. It has been migrated from Next.js to a static Astro site with a React island for the PDF print workflow.
