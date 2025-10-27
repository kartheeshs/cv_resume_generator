import Link from 'next/link';
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

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Career collateral platform</span>
            <h1 className={styles.heroTitle}>Turn accomplishments into beautifully typeset resumes in minutes.</h1>
            <p className={styles.heroCopy}>
              Our CV Resume Generator combines a polished authoring environment with international-ready templates, PDF
              exports, and admin controls so your team can scale hiring collateral without sacrificing design quality.
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

        <section className={styles.featureGrid}>
          {features.map((feature) => (
            <article key={feature.title} className={styles.featureCard}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
