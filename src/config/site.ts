/**
 * Site configuration
 */
export const siteConfig = {
  name: 'K-PDF',
  description: 'K-PDF — Internal PDF Toolkit for organizational use.',
  url: 'https://k-pdf.devtoolcafe.com',
  ogImage: '/images/og-image.png',
  links: {
    github: '',
    twitter: '',
  },
  creator: 'K-PDF Team',
  keywords: [
    'PDF tools',
    'PDF editor',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'convert PDF',
    'free PDF tools',
    'online PDF editor',
    'browser-based PDF',
    'private PDF processing',
  ],
  // SEO-related settings
  seo: {
    titleTemplate: '%s | K-PDF',
    defaultTitle: 'K-PDF - Professional PDF Tools',
    twitterHandle: '@k-pdf',
    locale: 'en_US',
  },
};

/**
 * Navigation configuration
 */
export const navConfig = {
  mainNav: [
    { title: 'Home', href: '/' },
    { title: 'Tools', href: '/tools' },
    { title: 'About', href: '/about' },
    { title: 'FAQ', href: '/faq' },
  ],
  footerNav: [
    { title: 'Privacy', href: '/privacy' },
    { title: 'Terms', href: '/terms' },
    { title: 'Contact', href: '/contact' },
  ],
};
