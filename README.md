# PostLabel - Printing your Royal Mail post labels in bulk

PostLabel is a small static web tool that lets you convert Royal Mail, ParcelForce and eBay shipping labels into easily printable A4 pages, suitable for home office printing.

🖨️ See it live and print some labels: [PostLabel](https://postlabel.neveroff.dev/)

The live site does not collect or store PDF contents. Aggregate product analytics (counts and sizes only) may be collected via PostHog.

## Getting Started

If you want to run PostLabel on your own machine:

1. Clone the repository.
2. Install [pnpm](https://pnpm.io/) if needed.
3. Run `pnpm install` from the root directory.
4. Optionally copy `.env.example` to `.env` and set `PUBLIC_POSTHOG_KEY` for analytics (events are proxied via `/ingest` on your domain).
5. Run `pnpm dev` to start the development server.

## Scripts

- `pnpm dev` — start Astro dev server
- `pnpm build` — typecheck and build static site
- `pnpm preview` — preview production build locally
- `pnpm typecheck` — run Astro type checking
- `pnpm lint` — run Oxlint on source files

## Contributing

Contributions are encouraged and welcome. The project roadmap, ideas, bugs and issues are tracked in the [Project](https://github.com/users/MNeverOff/projects/1).

## Structure & Quality Note

This project was initially built in 2023 to solve bulk label printing. It has been migrated from Next.js to a static Astro site with a React island for the PDF print workflow.
