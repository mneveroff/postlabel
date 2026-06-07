---
name: analytics parity
overview: Update the current Astro/PostHog browser analytics implementation so future events use the new canonical analytics schema, add wide-event-style success and failure properties, and enable PostHog browser error tracking. The backfill remains out of scope and will get a separate one-off Python plan under sandbox/ that transforms legacy rows into this new schema.
todos:
  - id: schema-contract
    content: Define the typed product event and wide-event property contract in `src/utils/analytics.ts`.
    status: pending
  - id: posthog-errors
    content: Update PostHog browser initialization to support exception autocapture and manual exception capture.
    status: pending
  - id: pdf-flow-events
    content: Refactor PDF processing/download/print flows to emit parity success and failure events with duration/outcome/correlation fields.
    status: pending
  - id: build-context
    content: Add safe public environment/build metadata to analytics context and env typings.
    status: pending
  - id: verify
    content: Run typecheck/lint/build and verify representative PostHog product/error events.
    status: pending
isProject: false
---

# Analytics Parity and Error Tracking Plan

## Scope
- In scope: current/future browser product events, handled workflow failures, PostHog browser error tracking, event schema consistency, verification.
- Out of scope: historical backfill from `postlabel_nextjs_prod_dump.sql`; that gets its own `sandbox/` Python plan later.
- Privacy stance: preserve the site’s public promise that PDF contents, filenames, addresses, tracking numbers, user accounts, stable sessions, and user identification are not collected.

## Current Shape
- PostHog is loaded via [`src/components/analytics/PostHog.astro`](/Users/mneveroff/Code/postlabel/src/components/analytics/PostHog.astro) with `/ingest` proxying and explicit product events only.
- The main workflow lives in [`src/utils/pdf-util.ts`](/Users/mneveroff/Code/postlabel/src/utils/pdf-util.ts), where processing/download/print success events already include most legacy fields.
- [`src/utils/analytics.ts`](/Users/mneveroff/Code/postlabel/src/utils/analytics.ts) is the right place to centralize the event contract, exception capture wrapper, and shared wide-event metadata.

## Event Contract
Standardize product events around future-facing names and fields. Backfill will be reshaped to this schema later by a one-off Python script, so do not mirror legacy database columns or add compatibility aliases to live events.
- `label_processing_completed`
- `label_processing_failed`
- `label_pdf_downloaded`
- `label_pdf_download_failed`
- `label_pdf_printed`
- `label_pdf_print_failed`
- Optional validation rejects as separate outcome events, e.g. `label_file_rejected`, only if we want visibility into non-PDF/too-large/too-many-file cases.

Every workflow event should carry:
- Aggregate count fields: `files_count`, `accepted_files_count`, `rejected_files_count`, `input_pages_count`, `output_pages_count`, and `labels_count`.
- Flexible label-source fields:
  - `label_source_counts`: object keyed by normalized source, e.g. `{ royal_mail_domestic: 2, royal_mail_international: 1, ebay: 0, parcel_force: 0, unknown: 0 }`.
  - `label_sources_detected`: sorted array of source keys with count > 0, useful for simple filtering/breakdowns.
  - `label_source_count_total`: sum of `label_source_counts`, expected to match `labels_count`.
  - Do not emit provider-specific top-level fields like `rm_count`, `rm_international_count`, `ebay_count`, or `parcel_force_count`.
- Privacy-adjusted size fields: replace exact `payload_size_bytes` with bucketed payload size properties such as `payload_size_bucket` and, if useful, `payload_size_mb_rounded`. Keep exact output PDF size out of events unless it is also bucketed.
- Wide-event fields: `outcome`, `duration_ms`, `operation`, `page_path`, `source: "browser"`, safe app/version metadata when available, a per-page-load anonymous `page_context_id`, and a per-operation `event_id`/`trace_id`.
- Failure fields when applicable: `error_type`, sanitized `error_code`/`failure_stage`, and the same aggregate counts known at the failure point. Avoid sending raw PDF-derived messages, filenames, label text, stack-local variables, or arbitrary error payloads as product event properties.

Similar schema improvements:
- Add `analytics_schema_version`, starting at `1`, so future event changes and backfills can coexist cleanly.
- Split workflow operation from result: `operation` should be stable (`process_labels`, `download_pdf`, `print_pdf`, `validate_files`) and `outcome` should be one of `success`, `failure`, or `rejected`.
- Use machine-readable reason fields for rejects/failures, e.g. `reject_reason: "non_pdf_file" | "file_too_large" | "too_many_files" | "payload_too_large" | "no_valid_files"` and `failure_stage: "read_file" | "parse_pdf" | "classify_label" | "render_label" | "compose_pdf" | "download_pdf" | "print_pdf"`.
- Add `page_context_id` and `event_id` only as short-lived random IDs, never as user/session identities.
- Use low-cardinality environment fields like `app_environment`, `app_version`, `commit_sha_short`, and `deploy_provider` when available; avoid full URLs, referrers, IP-derived fields, or browser fingerprint material.

## Privacy Decisions
- Use a balanced correlation model: create one random `page_context_id` per page load and one random `event_id`/`trace_id` per workflow operation. This links processing -> download/print/errors within the same loaded page, but resets on reload and does not identify users across visits.
- Do not introduce accounts, `identify`, group analytics, stable browser fingerprints, localStorage persistence, cookies, or long-lived session IDs.
- Keep PostHog `autocapture: false`, session replay disabled, and memory-only persistence.
- Keep exact aggregate non-content counts because they are core product metrics and already disclosed in the legal copy.
- Bucket payload sizes to reduce fingerprintability of unusual PDF batches while preserving trend usefulness.
- Prefer normalized, low-cardinality keys for label sources instead of raw `LabelType` display strings. For example, map `RM` and `RM Mobile` to `royal_mail_domestic`, `RM International` and `RM International Mobile` to `royal_mail_international`, preserve `ebay`, `parcel_force`, and include `unknown`.
- Treat PostHog error tracking as browser exception telemetry, not logging of PDF contents. Manual exception properties should be curated and sanitized; product failure events should carry the structured business context.

## Implementation Steps
1. Centralize analytics helpers in [`src/utils/analytics.ts`](/Users/mneveroff/Code/postlabel/src/utils/analytics.ts):
   - Expand the `Window.posthog` type to include `captureException`, `startExceptionAutocapture`, and `register` if used.
   - Add typed event/property unions so event names and outcome values stay type-safe.
   - Add helpers for generating the per-page-load anonymous context ID, per-operation IDs, payload-size buckets, label-source counts, schema version, and shared non-sensitive context.
   - Add `captureProductException(error, properties)` that calls `posthog.captureException(error, properties)` with curated fields only.

2. Update PostHog initialization in [`src/components/analytics/PostHog.astro`](/Users/mneveroff/Code/postlabel/src/components/analytics/PostHog.astro):
   - Use the newer snippet method list that includes `startExceptionAutocapture`.
   - Keep `autocapture: false`, `capture_pageview: true`, `disable_session_recording: true`, and memory persistence.
   - Do not call `identify`, enable person profiles, or register stable user/session identifiers.
   - Set `person_profiles: "identified_only"` explicitly to keep anonymous events from creating person profiles.
   - Add current PostHog JS defaults if compatible with this setup, e.g. `defaults: "2026-01-30"`.
   - Enable documented browser exception capture with `capture_exceptions: { capture_unhandled_errors: true, capture_unhandled_rejections: true, capture_console_errors: false }` so unhandled errors and unhandled promise rejections become `$exception` events without capturing `console.error`.
   - Use `captureException(error, properties)` for handled errors. Do not manually capture `$exception` events.
   - Add a narrow `before_send` only if needed to drop known noisy exception types or to enforce a final exception-event allowlist. Avoid broad property deletion because SDK-reserved fields such as the project token must remain intact.

3. Refactor [`src/utils/pdf-util.ts`](/Users/mneveroff/Code/postlabel/src/utils/pdf-util.ts) around operation-level wide events:
   - Wrap processing, PDF generation for download, and PDF generation for print in `try/catch/finally`-style helpers.
   - Capture success and failure with the same event contract, including duration and known counts.
   - Replace fixed provider counts with `label_source_counts` and `label_sources_detected`.
   - Track accepted/rejected file counts and reject reasons for validation exits that currently only show an alert.
   - Use bucketed payload/output sizes instead of exact byte counts in new live events.
   - Preserve current user-facing behavior, alerts, and privacy boundaries.
   - For caught errors, send both the product failure event and `captureProductException` with the same `event_id`/`trace_id`.

4. Add environment/build context:
   - Extend [`src/env.d.ts`](/Users/mneveroff/Code/postlabel/src/env.d.ts) for public build metadata such as `PUBLIC_APP_VERSION` or `PUBLIC_VERCEL_GIT_COMMIT_SHA` if exposed by deployment.
   - Include only non-sensitive metadata in event properties.

5. Source maps and deploy readiness:
   - PostHog recommends source maps for readable browser error stack traces.
   - Prefer a follow-up source-map pass using the Vite-compatible PostHog Rollup plugin in Astro’s Vite config, or the PostHog CLI/GitHub Action after `pnpm build`.
   - If uploading via the Vite/Rollup plugin, use build-only env vars such as `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, and `POSTHOG_HOST=https://eu.i.posthog.com`; do not expose the personal API key to client code.
   - If uploading via CLI/GitHub Actions, use EU app host settings where required (`https://eu.posthog.com`) and keep the token in CI secrets.
   - Ensure source maps improve stack traces without exposing PDF contents or runtime variables. Do not enable any option that captures local variables containing parsed PDF text.

6. Update legal copy if needed:
   - [`src/components/legal/PrivacyPage.tsx`](/Users/mneveroff/Code/postlabel/src/components/legal/PrivacyPage.tsx), [`src/components/legal/TldrPage.tsx`](/Users/mneveroff/Code/postlabel/src/components/legal/TldrPage.tsx), and [`src/components/legal/DataPage.tsx`](/Users/mneveroff/Code/postlabel/src/components/legal/DataPage.tsx) already disclose aggregate counts, sizes, timing, page context, no identification, no autocapture, and no replay.
   - If browser exception capture is enabled, update the wording to disclose error telemetry in plain language: stack traces/error metadata may be sent to PostHog for debugging, without PDF contents, filenames, label text, addresses, or tracking numbers.

7. Verification:
   - Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
   - In a local preview, verify one processing success, one download, one print, one handled processing failure, and one thrown test exception appear in PostHog with matching page-load and operation correlation properties.
   - Inspect the captured event payloads before considering the work done, confirming no filenames, PDF text, addresses, tracking numbers, raw exact payload bytes, stable IDs, or user-identifying properties are present.

## OTel Note
Because this app currently builds as static Astro output, there is no server request lifecycle to instrument with OTel middleware. Current PostHog docs point OTel support primarily at server/AI observability exporters and APM-style ingestion, not a browser-only static workflow. The immediate plan should use PostHog browser product events plus `$exception` events, carrying short-lived OTel-style correlation fields (`trace_id`, `span_id`/`event_id`) so future server-side or collector-based tracing can join cleanly without renaming events or introducing stable user/session tracking.

## PostHog Docs Validation
- Browser error tracking: validated against PostHog’s web error tracking and exception capture docs. Browser SDKs support automatic exception capture through `capture_exceptions`, including `window.onerror` and `window.onunhandledrejection`, and handled errors should use `captureException(error, additionalProperties)`.
- Privacy configuration: validated against PostHog JavaScript SDK docs for anonymous events, person profiles, persistence, and session replay. `persistence: "memory"`, no `identify`, no group calls, `person_profiles: "identified_only"`, `autocapture: false`, and `disable_session_recording: true` match the privacy posture.
- Source maps: validated against PostHog source map docs. Astro’s Vite/Rollup build can use the PostHog Rollup plugin, or a post-build CLI/GitHub Action upload. This requires private build/CI env vars and should not leak a personal API key to the browser.
- Filtering/sampling: validated against PostHog’s `before_send` examples for exception suppression. Use it narrowly for `$exception` noise control, not as a generic sanitizer over all event properties.
- OTel: validated as a future-facing note, not part of the immediate browser implementation. PostHog docs show OTel exporters mainly for server/AI observability contexts; this static Astro app should not add OTel runtime dependencies just for client product events.