'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Zap, Wrench, Edit, FileImage, FolderOpen, Settings } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { getAllTools, getToolsByCategory } from '@/config/tools';
import { type Locale } from '@/lib/i18n/config';
import { CATEGORY_INFO, type ToolCategory } from '@/types/tool';

interface HomePageClientProps {
  locale: Locale;
  localizedToolContent?: Record<string, { title: string; description: string }>;
}

const categoryIcons: Record<ToolCategory, typeof Edit> = {
  'edit-annotate': Edit,
  'convert-to-pdf': FileImage,
  'convert-from-pdf': FileImage,
  'organize-manage': FolderOpen,
  'optimize-repair': Settings,
  'secure-pdf': ShieldCheck,
};

const categoryTranslationKeys: Record<ToolCategory, string> = {
  'edit-annotate': 'editAnnotate',
  'convert-to-pdf': 'convertToPdf',
  'convert-from-pdf': 'convertFromPdf',
  'organize-manage': 'organizeManage',
  'optimize-repair': 'optimizeRepair',
  'secure-pdf': 'securePdf',
};

const categoryOrder: ToolCategory[] = [
  'organize-manage',
  'edit-annotate',
  'convert-to-pdf',
  'convert-from-pdf',
  'optimize-repair',
  'secure-pdf',
];

export default function HomePageClient({ locale, localizedToolContent }: HomePageClientProps) {
  const t = useTranslations();
  const allTools = getAllTools();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const displayedTools = activeCategory
    ? allTools.filter(t => t.category === activeCategory)
    : allTools;

  const filteredTools = searchQuery.trim()
    ? displayedTools.filter(tool => {
        const q = searchQuery.toLowerCase();
        const name = (localizedToolContent?.[tool.id]?.title || tool.id).toLowerCase();
        return name.includes(q) || tool.features.some(f => f.toLowerCase().includes(q));
      })
    : displayedTools;

  return (
    <div className="kpdf-shell">
      {/* ── SIDEBAR ── */}
      <aside className={`kpdf-sidebar${sidebarCollapsed ? ' collapsed' : ''}`} aria-label="Tool navigation">
        {/* Hero brand header — it-tools gradient */}
        <Link href={`/${locale}`} className="block" style={{ textDecoration: 'none' }}>
          <div className="kpdf-hero">
            <div className="kpdf-hero-title">K-PDF</div>
            <div className="kpdf-hero-divider" />
            <div className="kpdf-hero-subtitle">Professional PDF Tools</div>
          </div>
        </Link>

        {/* Category navigation */}
        <nav className="py-2" aria-label="Tool categories">
          {/* All tools */}
          <button
            onClick={() => setActiveCategory(null)}
            className="kpdf-sidebar-item w-full text-left"
            style={activeCategory === null ? { color: 'hsl(var(--kpdf-primary))', background: 'hsl(var(--kpdf-primary) / 0.12)' } : {}}
          >
            All tools
          </button>

          {categoryOrder.map(cat => {
            const catName = t(`home.categories.${categoryTranslationKeys[cat]}`);
            const Icon = categoryIcons[cat];
            const toolCount = getToolsByCategory(cat).length;
            const isCollapsed = collapsedCategories[cat];

            return (
              <div key={cat}>
                <div
                  className="kpdf-sidebar-category"
                  onClick={() => toggleCategory(cat)}
                  role="button"
                  aria-expanded={!isCollapsed}
                >
                  <ChevronRight
                    size={14}
                    style={{
                      transition: 'transform 0.2s',
                      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                      opacity: 0.5,
                    }}
                  />
                  <span>{catName}</span>
                  <span className="ml-auto text-xs opacity-50">{toolCount}</span>
                </div>

                {!isCollapsed && (
                  <button
                    onClick={() => setActiveCategory(cat)}
                    className="kpdf-sidebar-item w-full text-left"
                    style={activeCategory === cat ? { color: 'hsl(var(--kpdf-primary))', background: 'hsl(var(--kpdf-primary) / 0.12)' } : {}}
                  >
                    <Icon size={14} style={{ opacity: 0.7 }} />
                    View all {catName}
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-3 py-4 text-xs text-center" style={{ color: 'hsl(var(--kpdf-muted-fg))' }}>
          <div>K-PDF Internal Tool</div>
          <div className="opacity-60">All processing in your browser</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="kpdf-content flex flex-col">
        <Header
          locale={locale}
          onMenuToggle={() => setSidebarCollapsed(prev => !prev)}
        />

        <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
          {/* Section heading */}
          <h1 className="kpdf-section-heading" style={{ marginTop: 0 }}>
            {activeCategory
              ? t(`home.categories.${categoryTranslationKeys[activeCategory]}`)
              : 'All tools'}
          </h1>

          <ToolGrid
            tools={filteredTools}
            locale={locale}
            localizedToolContent={localizedToolContent}
          />
        </main>

        <Footer locale={locale} />
      </div>
    </div>
  );
}
