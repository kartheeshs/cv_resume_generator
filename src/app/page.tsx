'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useLocalization } from '@/context/LocalizationContext';
import { resumeTemplateDefinitions } from '@/templates/resume/definitions';
import styles from './page.module.css';

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

const previewBackdrop: CSSProperties = {
  background:
    'radial-gradient(circle at 12% 12%, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0) 45%), radial-gradient(circle at 88% 20%, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0) 50%), linear-gradient(155deg, #0f172a 0%, #312e81 45%, #1e1b4b 100%)',
};

export default function LandingPage() {
  const { copy, settings } = useLocalization();
  const { landing } = copy;
  const { hero } = landing;
  const pricingPlans = landing.pricingPlans.map((plan) => ({
    name: plan.name,
    price: plan.priceKey === 'growth' ? settings.pricing.growthPrice : plan.price ?? '',
    frequency: plan.priceKey === 'growth' ? settings.pricing.growthFrequency : plan.frequency,
    description: plan.description,
    features: plan.features,
    cta: plan.cta,
    href: plan.href,
    highlighted: plan.highlighted,
    badge: plan.badge,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.heroSection}>
          <div className={styles.heroMetaRow}>
            <div className={styles.heroBreadcrumbs}>
              <Link href="/">{hero.breadcrumbs.home}</Link>
              <span aria-hidden>›</span>
              <span>{hero.breadcrumbs.trail}</span>
            </div>
            <span className={styles.heroContextPill}>{hero.contextPill}</span>
          </div>

          <div className={styles.heroLayout}>
            <div className={styles.preview}>
              <div className={styles.previewToolbar}>
                <span>{hero.previewTitle}</span>
                <div className={styles.previewToolbarMeta}>
                  <span>{hero.previewUpdatedLabel}</span>
                  <span>{hero.previewViews}</span>
                </div>
              </div>
              <div className={styles.previewCanvas} style={previewBackdrop}>
                <div className={styles.previewContent}>
                  <span>{hero.badge}</span>
                  <h2>{hero.previewHeading}</h2>
                  <p>{hero.previewDescription}</p>
                  <ul>
                    {hero.previewList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <aside className={styles.heroPanel}>
              <span className={styles.heroBadge}>{hero.badge}</span>
              <h1 className={styles.heroTitle}>{hero.title}</h1>
              <p className={styles.heroCopy}>{hero.copy}</p>
              <div className={styles.heroStats}>
                {hero.metrics.map((metric) => (
                  <div key={metric.label} className={styles.heroStat}>
                    <span>{metric.value}</span>
                    <small>{metric.label}</small>
                  </div>
                ))}
              </div>
              <div className={styles.heroActions}>
                <Link href="/login" className={styles.primaryAction}>
                  {hero.primaryAction}
                </Link>
                <Link href="/#templates" className={styles.secondaryAction}>
                  {hero.secondaryAction}
                </Link>
              </div>
              <div
                className={`${styles.adSlot} ${styles.heroAdSlot}`}
                aria-label="Hero advertisement placement"
                role="complementary"
              >
                <span className={styles.adLabel}>Ad Space</span>
                <p className={styles.adDescription}>
                  Reserve this premium spotlight to promote hiring partners, portfolio services, or limited time offers.
                </p>
                <span className={styles.adNote}>Suggested size: 300 × 250</span>
              </div>
              <dl className={styles.heroMetaList}>
                {hero.metadata.map((item) => (
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
            <h2>{hero.overviewTitle}</h2>
            <p>{hero.featuresIntro}</p>
            <ul className={styles.highlightList}>
              {hero.features.map((feature) => (
                <li key={feature.title} className={styles.highlightItem}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </li>
              ))}
            </ul>
          </article>

          <aside className={styles.sidebar}>
            <div className={styles.infoCard}>
              <h3>{hero.projectMetadataTitle}</h3>
              <dl className={styles.infoList}>
                {hero.metadata.map((item) => (
                  <div key={`meta-${item.label}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>{hero.maintainerLabel}</dt>
                  <dd>{hero.maintainerValue}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.infoCard}>
              <h3>{hero.resourcesTitle}</h3>
              <ul className={styles.resourceList}>
                {hero.resources.map((resource) => (
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
              <h3>{hero.tagsTitle}</h3>
              <div className={styles.tagList}>
                {hero.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>

            <div
              className={`${styles.adSlot} ${styles.sidebarAdSlot}`}
              aria-label="Sidebar advertisement placement"
              role="complementary"
            >
              <span className={styles.adLabel}>Ad Space</span>
              <p className={styles.adDescription}>
                Feature affiliated job boards, certification partners, or resume review services alongside key resources.
              </p>
              <span className={styles.adNote}>Suggested size: 300 × 600</span>
            </div>
          </aside>
        </section>

        <section id="templates" className={styles.templateSection}>
          <div className={styles.sectionHeader}>
            <h2>{hero.templateGalleryTitle}</h2>
            <p>{hero.templateGalleryCopy}</p>
          </div>
          <div className={styles.templateGrid}>
            {templateShowcase.map((definition) => {
              const dimensions = definition.previewDimensions ?? { width: 900, height: 1160 };
              const previewScale = Math.min(1, 240 / dimensions.height);
              return (
                <article key={definition.id} className={styles.templateCard}>
                  <span className={styles.templateBadge}>{definition.name}</span>
                  <div className={styles.templatePreview}>
                    <div
                      className={styles.templatePreviewInner}
                      style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top center',
                      }}
                    >
                      <div
                        className={styles.templatePreviewContent}
                        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
                      >
                        {definition.renderPreview(definition.defaultContent)}
                      </div>
                    </div>
                  </div>
                  <div className={styles.templateMeta}>
                    <h3>{definition.name}</h3>
                    <p>{definition.description}</p>
                    <Link href="/login" className={styles.templateLink}>
                      {hero.templateUse}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="pricing" className={styles.pricingSection}>
          <div className={styles.sectionHeader}>
            <h2>{hero.pricingTitle}</h2>
            <p>{hero.pricingCopy}</p>
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

        <section
          className={`${styles.adSlot} ${styles.adBanner}`}
          aria-label="Landing page banner advertisement"
          role="complementary"
        >
          <div className={styles.adBannerCopy}>
            <span className={styles.adLabel}>Ad Space</span>
            <p className={styles.adDescription}>
              Allocate this wide banner to highlight trusted sponsors, recruiter programs, or career accelerators.
            </p>
            <p className={styles.adNote}>Ideal dimensions: 970 × 250</p>
          </div>
          <div className={styles.adBannerPlaceholder} aria-hidden>
            <span>Preview your creative here</span>
          </div>
        </section>

        <section className={styles.ctaBanner}>
          <div>
            <h2>{hero.ctaTitle}</h2>
            <p>{hero.ctaCopy}</p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/login" className={styles.primaryAction}>
              {hero.ctaPrimary}
            </Link>
            <Link href="/dashboard" className={styles.secondaryAction}>
              {hero.ctaSecondary}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
