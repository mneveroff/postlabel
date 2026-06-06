import { useState, useEffect, useRef, type ReactNode } from 'react';

type ExpandableSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

function ExpandableSection({ id, title, children }: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.location.hash === `#${id}`) {
      setIsOpen(true);
      sectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [id]);

  return (
    <div id={id} ref={sectionRef} className="border-2 border-gray-100 rounded-lg">
      <button
        className="flex items-center justify-between w-full p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-left font-semibold text-gray-700 pr-2">{title}</h2>
        <span className="text-gray-400 bg-gray-200 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isOpen ? 'M6 12h12' : 'M18 10l-6 6-6-6'}
            />
          </svg>
        </span>
      </button>
      {isOpen && (
        <>
          <hr className="border-gray-200" />
          <div className="p-4 text-gray-600 space-y-2">{children}</div>
        </>
      )}
    </div>
  );
}

export default function AboutPage() {
  return (
    <section className="bg-white m-6 flex-grow">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8 text-gray-700">
          <h1 className="sm:text-3xl text-2xl font-medium text-center title-font mb-4 pb-4">
            Your Questions Answered
          </h1>
          <p className="text-base leading-relaxed mx-auto">
            This page serves two purposes - for me to document some oddities or specifics as well as
            write a half-decent manual on how to bulk export post labels from Royal Mail, Ebay and
            ParcelForce AND also boost up the SEO of the page. That&apos;s how it&apos;s done, right?
          </p>
        </div>

        <div className="mt-12 space-y-8">
          <ExpandableSection
            id="data-handling"
            title="How is my data handled? Is it stored or sold?"
          >
            <p>
              PostLabel does not store any PII outside of what GDPR and most regulators consider
              &quot;strictly necessary&quot;. PDF processing happens entirely in your browser. We
              collect aggregate product analytics (counts and sizes, never file contents) via
              PostHog, plus cookieless infrastructure analytics from Cloudflare, Vercel, and
              self-hosted Plausible. Go to <a href="/legal/tldr">Legal Section</a> for more details.
            </p>
          </ExpandableSection>

          <ExpandableSection
            id="source-code"
            title="Can I make sure of it? Where is the source code?"
          >
            <p>
              PostLabel is available as an MIT-Licensed open-source and free solution that you can
              run locally if you so desire, or check whether the implementation conforms to your
              expectations. Navigate to the{' '}
              <a href="https://github.com/MNeverOff/postlabel">GitHub Repository</a> for more
              details.
            </p>
          </ExpandableSection>

          <ExpandableSection
            id="royal-mail-formats"
            title="My Royal Mail label is not aligned / cropped correctly, what do I do?"
          >
            <p>It seems like Royal Mail is making some changes recently and effectively have four different formats now:</p>
            <ul className="list-disc pl-4">
              <li>
                Royal Mail Web Click &amp; Collect - &quot;All documents&quot; file. Has instructions
                and 1 labels per page, 2 if international.
              </li>
              <li>
                Royal Mail Web Click &amp; Collect - &quot;Label&quot; file. Has 1 label per page,
                arranged in one out of 4 corners (user-selectable).
              </li>
              <li>
                Royal Mail Mobile Click &amp; Collect - &quot;View Label&quot; file. Has 1 label per
                page, top-left corner with DIFFERENT margins to Web &quot;Label&quot; option.
              </li>
              <li>
                Royal Mail Mobile Click &amp; Collect - &quot;View Documents&quot; file generated
                right after checkout. Identical to the Web &quot;All documents&quot; option.
              </li>
            </ul>
            <p>
              <strong>The tool is currently capable of processing 3/4 types</strong>: Web All
              Documents, Mobile &quot;View Label&quot; and Mobile &quot;View Documents&quot;.
            </p>
            <p>
              The new, latest Web &quot;Label&quot; file where you have to select a corner for the
              label to go in is NOT supported as it has a slightly different alignment.
            </p>
            <img
              className="flex flex-grow mx-auto"
              width={256}
              height={256}
              src="/rm-unsupported-type.png"
              alt="Image depicting unsupported Royal Mail Label Type"
            />
          </ExpandableSection>

          <ExpandableSection
            id="working-on-ios"
            title="The tool doesn't seem to work on my iPhone / iPad / other mobile device!"
          >
            <p>
              Basically there are two issues with mobile devices: they often can&apos;t
              &quot;save&quot; a blob content (and that&apos;s what is generated when you press
              &quot;download&quot;, remember, no file storage?) as file. And they can&apos;t print
              the page as they don&apos;t like iframes.
            </p>
            <p>
              The solution that I found to that was using <strong>Download PDF</strong> and then
              using a system Print dialog from there. And in THAT Print dialog, at least on iOS you
              can both print (as expected) AND save to PDF. Hope this helps.
            </p>
          </ExpandableSection>

          <ExpandableSection
            id="questions-concerns-suggestions"
            title="I have a question / concern / suggestion / feature request. How can I reach you?"
          >
            <p>
              For questions or concerns regarding these Terms of Service, please contact us at{' '}
              <a href="mailto:contact@neveroff.dev">contact@neveroff.dev</a>. You can also @ me at{' '}
              <a href="https://mas.to/@MNeverOff" target="_blank" rel="noreferrer">
                @MNeverOff@mas.to
              </a>{' '}
              or{' '}
              <a href="https://twitter.com/MNeverOff" target="_blank" rel="noreferrer">
                @MNeverOff
              </a>{' '}
              if you fancy that.
            </p>
          </ExpandableSection>
        </div>
      </div>
    </section>
  );
}
