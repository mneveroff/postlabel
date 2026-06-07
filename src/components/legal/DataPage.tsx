import LegalLayout from '@/components/legal/LegalLayout';

export default function DataPage() {
  return (
    <LegalLayout>
      <h1 className="text-4xl">Disclaimer: No PII Collection</h1>
      <p>Last Updated: 6th of June, 2026</p>

      <p>
        This Data Processing Agreement clarifies the processing practices of PostLabel (&quot;the
        Service&quot;). We explicitly state that our service does not collect or process Personally
        Identifiable Information (PII) from your PDFs.
      </p>

      <h3 className="text-3xl">Data Processing Practices</h3>
      <p>
        All PDF processing occurs client-side in your browser. The Service does not transmit, store,
        or process any personally identifiable information from your PDFs on our servers.
      </p>

      <h3 className="text-3xl">Third-Party Services</h3>
      <p>
        The Service utilises cookie-less tracking providers including Cloudflare, Vercel, Plausible,
        and PostHog for aggregate product and infrastructure analytics.
      </p>
      <p>
        For PDF processing, the Service utilises the{' '}
        <a href="https://github.com/mozilla/pdf.js" target="_blank" rel="noreferrer">
          pdf.js (pdfjs-dist) library
        </a>{' '}
        from Mozilla. The PDF worker script is loaded into your browser and processes everything
        client-side without sending PDF data externally.
      </p>
      <p>
        PostHog receives aggregate product events (counts, size buckets, timing) when you process,
        download, or print labels. It also receives browser error telemetry for debugging, such as
        stack traces and error metadata. It does not receive filenames, label text, addresses,
        tracking numbers, or PDF contents. PostHog is configured without autocapture, session replay,
        or user identification.
      </p>
      <p>
        Please refer to the privacy policies of{' '}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer">
          Cloudflare
        </a>
        ,{' '}
        <a href="https://plausible.io/data-policy" target="_blank" rel="noreferrer">
          Plausible
        </a>
        ,{' '}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">
          Vercel
        </a>
        , and{' '}
        <a href="https://posthog.com/privacy" target="_blank" rel="noreferrer">
          PostHog
        </a>{' '}
        for more information.
      </p>

      <h3 className="text-3xl">Non-Sensitive Analytics Data</h3>
      <p>
        The only data collected by the Service itself consists of aggregate product analytics via
        PostHog, detailed in our <a href="/legal/privacy">Privacy Policy</a>. This data is
        non-sensitive and does not include PII from your PDFs.
      </p>

      <h3 className="text-3xl">Assurance to Users</h3>
      <p>
        Users can be assured that their privacy is a priority. PDF contents never leave your browser.
        The code is openly available on{' '}
        <a href="https://github.com/MNeverOff/postlabel">GitHub</a>.
      </p>

      <h3 className="text-3xl">Legal Compliance</h3>
      <p>
        This disclaimer aligns with legal requirements, ensuring transparency about the nature of
        data processing undertaken by the Service.
      </p>
    </LegalLayout>
  );
}
