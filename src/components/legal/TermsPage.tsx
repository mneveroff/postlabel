import LegalLayout from '@/components/legal/LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout>
      <h1 className="text-4xl">Terms of Service</h1>
      <p className="text-l">Last Updated: 6th of June, 2026</p>

      <h3 className="text-3xl">Acceptance of Terms</h3>
      <p>
        By accessing and using PostLabel (&quot;the Service&quot;), you agree to comply with and be
        bound by these Terms of Service as well as <a href="/legal/privacy">Privacy Policy</a> and
        the <a href="/legal/data">Data Processing Agreement</a>.
      </p>

      <h3 className="text-3xl">Description of Service</h3>
      <p>
        The Service provides an open-source tool for the extraction of sections of PDFs of post /
        mailing labels and their combination onto pages of various size (i.e. A4) for printing,
        tailored for Royal Mail, eBay, ParcelForce, and other services. The entire PDF processing
        occurs client-side, never leaving your browser.
      </p>

      <h3 className="text-3xl">User Responsibilities</h3>
      <p>
        You are responsible for ensuring the legality of your use of the Service and compliance with
        relevant laws and regulations.
      </p>

      <h3 className="text-3xl">Restrictions on Reselling and Usage Limitations</h3>
      <h4 className="text-xl">Reselling and Distribution</h4>
      <p>
        You are expressly prohibited from reselling, embedding, or otherwise distributing the
        Service to provide similar services to other end users without prior written consent from
        the Service owner (see Contact section).
      </p>

      <h4 className="text-xl">Usage Limitations for Larger Companies</h4>
      <p>
        The Service is intended for use by individual users and small to medium-sized businesses.
        Usage by entities classified as &quot;big companies,&quot; defined as those with over 100
        employees or exceeding £10 million in yearly turnover, is expressly restricted.
      </p>

      <h4 className="text-xl">Enforcement</h4>
      <p>
        The Service reserves the right to take appropriate legal action to enforce these
        restrictions and limitations.
      </p>

      <h3 className="text-3xl">Data Privacy & Processing</h3>
      <p>
        All PDF processing occurs client-side. No personally identifiable information (PII) from
        your PDFs is sent or stored on our servers. Aggregate product analytics are collected as
        described in our <a href="/legal/privacy">Privacy Policy</a> and{' '}
        <a href="/legal/data">Data Processing Agreement</a>.
      </p>

      <h3 className="text-3xl">Liability</h3>
      <h4 className="text-xl">Output Quality, Accuracy, and Errors</h4>
      <p>
        The Service disclaims any liability for the quality, accuracy, or correctness of the output,
        including processed mail/postage labels.
      </p>
      <h4 className="text-xl">Material Losses and User Responsibility</h4>
      <p>
        The Service denies any liability for material losses arising from use of the service. Users
        are solely responsible for verifying the accuracy of processed output before use.
      </p>
      <h4 className="text-xl">No Warranty and Limitation of Liability</h4>
      <p>
        The Service is provided &quot;as is&quot; without warranty. To the maximum extent permitted
        by applicable law, the Service shall not be liable for indirect, consequential, or punitive
        damages.
      </p>

      <h3 className="text-3xl">Termination</h3>
      <p>
        We reserve the right to terminate or suspend access to the Service at our discretion for
        any reason without notice.
      </p>

      <h3 className="text-3xl">Changes to Terms</h3>
      <p>
        We may update these Terms of Service from time to time. Your continued use of the Service
        after changes constitutes acceptance of the updated terms.
      </p>

      <h3 className="text-3xl">Contact</h3>
      <p>
        For questions or concerns regarding these Terms of Service, please contact us at{' '}
        <a href="mailto:contact@neveroff.dev">contact@neveroff.dev</a>.
      </p>
    </LegalLayout>
  );
}
