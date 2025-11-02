'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Locale = 'en' | 'ja';

type TranslationLink = {
  href: string;
  label: string;
};

type TranslationPricingPlan = {
  name: string;
  price?: string;
  priceKey?: 'growth';
  description: string;
  features: string[];
  cta: string;
  href: string;
  frequency?: string;
  badge?: string;
  highlighted?: boolean;
};

type TranslationDefinition = {
  nav: {
    marketingLinks: TranslationLink[];
    dashboard: string;
    visitWebsite: string;
    subscribe: string;
    searchPlaceholder: string;
    signIn: string;
    signOut: string;
    languageLabel: string;
  };
  landing: {
    hero: {
      breadcrumbs: { home: string; trail: string };
      contextPill: string;
      badge: string;
      title: string;
      copy: string;
      previewTitle: string;
      previewHeading: string;
      previewSubtitle: string;
      previewDescription: string;
      previewList: string[];
      previewUpdatedLabel: string;
      previewViews: string;
      metadata: { label: string; value: string }[];
      metrics: { label: string; value: string }[];
      featuresIntro: string;
      features: { title: string; description: string }[];
      resourcesTitle: string;
      resources: { title: string; description: string; href: string }[];
      tagsTitle: string;
      tags: string[];
      primaryAction: string;
      secondaryAction: string;
      overviewTitle: string;
      projectMetadataTitle: string;
      maintainerLabel: string;
      maintainerValue: string;
      templateGalleryTitle: string;
      templateGalleryCopy: string;
      templateUse: string;
      pricingTitle: string;
      pricingCopy: string;
      ctaTitle: string;
      ctaCopy: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    pricingPlans: TranslationPricingPlan[];
  };
  login: {
    heroTagline: string;
    heroTitle: string;
    heroCopy: string;
    heroBrand: string;
    cardTitleSignIn: string;
    cardTitleSignUp: string;
    cardDescriptionSignIn: string;
    cardDescriptionSignUp: string;
    methodMagicLink: string;
    methodPassword: string;
    labels: {
      email: string;
      password: string;
      confirmPassword: string;
    };
    placeholders: {
      email: string;
      password: string;
      confirmPassword: string;
    };
    submit: {
      magicLinkSignIn: string;
      magicLinkSignUp: string;
      passwordSignIn: string;
      passwordSignUp: string;
      sending: string;
      signingIn: string;
      creatingAccount: string;
    };
    divider: string;
    continueWithGoogle: string;
    switchToSignUp: string;
    switchToSignIn: string;
    status: {
      emailSentSignIn: string;
      emailSentSignUp: string;
      sendEmailError: string;
      missingCredentials: string;
      shortPassword: string;
      passwordMismatch: string;
      passwordSignInFailed: string;
      passwordSignUpFailed: string;
      googleFailed: string;
    };
  };
  adminLogin: {
    heroTagline: string;
    heroTitle: string;
    heroCopy: string;
    heroLinkPrompt: string;
    heroLinkText: string;
    cardTitle: string;
    cardCopy: string;
    labels: {
      email: string;
      password: string;
    };
    placeholders: {
      email: string;
      password: string;
    };
    submitIdle: string;
    submitLoading: string;
    status: {
      missingCredentials: string;
      invalidRole: string;
      signInError: string;
    };
  };
  adminDashboard: {
    headerTitle: string;
    headerSubtitle: string;
    searchPlaceholder: string;
    createReport: string;
    signOut: string;
    tabs: { id: string; label: string; description: string }[];
    badge: string;
    badgeDescriptor: string;
    roleLabel: string;
    overviewTitle: string;
    overviewCopy: string;
    metrics: { label: string; valueKey: 'totalUsers' | 'proUsers' | 'downloads30' | 'totalDownloads' }[];
    metricFooters: { proUsers: string; downloads30: string };
    downloadsHeading: string;
    downloadsEmpty: string;
    downloadsLoading: string;
    downloadsColumns: { document: string; user: string; template: string; language: string; plan: string; created: string };
    templatesHeading: string;
    templatesCopy: string;
    templatesEmpty: string;
    templatesLoading: string;
    templatesColumns: { name: string; kind: string; description: string; accent: string; actions: string };
    duplicateTemplate: string;
    duplicateTemplateLoading: string;
    usersHeading: string;
    usersCopy: string;
    usersEmpty: string;
    usersColumns: {
      email: string;
      role: string;
      plan: string;
      remainingDownloads: string;
      unlimitedDownloads: string;
      nextRefresh: string;
      subscriptionStatus: string;
      createdAt: string;
      actions: string;
    };
    usersDetail: {
      title: string;
      subtitle: string;
      selectedSubtitle: string;
      noSelection: string;
      sections: {
        profile: string;
        entitlements: string;
        subscription: string;
        actions: string;
      };
      labels: {
        email: string;
        role: string;
        createdAt: string;
        plan: string;
        downloads: string;
        nextRefresh: string;
        subscriptionStatus: string;
        subscriptionPeriodEnd: string;
        stripeCustomerId: string;
      };
    };
    buttons: {
      setUser: string;
      setAdmin: string;
      addDownloads: string;
      resetDownloads: string;
      resetDownloadsLoading: string;
      setPlanToFree: string;
      setPlanToPro: string;
      refreshStatus: string;
      refreshStatusLoading: string;
      deleteUser: string;
      deleteUserLoading: string;
      viewDetails: string;
    };
    statuses: {
      roleUpdated: string;
      roleUpdateFailed: string;
      adjustSuccess: string;
      adjustFailed: string;
      resetSuccess: string;
      resetFailed: string;
      planUpdated: string;
      planFailed: string;
      subscriptionRefreshed: string;
      subscriptionFailed: string;
      templatesFailed: string;
      downloadsFailed: string;
      templateDuplicated: string;
      userDeleted: string;
      userDeleteFailed: string;
      userDeleteEmailFailed: string;
    };
    confirmations: {
      deleteUser: string;
    };
    subscriptionsColumns: {
      email: string;
      customer: string;
      plan: string;
      status: string;
      periodEnd: string;
      actions: string;
    };
  };
  resumeDashboard: {
    heroBadge: string;
    heroContext: string;
    heroTitle: string;
    heroCopy: string;
    signedInFallback: string;
    planLabel: string;
    downloadsLeftLabel: string;
    unlimitedDownloads: string;
    unlimitedDownloadsDescription: string;
    nextRefreshLabel: string;
    subscribeCta: string;
    subscribeCtaLoading: string;
    loadingEntitlements: string;
    resumeHeading: string;
    resumeCopy: string;
    sectionLabels: { id: string; label: string; description: string }[];
    searchPlaceholder: string;
    templateHeading: string;
    templateCopy: string;
    draftsHeading: string;
    draftsDescription: string;
    draftsEmpty: string;
    draftsLoading: string;
    cvDraftsHeading: string;
    downloadsHeading: string;
    downloadsEmpty: string;
    downloadsCopy: string;
    settingsHeading: string;
    settingsCopy: string;
    downloadLimitNotice: string;
    downloadLimitExceeded: string;
    downloadResetByAdmin: string;
    freePlanRefreshInfo: string;
    draftStatusLoading: string;
    draftStatusEmpty: string;
    draftStatusLoaded: string;
    templateAction: string;
    openInEditor: string;
    saveDraftAction: string;
    editAction: string;
    previewAction: string;
    resetAction: string;
    customTemplateFallback: string;
    downloadAction: string;
    statuses: {
      loadTemplatesError: string;
      loadDraftsError: string;
      loadDownloadsError: string;
      signInRequired: string;
      subscriptionRefreshed: string;
      subscriptionRefreshFailed: string;
      upgradeSignInRequired: string;
      checkoutDemo: string;
      checkoutFailed: string;
      billingSignInRequired: string;
      billingDisabled: string;
      billingError: string;
      subscriptionUpgraded: string;
      checkoutCancelled: string;
      draftNotFound: string;
      draftLoaded: string;
      draftLoadFailed: string;
      draftUpdated: string;
      draftCreated: string;
      draftSaveFailed: string;
      saveBeforePdf: string;
      missingEntitlements: string;
      downloadLimitReached: string;
      pdfSuccess: string;
      pdfFailed: string;
      editorReset: string;
    };
  };
  privacy: {
    title: string;
    updated: string;
    intro: string;
    sections: { title: string; body: string[] }[];
    disclaimer: string;
    contact: string;
  };
};

type LocaleSettings = {
  label: string;
  region: 'global' | 'jp';
  pricing: {
    growthPrice: string;
    growthFrequency: string;
  };
};

type LocalizationContextValue = {
  language: Locale;
  setLanguage: (locale: Locale) => void;
  copy: TranslationDefinition;
  settings: LocaleSettings;
};

const translations: Record<Locale, TranslationDefinition> = {
  en: {
    nav: {
      marketingLinks: [
        { href: '/#overview', label: 'Overview' },
        { href: '/#templates', label: 'Templates' },
        { href: '/#pricing', label: 'Pricing' },
        { href: '/privacy', label: 'Privacy' },
      ],
      dashboard: 'Dashboard',
      visitWebsite: 'Visit website',
      subscribe: 'Subscribe',
      searchPlaceholder: 'Search templates',
      signIn: 'Sign in',
      signOut: 'Sign out',
      languageLabel: 'Language',
    },
    landing: {
      hero: {
        breadcrumbs: { home: 'Career Studio GM7', trail: 'Resume editor website flow' },
        contextPill: 'Career Studio GM7',
        badge: 'Career Studio GM7',
        title: 'Build resume experiences your candidates will love',
        copy:
          'Designed to echo a polished product page, this flow showcases pricing, templates, and authentication while keeping admin utilities only a direct URL away. Everything is tuned for clarity when you share it with stakeholders.',
        previewTitle: 'Resume Editor Website Flow',
        previewHeading: 'Modern resumes without wrestling with layout files',
        previewSubtitle: 'Last updated June 2024',
        previewDescription:
          'Pick a template, tailor the copy, and hand a recruiter a polished PDF minutes after signing in. Team guardrails make every export feel on-brand.',
        previewList: ['Streamed PDF generation', 'Secure authentication', 'Flexible editing'],
        previewUpdatedLabel: 'Last updated June 2024',
        previewViews: '1.2k previews',
        metadata: [
          { label: 'Latest update', value: 'June 2024' },
          { label: 'Version', value: 'v2.1' },
          { label: 'Access', value: 'Included with Growth plan' },
        ],
        metrics: [
          { label: 'Templates', value: '12+' },
          { label: 'Locales supported', value: '6' },
          { label: 'Avg. export time', value: '~2s' },
          { label: 'Draft autosave', value: 'Realtime' },
        ],
        featuresIntro:
          'A landing experience inspired by Figma community resources—introducing a hero preview, detailed release metadata, and a modular layout that surfaces features, templates, and plan restrictions without feeling crowded.',
        features: [
          {
            title: 'Streamed PDF generation',
            description:
              'Generate resumes on the fly without storing files thanks to Next.js route handlers and @react-pdf/renderer.',
          },
          {
            title: 'Secure authentication',
            description: 'Offer passwordless email links and Google sign-in powered by Firebase Auth in the Tokyo region.',
          },
          {
            title: 'Flexible editing',
            description: 'Save drafts, templates, and entitlement tracking in Firestore so your data is always up to date.',
          },
          {
            title: 'Ready to scale',
            description:
              'Deploy on Vercel with server-side rendering, connect Upstash for rate limiting, and plug Stripe in when you are ready to charge.',
          },
        ],
        resourcesTitle: 'Resources',
        resources: [
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
        ],
        tagsTitle: 'Tags',
        tags: ['Resume builder', 'Design system', 'Hiring', 'Templates', 'PDF', 'Firebase'],
        primaryAction: 'Launch editor',
        secondaryAction: 'Preview templates',
        overviewTitle: 'Overview',
        projectMetadataTitle: 'Project metadata',
        maintainerLabel: 'Maintainer',
        maintainerValue: 'Career Studio GM7 design systems',
        templateGalleryTitle: 'Template gallery',
        templateGalleryCopy:
          'Browse localized resume systems with typography tuned for hiring teams. Each template ships with rich sample data so stakeholders see exactly how content comes together.',
        templateUse: 'Use this template',
        pricingTitle: 'Pricing & availability',
        pricingCopy:
          'Free plans showcase the full editor once, Growth unlocks collaborative workflows, and Enterprise brings governance plus bespoke template production.',
        ctaTitle: 'Ready to build your next standout resume?',
        ctaCopy:
          'Sign in to Career Studio GM7 to unlock the editor, invite collaborators, and manage download limits with a click.',
        ctaPrimary: 'Sign in to continue',
        ctaSecondary: 'Explore dashboard',
      },
      pricingPlans: [
        {
          name: 'Starter',
          price: '$0',
          description: 'For individuals trying the builder before sharing their first PDF.',
          features: ['3 saved resumes', 'Single-page PDF exports', 'Email link authentication'],
          cta: 'Start for free',
          frequency: '/month',
          href: '/login?plan=starter',
        },
        {
          name: 'Growth',
          priceKey: 'growth',
          description: 'For talent teams publishing polished resumes every week.',
          features: [
            'Unlimited drafts & version history',
            'Full template library & locale packs',
            'Brand colors, fonts & shared assets',
            'Priority email support',
          ],
          cta: 'Upgrade to Growth',
          frequency: 'per week',
          href: '/login?plan=growth',
          badge: 'Most popular',
          highlighted: true,
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
      ],
    },
    login: {
      heroTagline: 'Premium resume workspace',
      heroTitle: 'A polished resume platform that feels like your design team built it.',
      heroCopy:
        'Craft localized resumes and global CVs with modern templates, collaborative controls, and export-ready PDF rendering—all secured by passwordless authentication.',
      heroBrand: 'Trusted for premium resume workflows.',
      cardTitleSignIn: 'Welcome back',
      cardTitleSignUp: 'Create your account',
      cardDescriptionSignIn:
        'Choose a secure password login or receive a one-time magic link. You can also continue instantly with Google.',
      cardDescriptionSignUp:
        'Create your account with a password or request a secure email link. Google sign-in is also available.',
      methodMagicLink: 'Email magic link',
      methodPassword: 'Use password',
      labels: {
        email: 'Email address',
        password: 'Password',
        confirmPassword: 'Confirm password',
      },
      placeholders: {
        email: 'you@example.com',
        password: 'Enter a secure password',
        confirmPassword: 'Re-enter your password',
      },
      submit: {
        magicLinkSignIn: 'Email me a sign-in link',
        magicLinkSignUp: 'Email me a sign-up link',
        passwordSignIn: 'Sign in with password',
        passwordSignUp: 'Create account with password',
        sending: 'Sending…',
        signingIn: 'Signing in…',
        creatingAccount: 'Creating account…',
      },
      divider: 'or continue with',
      continueWithGoogle: 'Continue with Google',
      switchToSignUp: 'Need an account? Create one',
      switchToSignIn: 'Already have an account? Sign in',
      status: {
        emailSentSignIn: 'Check your inbox for a secure sign-in link.',
        emailSentSignUp: 'Check your inbox to confirm your new account.',
        sendEmailError: 'Unable to send sign-in email. Please try again.',
        missingCredentials: 'Please provide both an email address and password.',
        shortPassword: 'Choose a password with at least 8 characters.',
        passwordMismatch: 'Passwords do not match.',
        passwordSignInFailed: 'Unable to sign in with that password. Please check your details and try again.',
        passwordSignUpFailed: 'Unable to create the account. Please verify your details and try again.',
        googleFailed: 'Google sign-in failed. Please retry.',
      },
    },
    adminLogin: {
      heroTagline: 'Admin workspace',
      heroTitle: 'Secure admin access',
      heroCopy:
        'Monitor workspace activity, reset download allowances, and oversee subscriptions. Only approved administrators can access this console.',
      heroLinkPrompt: 'Need the main workspace?',
      heroLinkText: 'Return to member sign-in',
      cardTitle: 'Admin console sign-in',
      cardCopy: 'Use the credentials issued to administrators of Career Studio GM7.',
      labels: {
        email: 'Admin email',
        password: 'Password',
      },
      placeholders: {
        email: 'admin@example.com',
        password: 'Enter your admin password',
      },
      submitIdle: 'Access admin dashboard',
      submitLoading: 'Signing in…',
      status: {
        missingCredentials: 'Enter the admin email address and password.',
        invalidRole: 'This account does not have admin access.',
        signInError: 'Unable to sign in. Confirm your admin credentials and try again.',
      },
    },
    adminDashboard: {
      headerTitle: 'Admin control center',
      headerSubtitle: 'Monitor workspace health & manage entitlements',
      searchPlaceholder: 'Search users or commands',
      createReport: 'Create report',
      signOut: 'Sign out',
      tabs: [
        { id: 'overview', label: 'Overview', description: 'Metrics and recent activity.' },
        { id: 'users', label: 'Users', description: 'Manage roles and entitlements.' },
        { id: 'downloads', label: 'Downloads', description: 'Audit generated documents.' },
        { id: 'subscriptions', label: 'Subscriptions', description: 'Review paid customers.' },
        { id: 'templates', label: 'Templates', description: 'Organize available layouts.' },
      ],
      badge: 'Career Studio GM7',
      badgeDescriptor: 'Admin operations',
      roleLabel: 'Role',
      overviewTitle: 'Workspace performance overview',
      overviewCopy:
        'Signed in as {{email}}. Track adoption, audit downloads, and keep template catalogs aligned with hiring goals—all from a single command center.',
      metrics: [
        { label: 'Total users', valueKey: 'totalUsers' },
        { label: 'Pro seats', valueKey: 'proUsers' },
        { label: 'Downloads (30d)', valueKey: 'downloads30' },
        { label: 'All-time downloads', valueKey: 'totalDownloads' },
      ],
      metricFooters: {
        proUsers: 'Active Growth subscriptions',
        downloads30: 'Generated in the last 30 days',
      },
      downloadsHeading: 'Download history',
      downloadsEmpty: 'No downloads recorded yet. Use the Download PDF button inside the editor to create your first file.',
      downloadsLoading: 'Loading downloads…',
      downloadsColumns: {
        document: 'Document',
        user: 'User',
        template: 'Template',
        language: 'Language',
        plan: 'Plan',
        created: 'Created',
      },
      templatesHeading: 'Template catalog',
      templatesCopy: 'Review the current library of resume and CV layouts.',
      templatesEmpty: 'No templates registered yet.',
      templatesLoading: 'Loading templates…',
      templatesColumns: {
        name: 'Name',
        kind: 'Type',
        description: 'Description',
        accent: 'Accent color',
        actions: 'Actions',
      },
      duplicateTemplate: 'Duplicate template',
      duplicateTemplateLoading: 'Duplicating…',
      usersHeading: 'Member directory',
      usersCopy: 'Promote admins, adjust allowances, and open the detail view for full profile controls.',
      usersEmpty: 'No users found.',
      usersColumns: {
        email: 'Email',
        role: 'Role',
        plan: 'Plan',
        remainingDownloads: 'Downloads left',
        unlimitedDownloads: 'Unlimited',
        nextRefresh: 'Next refresh',
        subscriptionStatus: 'Subscription status',
        createdAt: 'Created',
        actions: 'Actions',
      },
      usersDetail: {
        title: 'User details',
        subtitle: 'Select a member to inspect their profile and advanced controls.',
        selectedSubtitle: 'Managing {{email}}',
        noSelection: 'Select a member above to view profile details.',
        sections: {
          profile: 'Profile',
          entitlements: 'Entitlements',
          subscription: 'Subscription',
          actions: 'Advanced actions',
        },
        labels: {
          email: 'Email',
          role: 'Role',
          createdAt: 'Created',
          plan: 'Plan',
          downloads: 'Downloads left',
          nextRefresh: 'Next refresh',
          subscriptionStatus: 'Subscription status',
          subscriptionPeriodEnd: 'Period end',
          stripeCustomerId: 'Stripe customer ID',
        },
      },
      buttons: {
        setUser: 'Set user',
        setAdmin: 'Set admin',
        addDownloads: '+10 downloads',
        resetDownloads: 'Reset allowance',
        resetDownloadsLoading: 'Resetting…',
        setPlanToFree: 'Set free plan',
        setPlanToPro: 'Set pro plan',
        refreshStatus: 'Refresh status',
        refreshStatusLoading: 'Syncing…',
        deleteUser: 'Delete user',
        deleteUserLoading: 'Removing…',
        viewDetails: 'View details',
      },
      statuses: {
        roleUpdated: 'Role updated to {{role}} successfully.',
        roleUpdateFailed: 'Failed to update role.',
        adjustSuccess: 'Adjusted downloads by {{delta}}.',
        adjustFailed: 'Unable to adjust download allowance.',
        resetSuccess: 'Download allowance reset to {{allowance}}.',
        resetFailed: 'Failed to reset download allowance.',
        planUpdated: 'Plan updated to {{plan}}.',
        planFailed: 'Failed to update plan.',
        subscriptionRefreshed: 'Subscription status refreshed (demo mode).',
        subscriptionFailed: 'Unable to refresh the subscription status right now.',
        templatesFailed: 'Unable to load templates.',
        downloadsFailed: 'Unable to load downloads from Firestore.',
        templateDuplicated: 'Template duplicated.',
        userDeleted: 'User removed and notified via email.',
        userDeleteFailed: 'Failed to delete the user.',
        userDeleteEmailFailed: 'User deleted, but notification email could not be sent.',
      },
      confirmations: {
        deleteUser: 'Delete {{email}} from the workspace? A notification email will be sent.',
      },
      subscriptionsColumns: {
        email: 'Email',
        customer: 'Customer reference',
        plan: 'Plan',
        status: 'Status',
        periodEnd: 'Period end',
        actions: 'Actions',
      },
    },
    resumeDashboard: {
      heroBadge: 'Career Studio GM7',
      heroContext: 'Member workspace',
      heroTitle: 'Your resume operations hub',
      heroCopy:
        'Manage localized resumes, monitor download allowances, and keep drafts in sync across collaborators.',
      signedInFallback: 'Signed in member',
      planLabel: 'Plan',
      downloadsLeftLabel: 'Downloads left',
      unlimitedDownloads: 'Unlimited',
      unlimitedDownloadsDescription: 'Unlimited downloads while your subscription is active.',
      nextRefreshLabel: 'Next refresh',
      subscribeCta: 'Subscribe to Growth',
      subscribeCtaLoading: 'Connecting…',
      loadingEntitlements: 'Loading entitlements…',
      resumeHeading: 'Resume workspace',
      resumeCopy: 'Craft resumes with production-ready templates, edit every section, and export polished PDFs.',
      sectionLabels: [
        { id: 'resume', label: 'Resumes', description: 'Design and export tailored resumes.' },
        { id: 'cv', label: 'CVs', description: 'Long-form curriculum vitae layouts.' },
        { id: 'drafts', label: 'Drafts', description: 'Revisit saved work in progress.' },
        { id: 'downloads', label: 'Downloads', description: 'Track generated PDF files.' },
        { id: 'settings', label: 'Settings', description: 'Manage account and workspace.' },
      ],
      searchPlaceholder: 'Search templates or sections',
      templateHeading: 'Template library',
      templateCopy: 'Switch templates at any time—your content stays synced to each locale.',
      draftsHeading: 'Draft progress',
      draftsDescription: 'Continue where you left off. Pick a draft to jump back into the editor or open a quick preview.',
      draftsEmpty: 'No drafts available at the moment.',
      draftsLoading: 'Loading drafts…',
      cvDraftsHeading: 'CV drafts',
      downloadsHeading: 'Download status',
      downloadsEmpty: 'No downloads recorded yet.',
      downloadsCopy:
        'Free plans can export one PDF. Growth subscribers unlock unlimited downloads with automatic refreshes.',
      settingsHeading: 'Account & limits',
      settingsCopy: 'Adjust workspace language, review entitlements, and collaborate securely.',
      downloadLimitNotice: 'Free plans reset weekly. Upgrade for unlimited downloads.',
      downloadLimitExceeded: 'Free plan download limit reached. Upgrade to keep exporting instantly.',
      downloadResetByAdmin: 'Ask an admin to reset your allowance or upgrade for unlimited exports.',
      freePlanRefreshInfo: 'Allowances reset weekly or whenever an admin refreshes your quota.',
      draftStatusLoading: 'Loading drafts…',
      draftStatusEmpty: 'No draft selected.',
      draftStatusLoaded: 'Editing draft: {{title}}',
      templateAction: 'Use this template',
      openInEditor: 'Open in editor ↗',
      saveDraftAction: 'Save draft',
      editAction: 'Edit',
      previewAction: 'Preview',
      resetAction: 'Reset',
      customTemplateFallback: 'Custom template',
      downloadAction: 'Download PDF',
      statuses: {
        loadTemplatesError: 'Unable to load templates from Firestore.',
        loadDraftsError: 'Unable to load drafts right now.',
        loadDownloadsError: 'Unable to load recent downloads.',
        signInRequired: 'Sign in to manage your subscription.',
        subscriptionRefreshed: 'Subscription data refreshed (demo mode).',
        subscriptionRefreshFailed: 'Unable to refresh subscription details right now.',
        upgradeSignInRequired: 'Sign in to upgrade your subscription.',
        checkoutDemo: 'Stripe billing runs in demo mode right now. Contact the team to enable live checkout.',
        checkoutFailed: 'Unable to trigger the demo checkout flow.',
        billingSignInRequired: 'Sign in to manage your subscription.',
        billingDisabled: 'Billing portal access is disabled in the demo environment.',
        billingError: 'Unable to open the demo billing portal.',
        subscriptionUpgraded: 'Subscription upgraded successfully.',
        checkoutCancelled: 'Subscription checkout cancelled.',
        draftNotFound: 'Draft not found.',
        draftLoaded: 'Draft loaded into the editor.',
        draftLoadFailed: 'Unable to load draft.',
        draftUpdated: 'Draft updated successfully.',
        draftCreated: 'Draft created successfully.',
        draftSaveFailed: 'Unable to save draft. Please try again.',
        saveBeforePdf: 'Save your draft before generating a PDF.',
        missingEntitlements: 'Missing entitlements data. Please reload the page.',
        downloadLimitReached:
          'You have reached the weekly download limit. Upgrade for unlimited exports or ask an admin to reset your allowance.',
        pdfSuccess: 'PDF generated successfully.',
        pdfFailed: 'Failed to generate PDF.',
        editorReset: 'Editor reset to template defaults.',
      },
    },
    privacy: {
      title: 'Privacy policy',
      updated: 'Last updated June 2024',
      intro:
        'This policy explains how Career Studio GM7 handles personal information inside the resume generator experience.',
      sections: [
        {
          title: 'Information we collect',
          body: [
            'We store the email address you use to authenticate, profile details you add to resume drafts, and audit logs for template downloads. No payment details are captured inside this demo environment.',
          ],
        },
        {
          title: 'How we use your data',
          body: [
            'Collected information is used to provide authenticated access, sync resume drafts across devices, and show admins aggregated usage metrics. Data is not sold or shared with advertisers.',
          ],
        },
        {
          title: 'Third-party services',
          body: [
            'Authentication and storage rely on Firebase, and PDF rendering uses @react-pdf/renderer. These providers process data according to their own policies.',
          ],
        },
        {
          title: 'Data retention & deletion',
          body: [
            'Drafts and activity logs remain until you delete them or request removal through the admin console. Backups or caches may persist for a limited period as part of infrastructure safeguards.',
          ],
        },
      ],
      disclaimer:
        'Career Studio GM7 is provided as-is. The creator and owner accept no responsibility or liability for any damages, losses, or disputes that arise from using this application.',
      contact: 'Questions? Email support@careerstudiogm7.com.',
    },
  },
  ja: {
    nav: {
      marketingLinks: [
        { href: '/#overview', label: '概要' },
        { href: '/#templates', label: 'テンプレート' },
        { href: '/#pricing', label: '料金' },
        { href: '/privacy', label: 'プライバシー' },
      ],
      dashboard: 'ダッシュボード',
      visitWebsite: 'ウェブサイトを見る',
      subscribe: 'プランに加入',
      searchPlaceholder: 'テンプレートを検索',
      signIn: 'ログイン',
      signOut: 'ログアウト',
      languageLabel: '言語',
    },
    landing: {
      hero: {
        breadcrumbs: { home: 'Career Studio GM7', trail: 'レジュメ編集サイトフロー' },
        contextPill: 'Career Studio GM7',
        badge: 'Career Studio GM7',
        title: '候補者に選ばれるレジュメ体験を',
        copy:
          '洗練されたプロダクトサイトをイメージした構成で、料金・テンプレート・認証フローを一目で把握。管理機能は直接URLに集約し、ステークホルダーへの共有も分かりやすく仕上げました。',
        previewTitle: 'レジュメ編集サイトフロー',
        previewHeading: 'レイアウト調整に悩まないモダンなレジュメ',
        previewSubtitle: '最終更新 2024年6月',
        previewDescription:
          'テンプレートを選び、テキストを整えるだけ。サインインから数分で採用担当に渡せるPDFを生成します。チームガードレールにより、どの書類もブランドらしさを保てます。',
        previewList: ['PDFストリーミング生成', 'セキュアな認証', '柔軟な編集'],
        previewUpdatedLabel: '最終更新 2024年6月',
        previewViews: 'プレビュー 1.2k 件',
        metadata: [
          { label: '最新アップデート', value: '2024年6月' },
          { label: 'バージョン', value: 'v2.1' },
          { label: 'アクセス', value: 'Growthプランに含まれます' },
        ],
        metrics: [
          { label: 'テンプレート数', value: '12+' },
          { label: '対応言語', value: '6' },
          { label: '平均出力時間', value: '~2秒' },
          { label: '下書き保存', value: 'リアルタイム' },
        ],
        featuresIntro:
          'Figmaコミュニティ資料をヒントに、ヒーロープレビューと詳細なリリース情報、特徴やプラン制限を無理なく整理したモジュラー構成を用意しました。',
        features: [
          {
            title: 'PDFストリーミング生成',
            description:
              'Next.jsのルートハンドラーと@react-pdf/rendererにより、ファイルを保存せず即時にPDFを生成します。',
          },
          {
            title: 'セキュアな認証',
            description: 'Firebase Auth（東京リージョン）のパスワードレスリンクとGoogleログインを提供します。',
          },
          {
            title: '柔軟な編集',
            description: 'Firestoreに下書きやテンプレート、利用状況を保存し、常に最新のデータを維持します。',
          },
          {
            title: 'スケール対応',
            description:
              'VercelへのSSRデプロイ、Upstashでのレート制御、Stripe連携での課金開始までシームレスに対応します。',
          },
        ],
        resourcesTitle: 'リソース',
        resources: [
          {
            title: 'プラットフォーム概要',
            description: 'ログインからPDF出力までのワークフローを紹介します。',
            href: '/#overview',
          },
          {
            title: 'テンプレートショーケース',
            description: '製品に同梱されている多言語レジュメ/履歴書レイアウトを確認できます。',
            href: '/#templates',
          },
          {
            title: '料金と制限',
            description: '無料・Growth・Enterpriseの特典を比較できます。',
            href: '/#pricing',
          },
        ],
        tagsTitle: 'タグ',
        tags: ['レジュメビルダー', 'デザインシステム', '採用', 'テンプレート', 'PDF', 'Firebase'],
        primaryAction: 'エディターを起動',
        secondaryAction: 'テンプレートを見る',
        overviewTitle: '概要',
        projectMetadataTitle: 'プロジェクト情報',
        maintainerLabel: 'メンテナー',
        maintainerValue: 'Career Studio GM7 デザインシステム',
        templateGalleryTitle: 'テンプレートギャラリー',
        templateGalleryCopy:
          '採用チーム向けに整えられたタイポグラフィを備えたローカライズ済みレジュメを一覧できます。豊富なサンプルデータにより完成形のイメージが掴めます。',
        templateUse: 'このテンプレートを使う',
        pricingTitle: '料金と提供状況',
        pricingCopy:
          '無料プランは一度だけエディターのすべてを体験可能。Growthで共同編集と運用を、Enterpriseでガバナンスと専用制作を実現します。',
        ctaTitle: '次のレジュメを今すぐ形に',
        ctaCopy: 'Career Studio GM7にサインインしてエディターを解放し、共同編集やダウンロード制限の管理を始めましょう。',
        ctaPrimary: 'サインインして続行',
        ctaSecondary: 'ダッシュボードを見る',
      },
      pricingPlans: [
        {
          name: 'スターター',
          price: '¥0',
          description: '最初のPDF共有前にビルダーを試したい個人向け。',
          features: ['レジュメを3件保存', '1ページPDF出力', 'メールリンク認証'],
          cta: '無料で始める',
          frequency: '/月',
          href: '/login?plan=starter',
        },
        {
          name: 'Growth',
          priceKey: 'growth',
          description: '毎週洗練されたレジュメを仕上げる採用チーム向け。',
          features: ['無制限の下書きと履歴', '全テンプレート & ロケール', 'ブランドカラー/フォント/共有アセット', '優先メールサポート'],
          cta: 'Growthにアップグレード',
          frequency: '／週',
          href: '/login?plan=growth',
          badge: '人気',
          highlighted: true,
        },
        {
          name: 'エンタープライズ',
          price: 'お問い合わせください',
          description: '高度なガバナンスとサポートを求めるグローバル組織向け。',
          features: ['SAML SSO & SCIMプロビジョニング', 'カスタムテンプレート制作', '専任カスタマーサクセス', 'オンプレミス出力にも対応'],
          cta: '相談を予約',
          href: '/login?plan=enterprise',
        },
      ],
    },
    login: {
      heroTagline: 'プレミアムなレジュメワークスペース',
      heroTitle: 'デザインチームが作ったような完成度のレジュメ基盤。',
      heroCopy:
        'モダンなテンプレートと共同編集、即出力できるPDFレンダリングを備え、多言語レジュメとグローバルCVを安全に作成できます。',
      heroBrand: '上質なレジュメ運用のための信頼のプラットフォーム。',
      cardTitleSignIn: 'おかえりなさい',
      cardTitleSignUp: 'アカウントを作成',
      cardDescriptionSignIn:
        '安全なパスワードログインまたはワンタイムのマジックリンクを選べます。Googleで即時サインインも可能です。',
      cardDescriptionSignUp:
        'パスワードで作成するか、安全なメールリンクを受け取れます。Googleサインインにも対応しています。',
      methodMagicLink: 'メールマジックリンク',
      methodPassword: 'パスワードを使う',
      labels: {
        email: 'メールアドレス',
        password: 'パスワード',
        confirmPassword: 'パスワード（確認）',
      },
      placeholders: {
        email: 'you@example.com',
        password: '安全なパスワードを入力',
        confirmPassword: 'パスワードを再入力',
      },
      submit: {
        magicLinkSignIn: 'サインインリンクを送信',
        magicLinkSignUp: '登録リンクを送信',
        passwordSignIn: 'パスワードでサインイン',
        passwordSignUp: 'パスワードで登録',
        sending: '送信中…',
        signingIn: 'サインイン中…',
        creatingAccount: 'アカウント作成中…',
      },
      divider: 'または次で続行',
      continueWithGoogle: 'Googleで続行',
      switchToSignUp: 'アカウントが必要ですか？作成する',
      switchToSignIn: 'すでにアカウントがありますか？サインイン',
      status: {
        emailSentSignIn: '受信箱で安全なサインインリンクを確認してください。',
        emailSentSignUp: '受信箱でアカウント確認メールを確認してください。',
        sendEmailError: 'サインインメールを送信できませんでした。もう一度お試しください。',
        missingCredentials: 'メールアドレスとパスワードを入力してください。',
        shortPassword: '8文字以上のパスワードを設定してください。',
        passwordMismatch: 'パスワードが一致しません。',
        passwordSignInFailed: 'パスワードでサインインできません。入力内容をご確認ください。',
        passwordSignUpFailed: 'アカウントを作成できませんでした。入力内容をご確認ください。',
        googleFailed: 'Googleサインインに失敗しました。再度お試しください。',
      },
    },
    adminLogin: {
      heroTagline: '管理者ワークスペース',
      heroTitle: '安全な管理者ログイン',
      heroCopy:
        'ワークスペースのアクティビティを監視し、ダウンロード上限をリセットし、サブスクリプションを管理します。承認済み管理者のみがアクセスできます。',
      heroLinkPrompt: 'メインのワークスペースはこちら',
      heroLinkText: 'メンバー用サインインへ戻る',
      cardTitle: '管理コンソールへサインイン',
      cardCopy: 'Career Studio GM7管理者用の資格情報を入力してください。',
      labels: {
        email: '管理者メールアドレス',
        password: 'パスワード',
      },
      placeholders: {
        email: 'admin@example.com',
        password: '管理者パスワードを入力',
      },
      submitIdle: '管理ダッシュボードへ進む',
      submitLoading: 'サインイン中…',
      status: {
        missingCredentials: '管理者メールアドレスとパスワードを入力してください。',
        invalidRole: 'このアカウントには管理者権限がありません。',
        signInError: 'サインインできませんでした。管理者資格情報を確認してください。',
      },
    },
    adminDashboard: {
      headerTitle: '管理センター',
      headerSubtitle: 'ワークスペース状況と権限を管理',
      searchPlaceholder: 'ユーザーやコマンドを検索',
      createReport: 'レポートを作成',
      signOut: 'ログアウト',
      tabs: [
        { id: 'overview', label: '概要', description: '指標と最近のアクティビティ。' },
        { id: 'users', label: 'ユーザー', description: '権限と利用状況を管理。' },
        { id: 'downloads', label: 'ダウンロード', description: '生成されたドキュメントを監査。' },
        { id: 'subscriptions', label: 'サブスクリプション', description: '有料顧客を確認。' },
        { id: 'templates', label: 'テンプレート', description: '利用可能なレイアウトを整理。' },
      ],
      badge: 'Career Studio GM7',
      badgeDescriptor: '管理オペレーション',
      roleLabel: 'ロール',
      overviewTitle: 'ワークスペースのパフォーマンス概要',
      overviewCopy:
        '現在 {{email}} としてサインイン中。採用状況を把握し、ダウンロード履歴を監査し、テンプレートを採用目標に合わせて管理できます。',
      metrics: [
        { label: 'ユーザー総数', valueKey: 'totalUsers' },
        { label: 'Growth契約', valueKey: 'proUsers' },
        { label: '30日間の出力', valueKey: 'downloads30' },
        { label: '累計ダウンロード', valueKey: 'totalDownloads' },
      ],
      metricFooters: {
        proUsers: '有効なGrowthサブスクリプション',
        downloads30: '直近30日で生成',
      },
      downloadsHeading: 'ダウンロード履歴',
      downloadsEmpty: 'まだダウンロードはありません。',
      downloadsLoading: 'ダウンロードを読み込み中…',
      downloadsColumns: {
        document: 'ドキュメント',
        user: 'ユーザー',
        template: 'テンプレート',
        language: '言語',
        plan: 'プラン',
        created: '作成日時',
      },
      templatesHeading: 'テンプレートカタログ',
      templatesCopy: '現在のレジュメ/履歴書レイアウトを確認します。',
      templatesEmpty: 'テンプレートがまだ登録されていません。',
      templatesLoading: 'テンプレートを読み込み中…',
      templatesColumns: {
        name: '名前',
        kind: '種類',
        description: '説明',
        accent: 'アクセントカラー',
        actions: '操作',
      },
      duplicateTemplate: 'テンプレートを複製',
      duplicateTemplateLoading: '複製中…',
      usersHeading: 'メンバーディレクトリ',
      usersCopy: '管理者昇格や権限調整、詳細ビューでプロフィールと操作を確認します。',
      usersEmpty: 'ユーザーが見つかりません。',
      usersColumns: {
        email: 'メールアドレス',
        role: 'ロール',
        plan: 'プラン',
        remainingDownloads: '残りダウンロード',
        unlimitedDownloads: '無制限',
        nextRefresh: '次回リフレッシュ',
        subscriptionStatus: 'サブスクリプション状態',
        createdAt: '作成日時',
        actions: '操作',
      },
      usersDetail: {
        title: 'ユーザー詳細',
        subtitle: '上のリストからメンバーを選ぶとプロフィールと高度な操作を表示します。',
        selectedSubtitle: '{{email}} を管理中',
        noSelection: 'ユーザーを選択すると詳細が表示されます。',
        sections: {
          profile: 'プロフィール',
          entitlements: '権限と上限',
          subscription: 'サブスクリプション',
          actions: '高度な操作',
        },
        labels: {
          email: 'メールアドレス',
          role: 'ロール',
          createdAt: '作成日時',
          plan: 'プラン',
          downloads: '残りダウンロード',
          nextRefresh: '次回リフレッシュ',
          subscriptionStatus: 'サブスクリプション状態',
          subscriptionPeriodEnd: '期間終了',
          stripeCustomerId: 'Stripe顧客ID',
        },
      },
      buttons: {
        setUser: 'ユーザーに変更',
        setAdmin: '管理者に変更',
        addDownloads: '+10ダウンロード',
        resetDownloads: '上限をリセット',
        resetDownloadsLoading: 'リセット中…',
        setPlanToFree: 'フリープランに設定',
        setPlanToPro: 'プロプランに設定',
        refreshStatus: 'ステータスを更新',
        refreshStatusLoading: '同期中…',
        deleteUser: 'ユーザーを削除',
        deleteUserLoading: '削除中…',
        viewDetails: '詳細を表示',
      },
      statuses: {
        roleUpdated: 'ロールを{{role}}に更新しました。',
        roleUpdateFailed: 'ロールを更新できませんでした。',
        adjustSuccess: '{{delta}}件のダウンロード数を調整しました。',
        adjustFailed: 'ダウンロード上限を調整できませんでした。',
        resetSuccess: 'ダウンロード上限を{{allowance}}にリセットしました。',
        resetFailed: 'ダウンロード上限をリセットできませんでした。',
        planUpdated: 'プランを{{plan}}に更新しました。',
        planFailed: 'プランを更新できませんでした。',
        subscriptionRefreshed: 'サブスクリプション状態を更新しました（デモ）。',
        subscriptionFailed: '現在サブスクリプション状態を更新できません。',
        templatesFailed: 'テンプレートを読み込めませんでした。',
        downloadsFailed: 'Firestoreからダウンロードを読み込めませんでした。',
        templateDuplicated: 'テンプレートを複製しました。',
        userDeleted: 'ユーザーを削除し、メール通知を送信しました。',
        userDeleteFailed: 'ユーザーを削除できませんでした。',
        userDeleteEmailFailed: 'ユーザーは削除しましたが、通知メールを送信できませんでした。',
      },
      confirmations: {
        deleteUser: '{{email}} をワークスペースから削除しますか？通知メールが送信されます。',
      },
      subscriptionsColumns: {
        email: 'メールアドレス',
        customer: '顧客ID',
        plan: 'プラン',
        status: 'ステータス',
        periodEnd: '期間終了',
        actions: '操作',
      },
    },
    resumeDashboard: {
      heroBadge: 'Career Studio GM7',
      heroContext: 'メンバーワークスペース',
      heroTitle: 'レジュメ運用の司令塔',
      heroCopy: '多言語レジュメを管理し、ダウンロード上限と下書きをチームで共有します。',
      signedInFallback: 'サインイン中のメンバー',
      planLabel: 'プラン',
      downloadsLeftLabel: '残りダウンロード',
      unlimitedDownloads: '無制限',
      unlimitedDownloadsDescription: 'サブスクリプションが有効な間はダウンロード無制限です。',
      nextRefreshLabel: '次回リフレッシュ',
      subscribeCta: '有料プランに加入する',
      subscribeCtaLoading: '接続中…',
      loadingEntitlements: '権限を読み込み中…',
      resumeHeading: 'レジュメワークスペース',
      resumeCopy: '実運用レベルのテンプレートで各セクションを編集し、仕上げたPDFをすぐに共有できます。',
      sectionLabels: [
        { id: 'resume', label: 'レジュメ', description: '応募先に合わせてPDFを作成。' },
        { id: 'cv', label: 'CV', description: '詳細な職務経歴書レイアウト。' },
        { id: 'drafts', label: '下書き', description: '進行中の作業を再開。' },
        { id: 'downloads', label: 'ダウンロード', description: '生成済みPDFを確認。' },
        { id: 'settings', label: '設定', description: 'アカウントとワークスペースを管理。' },
      ],
      searchPlaceholder: 'テンプレートやセクションを検索',
      templateHeading: 'テンプレートライブラリ',
      templateCopy: 'いつでもテンプレートを切り替え可能。コンテンツは各ロケールに同期されます。',
      draftsHeading: '下書きの進捗',
      draftsDescription: '中断した場所から再開できます。エディターで編集するかプレビューを開いて内容を確認しましょう。',
      draftsEmpty: '現在利用できる下書きはありません。',
      draftsLoading: '下書きを読み込み中…',
      cvDraftsHeading: 'CVの下書き',
      downloadsHeading: 'ダウンロード状況',
      downloadsEmpty: 'ダウンロード履歴はまだありません。エディター内の「PDFをダウンロード」ボタンからファイルを生成してください。',
      downloadsCopy:
        '無料プランはPDFを1回のみ出力できます。Growthプランなら毎週自動リセットされ、ダウンロード無制限で運用できます。',
      settingsHeading: 'アカウントと上限',
      settingsCopy: 'ワークスペース言語を調整し、権限と共同編集を管理します。',
      downloadLimitNotice: '無料プランは毎週リセットされます。無制限プランへのアップグレードもご検討ください。',
      downloadLimitExceeded:
        '今週のダウンロード上限に達しました。アップグレードするか、管理者にリセットを依頼してください。',
      downloadResetByAdmin: '管理者にリセットを依頼するか、無制限プランにアップグレードしましょう。',
      freePlanRefreshInfo: '上限は毎週リセットされ、管理者が手動で更新することも可能です。',
      draftStatusLoading: '下書きを読み込み中…',
      draftStatusEmpty: '下書きが選択されていません。',
      draftStatusLoaded: '編集中の下書き: {{title}}',
      templateAction: 'このテンプレートを使う',
      openInEditor: 'エディターで開く ↗',
      saveDraftAction: '下書きを保存',
      editAction: '編集',
      previewAction: 'プレビュー',
      resetAction: 'リセット',
      customTemplateFallback: 'カスタムテンプレート',
      downloadAction: 'PDFをダウンロード',
      statuses: {
        loadTemplatesError: 'テンプレートを読み込めませんでした。',
        loadDraftsError: '下書きを読み込めませんでした。',
        loadDownloadsError: '最近のダウンロードを取得できませんでした。',
        signInRequired: 'サブスクリプションを管理するにはサインインしてください。',
        subscriptionRefreshed: 'サブスクリプション情報を更新しました（デモ）。',
        subscriptionRefreshFailed: 'サブスクリプション情報を更新できませんでした。',
        upgradeSignInRequired: 'プランをアップグレードするにはサインインしてください。',
        checkoutDemo: 'Stripe課金は現在デモモードです。ライブ利用にはチームへご連絡ください。',
        checkoutFailed: 'デモのチェックアウトフローを開始できませんでした。',
        billingSignInRequired: 'サブスクリプションを管理するにはサインインしてください。',
        billingDisabled: 'デモ環境では課金ポータルを利用できません。',
        billingError: 'デモ課金ポータルを開けませんでした。',
        subscriptionUpgraded: 'サブスクリプションをアップグレードしました。',
        checkoutCancelled: 'サブスクリプションのチェックアウトをキャンセルしました。',
        draftNotFound: '下書きが見つかりません。',
        draftLoaded: '下書きをエディターに読み込みました。',
        draftLoadFailed: '下書きを読み込めませんでした。',
        draftUpdated: '下書きを更新しました。',
        draftCreated: '下書きを作成しました。',
        draftSaveFailed: '下書きを保存できませんでした。もう一度お試しください。',
        saveBeforePdf: 'PDFを生成する前に下書きを保存してください。',
        missingEntitlements: '権限データが不足しています。ページを再読み込みしてください。',
        downloadLimitReached:
          '今週のダウンロード枠を使い切りました。アップグレードするか、管理者にリセットを依頼してください。',
        pdfSuccess: 'PDFを生成しました。',
        pdfFailed: 'PDFを生成できませんでした。',
        editorReset: 'テンプレートの初期状態にリセットしました。',
      },
    },
    privacy: {
      title: 'プライバシーポリシー',
      updated: '最終更新: 2024年6月',
      intro: 'Career Studio GM7がレジュメ生成体験の中でどのように個人情報を扱うかを説明します。',
      sections: [
        {
          title: '収集する情報',
          body: [
            '認証に利用するメールアドレス、下書きに入力したプロフィール情報、テンプレートのダウンロード履歴を保存します。デモ環境では決済情報は取得しません。',
          ],
        },
        {
          title: '利用目的',
          body: [
            '収集した情報はサインインの提供、デバイス間での下書き同期、管理者向けの利用状況集計に用います。広告目的で第三者に提供することはありません。',
          ],
        },
        {
          title: '外部サービス',
          body: [
            '認証とデータ保管はFirebaseを利用し、PDF生成は@react-pdf/rendererを使用します。各サービスはそれぞれのポリシーに基づいてデータを処理します。',
          ],
        },
        {
          title: '保管期間と削除',
          body: [
            '下書きやアクティビティログは、ユーザーが削除するか管理コンソールから削除を依頼するまで保持されます。インフラ保護のためバックアップやキャッシュが一定期間残る場合があります。',
          ],
        },
      ],
      disclaimer:
        'Career Studio GM7は現状のまま提供されます。本アプリの利用に起因する損害や紛争について、作者および所有者は一切の責任を負いません。',
      contact: 'プライバシーに関するお問い合わせ: support@careerstudiogm7.com',
    },
  },
};

const localeSettings: Record<Locale, LocaleSettings> = {
  en: {
    label: 'English',
    region: 'global',
    pricing: {
      growthPrice: '$10',
      growthFrequency: 'per week',
    },
  },
  ja: {
    label: '日本語',
    region: 'jp',
    pricing: {
      growthPrice: '¥333',
      growthFrequency: '／週',
    },
  },
};

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('career-studio-language');
    if (stored === 'en' || stored === 'ja') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (next: Locale) => {
    setLanguageState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('career-studio-language', next);
    }
  };

  const value = useMemo<LocalizationContextValue>(
    () => ({ language, setLanguage, copy: translations[language], settings: localeSettings[language] }),
    [language]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

export function formatMessage(template: string, replacements: Record<string, string | number>) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
    const trimmed = key.trim();
    const value = replacements[trimmed];
    return value !== undefined ? String(value) : '';
  });
}

