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

function withOpacity(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Career Studio GM7</span>
            <h1 className={styles.heroTitle}>
              Career Studio GM7 turns accomplishments into beautifully typeset resumes in minutes.
            </h1>
            <p className={styles.heroCopy}>
              Our platform blends a polished authoring environment with international-ready templates, PDF exports, and
              admin controls so your team can scale hiring collateral without sacrificing design quality.
            </p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.primaryButton}>
                Get started
              </Link>
              <Link href="/dashboard" className={styles.secondaryButton}>
                Enter the app
              </Link>
            </div>
          </div>

          <aside className={styles.heroCard}>
            <div className={styles.metricGrid}>
              {metrics.map((metric) => (
                <div key={metric.label} className={styles.metricCard}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
            <p className={styles.heroCopy}>
              Built with your technology preferences in mind—Next.js 14, Firebase, and modern PDF rendering—all wrapped in
              a refined product experience.
            </p>
          </aside>
        </section>

        <section id="features" className={styles.featureGrid}>
          {features.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>

        <section id="templates" className={styles.templateShowcase}>
          <div className={styles.sectionHeader}>
            <h2>Template gallery with instant previews</h2>
            <p>
              Browse globally minded resume and CV templates. Every layout ships with curated sample content so teams can share a
              polished draft in minutes.
            </p>
          </div>
          <div className={styles.templateGrid}>
            {templateShowcase.map((template) => {
              const accentBackground = `linear-gradient(155deg, ${withOpacity(template.accentColor, 0.18)}, #ffffff)`;
              const cardStyle: CSSProperties = {
                borderColor: withOpacity(template.accentColor, 0.35),
              };
              return (
                <article key={template.id} className={styles.templateCard} style={cardStyle}>
                  <div className={styles.templatePreview} style={{ background: accentBackground }}>
                    <div className={styles.templatePreviewInner}>
                      <div className={styles.templatePreviewContent}>{template.renderPreview(template.defaultContent)}</div>
                    </div>
                  </div>
                  <div className={styles.templateMeta}>
                    <span className={styles.templateBadge}>
                      {template.kind === 'cv' ? 'CV template' : 'Resume template'}
                    </span>
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="pricing" className={styles.pricingSection}>
          <div className={styles.sectionHeader}>
            <h2>Pricing that scales with your hiring pipeline</h2>
            <p>
              Start for free, then unlock collaboration, brand controls, and compliance features when you need them. Cancel or
              change plans at any time.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {pricingPlans.map((plan) => {
              const planClasses = [styles.pricingCard, plan.highlighted ? styles.pricingCardHighlighted : '']
                .filter(Boolean)
                .join(' ');
              return (
                <article key={plan.name} className={planClasses}>
                  {plan.badge && <span className={styles.pricingBadge}>{plan.badge}</span>}
                  <header className={styles.pricingHeader}>
                    <h3>{plan.name}</h3>
                    <p className={styles.pricingDescription}>{plan.description}</p>
                    <div className={styles.pricingPrice}>
                      <span>{plan.price}</span>
                      {plan.frequency && <small>{plan.frequency}</small>}
                    </div>
                  </header>
                  <ul className={styles.pricingFeatures}>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={plan.highlighted ? styles.pricingPrimaryButton : styles.pricingSecondaryButton}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
