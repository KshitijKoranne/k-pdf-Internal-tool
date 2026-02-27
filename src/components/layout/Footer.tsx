'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Shield, Lock, FileCheck } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';

export interface FooterProps {
  locale: Locale;
}

export const Footer: React.FC<FooterProps> = ({ locale }) => {
  const t = useTranslations('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] pt-16 pb-8"
      role="contentinfo"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
            <Link
              href={`/${locale}`}
              className="group flex items-center gap-2.5 text-xl font-bold text-[hsl(var(--color-foreground))]"
              aria-label={`${t('brand')} - ${t('navigation.home')}`}
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--color-primary))] text-white shadow-md transition-transform group-hover:scale-105 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full text-white">
                  <rect width="32" height="32" rx="6" fill="transparent"/>
                  <text x="50%" y="54%" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">K</text>
                </svg>
              </div>
              <span data-testid="footer-brand-name">{t('brand')}</span>
            </Link>
            <p className="text-sm text-[hsl(var(--color-muted-foreground))] leading-relaxed max-w-xs">
              K-PDF — Internal Tool. For authorized use only.
            </p>


          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-[hsl(var(--color-border))] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
            &copy; {currentYear} {t('brand')}. Internal Use Only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

