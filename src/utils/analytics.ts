declare global {
  interface Window {
    posthog?: {
      capture: (event: ProductEventName, properties?: Record<string, unknown>) => void;
      captureException?: (error: Error, properties?: Record<string, unknown>) => void;
    };
  }
}

export const analyticsSchemaVersion = 1;

export type ProductEventName =
  | 'label_processing_completed'
  | 'label_processing_failed'
  | 'label_pdf_downloaded'
  | 'label_pdf_download_failed'
  | 'label_pdf_printed'
  | 'label_pdf_print_failed'
  | 'label_file_rejected';

export type ProductOperation = 'process_labels' | 'download_pdf' | 'print_pdf' | 'validate_files';

export type ProductOutcome = 'success' | 'failure' | 'rejected';

export type RejectReason =
  | 'non_pdf_file'
  | 'file_too_large'
  | 'too_many_files'
  | 'payload_too_large'
  | 'no_valid_files';

export type FailureStage =
  | 'read_file'
  | 'parse_pdf'
  | 'classify_label'
  | 'render_label'
  | 'compose_pdf'
  | 'download_pdf'
  | 'print_pdf';

export type LabelSourceKey =
  | 'royal_mail_domestic'
  | 'royal_mail_international'
  | 'ebay'
  | 'parcel_force'
  | 'unknown';

export type LabelSourceCounts = Record<LabelSourceKey, number>;

export type SizeBucket =
  | '0_bytes'
  | 'under_100kb'
  | '100kb_to_500kb'
  | '500kb_to_1mb'
  | '1mb_to_5mb'
  | 'over_5mb';

export type OperationContext = {
  event_id: string;
  trace_id: string;
  startedAt: number;
};

export type ProductEventProperties = {
  operation: ProductOperation;
  outcome: ProductOutcome;
  files_count: number;
  accepted_files_count: number;
  rejected_files_count: number;
  input_pages_count: number;
  output_pages_count: number;
  labels_count: number;
  label_source_counts: LabelSourceCounts;
  label_sources_detected: LabelSourceKey[];
  label_source_count_total: number;
  payload_size_bucket: SizeBucket;
  payload_size_mb_rounded: number;
  output_size_bucket?: SizeBucket;
  output_size_mb_rounded?: number;
  duration_ms: number;
  event_id: string;
  trace_id: string;
  page_path?: string;
  reject_reason?: RejectReason;
  error_type?: string;
  error_code?: string;
  failure_stage?: FailureStage;
};

export type ProductExceptionProperties = Pick<
  ProductEventProperties,
  | 'operation'
  | 'outcome'
  | 'event_id'
  | 'trace_id'
  | 'duration_ms'
  | 'failure_stage'
  | 'error_type'
  | 'error_code'
>;

const labelSourceKeys: LabelSourceKey[] = [
  'royal_mail_domestic',
  'royal_mail_international',
  'ebay',
  'parcel_force',
  'unknown',
];

let pageContextId: string | undefined;

function getPageContextId(): string {
  pageContextId ??= createShortId();
  return pageContextId;
}

function createShortId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replaceAll('-', '').slice(0, 16);
  }

  return Math.random().toString(36).slice(2, 18).padEnd(16, '0');
}

function sanitizeCode(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  return String(value).replaceAll(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || undefined;
}

function removeUndefinedProperties(properties: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );
}

function getSharedAnalyticsProperties(properties: { page_path?: string }) {
  const commitSha = import.meta.env.PUBLIC_VERCEL_GIT_COMMIT_SHA;

  return removeUndefinedProperties({
    analytics_schema_version: analyticsSchemaVersion,
    page_context_id: getPageContextId(),
    page_path:
      properties.page_path ??
      (typeof window === 'undefined' ? undefined : window.location.pathname),
    source: 'browser',
    app_environment: import.meta.env.PUBLIC_APP_ENVIRONMENT ?? import.meta.env.MODE,
    app_version: import.meta.env.PUBLIC_APP_VERSION,
    commit_sha_short: commitSha?.slice(0, 12),
    deploy_provider: import.meta.env.PUBLIC_DEPLOY_PROVIDER ?? (commitSha ? 'vercel' : undefined),
  });
}

export function createOperationContext(): OperationContext {
  return {
    event_id: createShortId(),
    trace_id: createShortId(),
    startedAt: performance.now(),
  };
}

export function getOperationDurationMs(context: OperationContext): number {
  return Math.round(performance.now() - context.startedAt);
}

export function getEmptyLabelSourceCounts(): LabelSourceCounts {
  return {
    royal_mail_domestic: 0,
    royal_mail_international: 0,
    ebay: 0,
    parcel_force: 0,
    unknown: 0,
  };
}

export function normalizeLabelSource(labelType: string | undefined): LabelSourceKey {
  switch (labelType) {
    case 'RM':
    case 'RM Mobile':
      return 'royal_mail_domestic';
    case 'RM International':
    case 'RM International Mobile':
      return 'royal_mail_international';
    case 'Ebay':
      return 'ebay';
    case 'ParcelForce':
      return 'parcel_force';
    default:
      return 'unknown';
  }
}

export function buildLabelSourceCounts(labelTypes: readonly (string | undefined)[]): LabelSourceCounts {
  const counts = getEmptyLabelSourceCounts();

  for (const labelType of labelTypes) {
    counts[normalizeLabelSource(labelType)] += 1;
  }

  return counts;
}

export function getDetectedLabelSources(counts: LabelSourceCounts): LabelSourceKey[] {
  return labelSourceKeys.filter((source) => counts[source] > 0);
}

export function getLabelSourceCountTotal(counts: LabelSourceCounts): number {
  return labelSourceKeys.reduce((total, source) => total + counts[source], 0);
}

export function getSizeBucket(sizeBytes: number): SizeBucket {
  if (sizeBytes <= 0) {
    return '0_bytes';
  }

  if (sizeBytes < 100_000) {
    return 'under_100kb';
  }

  if (sizeBytes < 500_000) {
    return '100kb_to_500kb';
  }

  if (sizeBytes < 1_000_000) {
    return '500kb_to_1mb';
  }

  if (sizeBytes <= 5_000_000) {
    return '1mb_to_5mb';
  }

  return 'over_5mb';
}

export function getSizeMbRounded(sizeBytes: number): number {
  return Math.round((sizeBytes / 1_000_000) * 2) / 2;
}

export function getErrorType(error: unknown): string {
  if (error instanceof Error && error.name) {
    return sanitizeCode(error.name) ?? 'Error';
  }

  return typeof error;
}

export function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  return sanitizeCode((error as { code?: unknown }).code);
}

export function captureProductEvent(
  event: ProductEventName,
  properties: ProductEventProperties
): void {
  if (typeof window === 'undefined' || !window.posthog) {
    return;
  }

  window.posthog.capture(event, {
    ...getSharedAnalyticsProperties(properties),
    ...properties,
  });
}

export function captureProductException(
  error: unknown,
  properties: ProductExceptionProperties
): void {
  if (typeof window === 'undefined' || !window.posthog?.captureException) {
    return;
  }

  const safeError = new Error('PDF workflow failed');
  safeError.name = 'PostLabelHandledWorkflowError';

  window.posthog.captureException(
    safeError,
    removeUndefinedProperties({
      ...getSharedAnalyticsProperties({}),
      ...properties,
      analytics_schema_version: analyticsSchemaVersion,
      source: 'browser',
    })
  );
}
