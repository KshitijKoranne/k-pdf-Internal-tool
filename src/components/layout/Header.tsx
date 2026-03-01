'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Menu, Home } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { RecentFilesDropdown } from '@/components/common/RecentFilesDropdown';
import { searchTools, SearchResult } from '@/lib/utils/search';
import { getToolContent } from '@/config/tool-content';
import { getAllTools } from '@/config/tools';
import { getToolIcon } from '@/config/icons';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';

export interface HeaderProps {
  locale: Locale;
  showSearch?: boolean;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ locale, showSearch = true, onMenuToggle }) => {
  const t = useTranslations('common');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localizedTools, setLocalizedTools] = useState<Record<string, { title: string; description: string }>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allTools = getAllTools();
    const contentMap: Record<string, { title: string; description: string }> = {};
    allTools.forEach(tool => {
      const content = getToolContent(locale, tool.id);
      if (content) contentMap[tool.id] = { title: content.title, description: content.metaDescription };
    });
    setLocalizedTools(contentMap);
  }, [locale]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchTools(searchQuery, localizedTools);
      setSearchResults(results.slice(0, 8));
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
    }
  }, [searchQuery, localizedTools]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateToTool = useCallback((slug: string) => {
    router.push(`/${locale}/tools/${slug}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [locale, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
      if (target) navigateToTool(target.tool.slug);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchResults, selectedIndex, navigateToTool]);

  return (
    /* it-tools topbar: slim, sits at top of content area */
    <header
      className="kpdf-topbar"
      role="banner"
    >
      {/* Menu toggle */}
      <button
        className="kpdf-icon-btn"
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        title="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Home button */}
      <Link href={`/${locale}`} className="kpdf-icon-btn" aria-label="Home">
        <Home size={20} />
      </Link>

      {/* Search — it-tools uses command palette style */}
      {showSearch && (
        <div className="flex-1 max-w-md relative hidden sm:block" ref={searchContainerRef}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              size={14}
              style={{ color: 'hsl(var(--kpdf-muted-fg))' }}
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 0) setIsSearchOpen(true);
              }}
              onFocus={() => { if (searchQuery.trim().length > 0) setIsSearchOpen(true); }}
              onKeyDown={handleKeyDown}
              placeholder={t('search.placeholder') || 'Search tools... (⌘K)'}
              className="w-full pl-8 pr-16 py-1.5 text-sm rounded-md border transition-colors focus:outline-none"
              style={{
                background: 'hsl(var(--kpdf-muted-bg))',
                borderColor: 'hsl(var(--kpdf-border))',
                color: 'hsl(var(--kpdf-fg))',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'hsl(var(--kpdf-primary))')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'hsl(var(--kpdf-border))')}
              aria-label="Search tools"
              autoComplete="off"
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] hidden lg:block"
              style={{ color: 'hsl(var(--kpdf-muted-fg))' }}
            >
              ⌘K
            </span>
          </div>

          {/* Results dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl overflow-hidden z-50"
              style={{
                background: 'hsl(var(--kpdf-card))',
                border: '1px solid hsl(var(--kpdf-border))',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
            >
              <ul className="py-1" role="listbox">
                {searchResults.map((result, index) => {
                  const localized = localizedTools[result.tool.id];
                  const name = localized?.title || result.tool.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const desc = result.tool.features.slice(0, 2).map(f => f.replace(/-/g, ' ')).join(' • ');
                  const Icon = getToolIcon(result.tool.icon);
                  const isSelected = index === selectedIndex;
                  return (
                    <li key={result.tool.id}>
                      <button
                        onClick={() => navigateToTool(result.tool.slug)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className="w-full px-3 py-2 text-left flex items-center gap-3 transition-colors"
                        style={{
                          background: isSelected ? 'hsl(var(--kpdf-muted-bg))' : 'transparent',
                          color: 'hsl(var(--kpdf-fg))',
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span style={{ color: 'hsl(var(--kpdf-icon-color))' }}>
                          <Icon size={18} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{name}</div>
                          <div className="text-xs truncate" style={{ color: 'hsl(var(--kpdf-muted-fg))' }}>{desc}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Right side actions */}
      <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
        <RecentFilesDropdown
          locale={locale}
          translations={{
            title: t('recentFiles.title') || 'Recent Files',
            empty: t('recentFiles.empty') || 'No recent files',
            clearAll: t('recentFiles.clearAll') || 'Clear all',
            processedWith: t('recentFiles.processedWith') || 'Processed with',
          }}
        />
        <div id="language-selector-slot" />
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;
