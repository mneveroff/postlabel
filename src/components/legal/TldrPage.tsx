import LegalLayout from '@/components/legal/LegalLayout';

export default function TldrPage() {
  return (
    <LegalLayout>
      <h1 className="text-4xl">Too Long & Didn&apos;t Read</h1>
      <p className="text-l">Last Updated: 6th of June, 2026</p>
      <p>
        The goal of this page is to provide a no-nonsense, simple and human-readable explanation of
        legal aspects of using this app.
      </p>

      <h3 className="text-3xl">What the service is</h3>
      <p>
        This is a very simplistic app that detects texts on PDFs you upload, tries to guess which
        service it came from, cuts out a section where it thinks the label will be and then takes
        all labels cut out and composes a single file with neat and printable labels. Go to{' '}
        <a href="/legal/terms">Terms & Conditions</a> for more details or{' '}
        <a href="https://github.com/MNeverOff/postlabel">GitHub</a> for source code.
      </p>

      <h3 className="text-3xl">Is it free? Can I use it?</h3>
      <p>
        This app is designed to be used by people and small businesses for the express purpose of
        label printing. You aren&apos;t allowed to resell, embed or otherwise profit from this
        application without my express and written permission. The usage of the app is also expressly
        prohibited to &quot;big companies&quot; - over 100 staff or over £10m in yearly turnover. Go
        to <a href="/legal/terms">Terms & Conditions</a> for more details.
      </p>

      <h3 className="text-3xl">How is it ran and where does the data go</h3>
      <p>
        The app is a static site with one interactive page. All PDF processing happens in your
        browser — not a single byte from inside your PDF ever hits our servers. The site is served
        as static HTML from Vercel&apos;s CDN.
      </p>
      <p>
        We capture aggregate product analytics via PostHog when labels are processed, downloaded, or
        printed. These events include counts (files, pages, labels, label types), payload sizes, and
        timing — never filenames, label text, addresses, tracking numbers, or PDF contents. PostHog
        may also receive standard browser transport metadata (such as page path and user agent).
      </p>
      <p>
        Go to <a href="/legal/privacy">Privacy Policy</a> for more details.
      </p>

      <h3 className="text-3xl">Where is it ran, who else has access</h3>
      <p>
        The app is hosted on Vercel (static, stateless) with DNS and reverse proxy managed by
        Cloudflare. Both collect cookieless infrastructure analytics that generalise and anonymise
        request metadata.
      </p>
      <p>
        There is also Plausible Community Edition, self-hosted in a datacenter in Germany,
        Frankfurt.
      </p>
      <p>
        Go to <a href="/legal/data">Data Processing Agreement</a> for more details.
      </p>

      <h3 className="text-3xl">What does it mean that you don&apos;t collect PII</h3>
      <p>
        It means we never have access to information that could identify a specific person from your
        PDFs — because PDFs are never uploaded. Aggregate analytics may include non-identifying
        counts and browser metadata, but never label contents.
      </p>
      <p>
        Go to <a href="/legal/privacy">Privacy Policy</a> and{' '}
        <a href="/legal/data">Data Processing Agreement</a> for more details.
      </p>

      <h3 className="text-3xl">Who&apos;s at fault if it breaks, makes an error or I lose money?</h3>
      <p>
        The app is &quot;as is&quot; meaning you got to verify the input and output. I&apos;ll take
        no liability if you print off the output without checking it. Go to{' '}
        <a href="/legal/terms">Terms & Conditions</a> for more details.
      </p>

      <h3 className="text-3xl">Do you make money off of it? Why do you do it?</h3>
      <p>
        No, I do not make money off of it. I got tired of Royal Mail&apos;s complacency with bulk
        label generation and crossed over 100 Photoshop files where I&apos;d go and manually crop
        out all of the labels to print them on my A4 printer.
      </p>

      <h3 className="text-3xl">I really want to talk to you! I have a bug report / request / question.</h3>
      <p>
        You can submit an issue in the{' '}
        <a href="https://github.com/MNeverOff/postlabel">GitHub Repository</a> and I&apos;ll take a
        look.
      </p>
    </LegalLayout>
  );
}
