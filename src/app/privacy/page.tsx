import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Pregret collects, uses, and protects your data. Includes advertising, analytics, and cookie disclosures for US and Canadian visitors.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold text-[var(--ink)]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Last updated: August 12, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none text-[var(--ink-2)]">
        <h2>Overview</h2>
        <p>
          Pregret (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates pregret.ca. This policy explains what
          data we collect, how we use it, and the choices you have. It applies to visitors in the United States, Canada,
          and worldwide.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Automatic data:</strong> IP address (used only to detect country for currency/store routing), browser
            type, device type, referring URL, and pages visited. Collected via our hosting provider (Vercel) and analytics.
          </li>
          <li>
            <strong>Cookies:</strong> A small country preference cookie (<code>pregret_country</code>) so you always land
            on the right Amazon store. Advertising and analytics partners set their own cookies (see below).
          </li>
          <li>
            <strong>Affiliate click data:</strong> When you click a product link, we log the click (product, timestamp,
            session ID) so we can report earnings. No personal information is included.
          </li>
        </ul>

        <h2>Advertising & third-party cookies</h2>
        <p>
          We serve advertising through third-party providers, which may include{" "}
          <strong>Google AdSense, Google DoubleClick, Ezoic, and Mediavine</strong>, once approved. These providers use
          cookies and similar technologies to serve ads based on your visits to this and other websites.
        </p>
        <ul>
          <li>
            Google uses the DoubleClick DART cookie to serve ads based on your visits to this and other sites. You can
            opt out at{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              google.com/policies/technologies/ads
            </a>
            .
          </li>
          <li>
            Manage all personalized advertising preferences at{" "}
            <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">
              aboutads.info/choices
            </a>{" "}
            (US) or{" "}
            <a href="https://youradchoices.ca/" target="_blank" rel="noopener noreferrer">
              youradchoices.ca
            </a>{" "}
            (Canada).
          </li>
        </ul>

        <h2>Affiliate disclosure</h2>
        <p>
          Pregret participates in the Amazon Services LLC Associates Program, Amazon.ca Associates, and other affiliate
          networks (Impact.com, Skimlinks, Best Buy Affiliate, Walmart, Target, and others). We earn commissions on
          qualifying purchases made through links on this site. Commissions never influence Regret Scores — every score
          is calculated deterministically from publicly available review data.
        </p>

        <h2>Analytics</h2>
        <p>
          We use Vercel Analytics and (optionally) Google Analytics to understand how visitors use the site. Both use
          cookies to collect standard visit information. IP addresses are anonymized where possible.
        </p>

        <h2>Data we do NOT collect</h2>
        <ul>
          <li>We do not require or store passwords for public browsing.</li>
          <li>We do not sell personal information to any third party.</li>
          <li>We do not target advertising to children under 13 (Pregret is intended for adult shoppers).</li>
        </ul>

        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>Cookies:</strong> Most browsers let you refuse or delete cookies. Doing so may affect site features
            like the country toggle.
          </li>
          <li>
            <strong>Advertising:</strong> Use the opt-out links above to stop personalized ads.
          </li>
          <li>
            <strong>Do Not Track:</strong> We honor the DNT browser signal where technically feasible.
          </li>
        </ul>

        <h2>California residents (CCPA)</h2>
        <p>
          If you are a California resident, you have the right to know what personal information we collect, request
          deletion, and opt out of any &ldquo;sale&rdquo; of information. We do not sell personal information. Contact
          us at <a href="mailto:hello@pregret.ca">hello@pregret.ca</a> to exercise these rights.
        </p>

        <h2>Canadian residents (PIPEDA)</h2>
        <p>
          Under Canada&rsquo;s Personal Information Protection and Electronic Documents Act, you have the right to access
          and correct any personal information we hold about you. Contact{" "}
          <a href="mailto:hello@pregret.ca">hello@pregret.ca</a>.
        </p>

        <h2>Children&rsquo;s privacy</h2>
        <p>
          Pregret is not directed at children under 13. We do not knowingly collect data from anyone under 13. If you
          believe a child has provided data, contact us to have it removed.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Updates take effect when posted on this page. The &ldquo;Last
          updated&rdquo; date at the top will change accordingly.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests: <a href="mailto:hello@pregret.ca">hello@pregret.ca</a>
        </p>
      </div>
    </div>
  );
}
