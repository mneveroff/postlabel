declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export type LabelProcessingProperties = {
  files_count: number;
  pages_count: number;
  labels_count: number;
  payload_size_bytes: number;
  rm_count: number;
  rm_international_count: number;
  ebay_count: number;
  parcel_force_count: number;
  duration_ms?: number;
  outcome: 'success' | 'failure';
  page_path?: string;
};

export function captureProductEvent(
  event: string,
  properties: LabelProcessingProperties | Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.posthog) {
    return;
  }

  window.posthog.capture(event, {
    ...properties,
    page_path: properties.page_path ?? window.location.pathname,
  });
}
