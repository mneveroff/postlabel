import LegalLayout from '@/components/legal/LegalLayout';

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <h1 className="text-4xl">Privacy Policy</h1>
      <p className="text-l">Last Updated: 6th of June, 2026</p>

      <h3 className="text-3xl">Overview</h3>
      <p>
        This Privacy Policy outlines how PostLabel (&quot;the Service&quot;) manages and processes
        user information. By using the Service, you agree to the terms outlined in this Privacy
        Policy.
      </p>

      <h3 className="text-3xl">Data Processing and Privacy Practices</h3>
      <p>
        All PDF processing occurs client-side in your browser. No personally identifiable information
        (PII) from your PDFs is sent or stored on our servers. We collect aggregate product analytics
        via PostHog and cookieless infrastructure analytics from Cloudflare, Vercel, and Plausible,
        as detailed in our <a href="/legal/data">Data Processing Agreement</a>.
      </p>

      <h3 className="text-3xl">Logging and Analytics</h3>
      <p>
        The Service employs Cloudflare Cookieless Logging, Vercel Cookieless Analytics, Plausible
        Cookieless Analytics, and PostHog product analytics. PostHog events are triggered during
        Processing, Downloading, and Printing. They contain only aggregate counts (files, pages,
        labels, label types), size buckets, timing, and page context — never filenames, label text,
        addresses, or tracking numbers. PostHog also receives browser error telemetry for debugging,
        such as stack traces and error metadata, without PDF contents, filenames, label text,
        addresses, or tracking numbers. PostHog is configured without autocapture or session replay.
      </p>

      <h3 className="text-3xl">Analytics Storage</h3>
      <p>
        PostHog analytics data is processed by PostHog Cloud (EU). Infrastructure analytics from
        Vercel and Cloudflare are handled according to their respective privacy policies.
      </p>

      <h3 className="text-3xl">Hosting and Server Location</h3>
      <p>
        The Service is hosted on <a href="https://vercel.com/" target="_blank" rel="noreferrer">Vercel</a>{' '}
        as a static site. No server-side PDF processing occurs.
      </p>

      <h3 className="text-3xl">Third-Party Services</h3>
      <p>
        Please refer to our <a href="/legal/data">Data Processing Agreement</a> and the privacy
        policies of{' '}
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

      <h3 className="text-3xl">User Data Rights</h3>
      <p>
        You are within your rights not to use the Service. As we do not store PII from your PDFs, we
        cannot export or remove PDF contents on request — we never receive them.
      </p>

      <h3 className="text-3xl">Security Measures</h3>
      <p>
        The Service complies with current security practices. The code is openly available on{' '}
        <a href="https://github.com/MNeverOff/postlabel">GitHub</a>.
      </p>

      <h3 className="text-3xl">Contact Information</h3>
      <p>
        For any questions or concerns regarding this Privacy Policy, please contact us at{' '}
        <a href="mailto:contact@neveroff.dev">contact@neveroff.dev</a>.
      </p>
    </LegalLayout>
  );
}
