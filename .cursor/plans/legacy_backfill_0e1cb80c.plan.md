---
name: legacy backfill
overview: Backfill legacy PostLabel usage rows from `sandbox/prod_events.csv` into PostHog by transforming each row into the new canonical analytics schema. The implementation should live under `sandbox/`, run as a deliberate one-off, and include dry-run validation before any API writes.
todos:
  - id: validate-csv
    content: Implement strict CSV validation using the intended 12-column schema and dry-run summaries.
    status: pending
  - id: transform-events
    content: Transform legacy rows into canonical schema events with source counts, unknown reconciliation, bucketed sizes, and deterministic metadata.
    status: pending
  - id: dry-run-output
    content: Add dry-run sample output and aggregate checks before any API calls.
    status: pending
  - id: posthog-send
    content: Add explicit `--send` ingestion path with batching, retries, and historical timestamps.
    status: pending
  - id: verify-backfill
    content: Verify event counts, sample properties, and PostHog ingestion results after sending.
    status: pending
isProject: false
---

# Legacy Analytics Backfill Plan

## Inputs and Validation
- Source file: [`sandbox/prod_events.csv`](/Users/mneveroff/Code/postlabel/sandbox/prod_events.csv), derived from [`sandbox/postlabel_nextjs_prod_dump.sql`](/Users/mneveroff/Code/postlabel/sandbox/postlabel_nextjs_prod_dump.sql).
- Current validation findings:
  - 529 data rows.
  - Header has a CSV typo: missing comma between `RMINum` and `EbayRMNum`. Rows are still parseable with the intended 12-column schema.
  - Event type counts: `2` Process = 279, `3` Download = 123, `4` Print = 127.
  - Date range: `2024-01-25 19:11:03.73` to `2026-06-05 11:34:13.177`.
  - No negative numeric values found.
  - 83 rows have `labelsNum` greater than known source counts; treat the difference as `unknown` labels.

## Implementation Shape
Create a one-off script under [`sandbox/`](/Users/mneveroff/Code/postlabel/sandbox/) that:
- Reads `prod_events.csv` with an explicit column list, ignoring the malformed header.
- Validates row widths, UUIDs, timestamps, integer columns, and allowed event types before any network calls.
- Emits a dry-run summary and sample transformed events by default.
- Requires an explicit flag such as `--send` before calling PostHog.
- Supports idempotency using `legacy_event_id` and a deterministic `uuid`/`event_id` derived from the legacy row ID.

## Transform Rules
Map legacy event types to new event names:
- `2` -> `label_processing_completed`, `operation: "process_labels"`, `outcome: "success"`.
- `3` -> `label_pdf_downloaded`, `operation: "download_pdf"`, `outcome: "success"`.
- `4` -> `label_pdf_printed`, `operation: "print_pdf"`, `outcome: "success"`.

Map legacy fields to the new schema:
- `filesNum` -> `files_count` and `accepted_files_count`.
- `pagesNum` -> `input_pages_count` for processing events; for download/print, use as `output_pages_count` if that better matches current live schema once implemented.
- `labelsNum` -> `labels_count`.
- `payloadSize` -> bucketed `payload_size_bucket` and optional rounded `payload_size_mb_rounded`; do not send exact bytes.
- `pageHash` -> `legacy_page_hash` only if needed for audit/debug, or better omit from PostHog properties and use it only locally to derive a non-stable `page_context_id`.
- `createdAt` -> PostHog event `timestamp`.
- `id` -> `legacy_event_id` plus deterministic `event_id`/`trace_id`.

Build flexible source counts:
- `RMNum` -> `label_source_counts.royal_mail_domestic`.
- `RMINum` -> `label_source_counts.royal_mail_international`.
- `EbayRMNum` -> `label_source_counts.ebay`.
- `PFNum` -> `label_source_counts.parcel_force`.
- `unknown` -> `max(labelsNum - known_source_total, 0)`.
- `label_sources_detected` -> sorted non-zero source keys.
- `label_source_count_total` -> sum of all source counts, expected to equal `labels_count` after adding `unknown`.

Add backfill metadata:
- `analytics_schema_version: 1`.
- `source: "legacy_postgres_backfill"`.
- `backfill_batch_id` supplied by CLI arg or generated once per run.
- `app_environment: "production"`.
- No filenames, PDF text, addresses, tracking numbers, user identifiers, stable session IDs, or raw exact payload bytes.

## PostHog Ingestion
- Use PostHog capture API with historical timestamps and the existing EU host/project key.
- Prefer a dry-run-first workflow that prints transformed JSONL samples and aggregate counts.
- Send in small batches with retry/backoff and clear logging of successes/failures.
- Keep a local report file in `sandbox/` only if explicitly requested during implementation; otherwise print the summary.

## Verification
- Validate the transformed event count equals 529 before sending.
- Validate transformed event counts by name match the legacy type counts.
- Validate every event has `analytics_schema_version`, `operation`, `outcome`, `label_source_counts`, `label_sources_detected`, `label_source_count_total`, bucketed payload size, and historical timestamp.
- Validate `label_source_count_total === labels_count` after applying `unknown`.
- After sending, query PostHog or inspect the activity feed for a small sample by `legacy_event_id` and verify historical dates and properties look correct.

## Guardrails
- Never mutate the source CSV during ingestion; if a cleaned CSV is useful, generate it as a separate explicit artifact.
- Never use the malformed CSV header as the source of truth.
- Never send raw `payloadSize` as exact bytes.
- Never call `identify`, create person profiles intentionally, or backfill stable user/session identity.