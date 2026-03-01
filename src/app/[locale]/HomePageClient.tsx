'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { getAllTools } from '@/config/tools';
import { type Locale } from '@/lib/i18n/config';

const ZombieWalker = dynamic(() => import('@/components/sidebar/ZombieWalker'), { ssr: false });

interface HomePageClientProps {
  locale: Locale;
  localizedToolContent?: Record<string, { title: string; description: string }>;
}

export default function HomePageClient({ locale, localizedToolContent }: HomePageClientProps) {
  const allTools = getAllTools();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount + resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar when clicking overlay on mobile
  const handleOverlayClick = () => setSidebarOpen(false);

  // On desktop sidebar is always visible; on mobile it's a drawer
  const sidebarVisible = isMobile ? sidebarOpen : true;

  return (
    <div className="kpdf-shell">

      {/* ── Mobile overlay backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className="kpdf-sidebar"
        style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        } : {}}
        aria-label="Sidebar"
      >
        {/* Brand hero */}
        <Link
          href={`/${locale}`}
          className="block"
          style={{ textDecoration: 'none' }}
          onClick={() => isMobile && setSidebarOpen(false)}
        >
          <div className="kpdf-hero">
            <div className="kpdf-hero-title">K-PDF</div>
            <div className="kpdf-hero-divider" />
            <div className="kpdf-hero-subtitle">Professional PDF Tools</div>
          </div>
        </Link>

        {/* Zombie fills remaining sidebar space */}
        <ZombieWalker />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="kpdf-content flex flex-col" style={{ minWidth: 0 }}>
        <Header
          locale={locale}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />

        <main id="main-content" className="flex-1 p-4 md:p-6" tabIndex={-1}>
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
