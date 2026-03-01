'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { getAllTools } from '@/config/tools';
import { type Locale } from '@/lib/i18n/config';

// Load pixel cat client-side only (canvas)
const PixelCat = dynamic(() => import('@/components/sidebar/PixelCat'), { ssr: false });

interface HomePageClientProps {
  locale: Locale;
  localizedToolContent?: Record<string, { title: string; description: string }>;
}

export default function HomePageClient({ locale, localizedToolContent }: HomePageClientProps) {
  const allTools = getAllTools();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="kpdf-shell">

      {/* ── SIDEBAR ── */}
      <aside
        className={`kpdf-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}
        aria-label="Sidebar"
      >
        {/* Brand hero */}
        <Link href={`/${locale}`} className="block" style={{ textDecoration: 'none' }}>
          <div className="kpdf-hero">
            <div className="kpdf-hero-title">K-PDF</div>
            <div className="kpdf-hero-divider" />
            <div className="kpdf-hero-subtitle">Professional PDF Tools</div>
          </div>
        </Link>

        {/* Pixel cat — fills remaining sidebar space */}
        <PixelCat />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="kpdf-content flex flex-col">
        <Header
          locale={locale}
          onMenuToggle={() => setSidebarCollapsed(prev => !prev)}
        />

        <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
          <h1 className="kpdf-section-heading" style={{ marginTop: 0 }}>
            All tools
          </h1>
          <ToolGrid
            tools={allTools}
            locale={locale}
            localizedToolContent={localizedToolContent}
          />
        </main>

        <Footer locale={locale} />
      </div>
    </div>
  );
}
