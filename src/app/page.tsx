import type { CSSProperties } from 'react';
import Link from 'next/link';
import { resumeTemplateDefinitions } from '@/templates/resume/definitions';
import styles from './page.module.css';

const features = [
  {
    title: 'Streamed PDF generation',
    description:
      'Generate resumes on the fly without storing files thanks to Next.js route handlers and @react-pdf/renderer.',
  },
  {
    title: 'Secure authentication',
    description:
      'Offer passwordless email links and Google sign-in powered by Firebase Auth in the Tokyo region.',
  },
  {
    title: 'Flexible editing',
    description:
      'Save drafts, templates, and entitlement tracking in Firestore so your data is always up to date.',
  },
  {
    title: 'Ready to scale',
    description:
      'Deploy on Vercel with server-side rendering, connect Upstash for rate limiting, and plug Stripe in when you are ready to charge.',
  },
];

const metrics = [
  { label: 'Templates', value: '12+' },
  { label: 'Locales supported', value: '6' },
  { label: 'Avg. export time', value: '~2s' },
  { label: 'Draft autosave', value: 'Realtime' },
];

const heroMetadata = [
  { label: 'Latest update', value: 'June 2024' },
  { label: 'Version', value: 'v2.1' },
  { label: 'Access', value: 'Included with Growth plan' },
];

const resourceLinks = [
  {
    title: 'Platform overview',
    description: 'Understand the editor workflow from login to PDF export.',
    href: '/#overview',
  },
  {
    title: 'Template showcase',
    description: 'Preview localized resume and CV layouts built into the product.',
    href: '/#templates',
  },
  {
    title: 'Pricing & limits',
    description: 'Compare free, growth, and enterprise entitlements at a glance.',
    href: '/#pricing',
  },
];

const tags = ['Resume builder', 'Design system', 'Hiring', 'Templates', 'PDF', 'Firebase'];

const templateShowcase = Object.values(resumeTemplateDefinitions).slice(0, 4);

type PricingPlan = {
  name: string;
  price: string;
  frequency?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
};

const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$0',
    frequency: '/month',
    description: 'For individuals trying the builder before sharing their first PDF.',
    features: ['3 saved resumes', 'Single-page PDF exports', 'Email link authentication'],
    cta: 'Start for free',
    href: '/login?plan=starter',
  },
  {
    name: 'Growth',
    price: '$18',
    frequency: '/seat /month',
    description: 'For talent teams publishing polished resumes every week.',
    features: [
      'Unlimited drafts & version history',
      'Full template library & locale packs',
      'Brand colors, fonts & shared assets',
      'Priority email support',
    ],
    cta: 'Upgrade to Growth',
    href: '/login?plan=growth',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    description: 'For global organizations that need advanced governance and support.',
    features: [
      'SAML SSO & SCIM provisioning',
      'Custom template production services',
      'Dedicated customer success manager',
      'On-premises export pipeline options',
    ],
    cta: 'Book a call',
    href: '/login?plan=enterprise',
  },
];

const previewBackdrop: CSSProperties = {
  background:
    'radial-gradient(circle at 12% 12%, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0) 45%), radial-gradient(circle at 88% 20%, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 50%), linear-gradient(155deg, #0f172a 0%, #312e81 45%, #1e1b4b 100%)',
};

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroSection}>
          <div className={styles.heroBreadcrumbs}>
            <Link href="/">Career Studio GM7</Link>
            <span aria-hidden>•</span>
            <span>Resume editor website flow</span>
          </div>

          <div className={styles.heroLayout}>
            <div className={styles.preview}>
              <div className={styles.previewToolbar}>
                <span>Resume Editor Website Flow</span>
                <div className={styles.previewToolbarMeta}>
                  <span>Last updated {heroMetadata[0].value}</span>
                  <span>1.2k previews</span>
                </div>
              </div>
              <div className={styles.previewCanvas} style={previewBackdrop}>
                <div className={styles.previewContent}>
                  <span>Career Studio GM7</span>
                  <h2>Modern resumes without wrestling with layout files</h2>
                  <p>
                    Pick a template, tailor the copy, and hand a recruiter a polished PDF minutes after signing in. Team
                    guardrails make every export feel on-brand.
                  </p>
                  <ul>
                    {features.slice(0, 3).map((feature) => (
                      <li key={feature.title}>{feature.title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <span className={styles.heroBadge}>Career Studio GM7</span>
              <h1 className={styles.heroTitle}>Build resume experiences your candidates will love</h1>
              <p className={styles.heroCopy}>
                Designed to echo a polished product page, this flow showcases pricing, templates, and authentication while
                keeping admin utilities only a direct URL away. Everything is tuned for clarity when you share it with
                stakeholders.
              </p>
              <div className={styles.heroStats}>
                {metrics.map((metric) => (
                  <div key={metric.label} className={styles.heroStat}>
                    <span>{metric.value}</span>
                    <small>{metric.label}</small>
                  </div>
                ))}
              </div>
              <div className={styles.heroActions}>
                <Link href="/login" className={styles.primaryAction}>
                  Launch editor
                </Link>
                <Link href="/#templates" className={styles.secondaryAction}>
                  Preview templates
                </Link>
              </div>
              <dl className={styles.heroMetaList}>
                {heroMetadata.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        <section id="overview" className={styles.contentSection}>
          <article className={styles.overview}>
            <h2>Overview</h2>
            <p>
              A landing experience inspired by Figma community resources—introducing a hero preview, detailed release
              metadata, and a modular layout that surfaces features, templates, and plan restrictions without feeling
              crowded.
            </p>
            <ul className={styles.highlightList}>
              {features.map((feature) => (
                <li key={feature.title} className={styles.highlightItem}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </li>
              ))}
            </ul>
          </article>

          <aside className={styles.sidebar}>
            <div className={styles.infoCard}>
              <h3>Project metadata</h3>
              <dl className={styles.infoList}>
                {heroMetadata.map((item) => (
                  <div key={`meta-${item.label}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Maintainer</dt>
                  <dd>Career Studio GM7 design systems</dd>
                </div>
              </dl>
            </div>

            <div className={styles.infoCard}>
              <h3>Resources</h3>
              <ul className={styles.resourceList}>
                {resourceLinks.map((resource) => (
                  <li key={resource.title}>
                    <Link href={resource.href}>
                      <span>{resource.title}</span>
                      <small>{resource.description}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.tagCard}>
              <h3>Tags</h3>
              <div className={styles.tagList}>
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="templates" className={styles.templateSection}>
          <div className={styles.sectionHeader}>
            <h2>Template gallery</h2>
            <p>
              Browse localized resume systems with typography tuned for hiring teams. Each template ships with rich sample
              data so stakeholders see exactly how content comes together.
            </p>
          </div>
          <div className={styles.templateGrid}>
            {templateShowcase.map((definition) => (
              <article key={definition.id} className={styles.templateCard}>
                <span className={styles.templateBadge}>{definition.name}</span>
                <div className={styles.templatePreview}>
                  <div className={styles.templatePreviewInner}>
                    <div className={styles.templatePreviewContent}>
                      {definition.renderPreview(definition.defaultContent)}
                    </div>
                  </div>
                </div>
                <div className={styles.templateMeta}>
                  <h3>{definition.name}</h3>
                  <p>{definition.description}</p>
                  <Link href="/login" className={styles.templateLink}>
                    Use this template
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.pricingSection}>
          <div className={styles.sectionHeader}>
            <h2>Pricing & availability</h2>
            <p>
              Free plans showcase the full editor once, Growth unlocks collaborative workflows, and Enterprise brings
              governance plus bespoke template production.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingHighlighted : ''}`}
              >
                {plan.badge && <span className={styles.pricingBadge}>{plan.badge}</span>}
                <div className={styles.pricingHeader}>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                </div>
                <div className={styles.pricingPrice}>
                  <span>{plan.price}</span>
                  {plan.frequency && <small>{plan.frequency}</small>}
                </div>
                <ul className={styles.pricingFeatures}>
                  {plan.features.map((feature) => (
                    <li key={`${plan.name}-${feature}`}>{feature}</li>
                  ))}
                </ul>
                <Link href={plan.href} className={styles.pricingButton}>
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaBanner}>
          <div>
            <h2>Ready to build your next standout resume?</h2>
            <p>
              Sign in to Career Studio GM7 to unlock the editor, invite collaborators, and manage download limits with a
              click.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/login" className={styles.primaryAction}>
              Sign in to continue
            </Link>
            <Link href="/dashboard" className={styles.secondaryAction}>
              Explore dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
