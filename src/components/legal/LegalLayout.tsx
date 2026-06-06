import { useState, useEffect, useRef, type ReactNode } from 'react';

type SidebarLinkProps = {
  title: string;
  href: string;
};

function SidebarLink({ title, href }: SidebarLinkProps) {
  const [isActive, setIsActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsActive(window.location.pathname === href);
  }, [href]);

  return (
    <div ref={sectionRef} className={`rounded-lg p-4 ${isActive ? 'bg-blue-100' : ''}`}>
      <a href={href} className={`text-left ${isActive ? 'font-semibold' : ''} text-gray-700 pr-2`}>
        {title}
      </a>
    </div>
  );
}

type LegalLayoutProps = {
  children: ReactNode;
};

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <section className="bg-white flex-grow m-6">
      <div className="flex flex-wrap mx-auto">
        <div className="container mx-auto grid grid-cols-12 md:gap-x-12 gap-y-12">
          <div className="col-span-12 md:col-span-3">
            <SidebarLink href="/legal/tldr" title="Too Long & Didn't Read" />
            <SidebarLink href="/legal/terms" title="Terms & Conditions" />
            <SidebarLink href="/legal/privacy" title="Privacy Policy" />
            <SidebarLink href="/legal/data" title="Data Processing Agreement" />
          </div>
          <div className="col-span-12 md:col-span-9 space-y-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
