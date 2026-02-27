'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Menu, X, Command, Github } from 'lucide-react';
import { type Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/Button';
import { RecentFilesDropdown } from '@/components/common/RecentFilesDropdown';
import { searchTools, SearchResult } from '@/lib/utils/search';
import { getToolContent } from '@/config/tool-content';
import { getAllTools } from '@/config/tools';
import { getToolIcon } from '@/config/icons';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';

export interface HeaderProps {
  locale: Locale;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ locale, showSearch = true }) => {
  const t = useTranslations('common');
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localizedTools, setLocalizedTools] = useState<Record<string, { title: string; description: string }>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load localized tool content on mount
  useEffect(() => {
    const allTools = getAllTools();
    const contentMap: Record<string, { title: string; description: string }> = {};

    allTools.forEach(tool => {
      const content = getToolContent(locale, tool.id);
      if (content) {
        contentMap[tool.id] = {
          title: content.title,
          description: content.metaDescription
        };
      }
    });

    setLocalizedTools(contentMap);
  }, [locale]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchTools(searchQuery, localizedTools); // Pass localized content
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
    }
  }, [searchQuery, localizedTools]);

  // Close search when clicking outside
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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        navigateToTool(searchResults[selectedIndex].tool.slug);
      } else if (searchResults.length > 0) {
        navigateToTool(searchResults[0].tool.slug);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [searchResults, selectedIndex]);

  const navigateToTool = useCallback((slug: string) => {
    router.push(`/${locale}/tools/${slug}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [locale, router]);

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  // Keyboard shortcut for search
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

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Navigation items have been removed for a cleaner minimal interface

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? 'bg-[hsl(var(--color-background))]/80 backdrop-blur-md border-b border-[hsl(var(--color-border))/0.5] shadow-sm'
        : 'bg-transparent border-transparent'
        }`}
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}`}
              className="group flex items-center gap-2.5 text-xl font-bold text-[hsl(var(--color-foreground))] hover:opacity-90 transition-opacity"
              aria-label={`${t('brand')} - ${t('navigation.home')}`}
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-accent))] shadow-lg shadow-primary/25 transition-transform group-hover:scale-105 overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-full h-full text-white">
                  <rect width="32" height="32" rx="6" fill="transparent"/>
                  <text x="50%" y="54%" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">K</text>
                </svg>
              </div>
              <span className="text-xl tracking-tight" data-testid="brand-name">
                {t('brand')}
              </span>
            </Link>

          </div>


          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {showSearch && (
              <div className="relative flex items-center" ref={searchContainerRef}>
                <div className="relative w-48 md:w-64 lg:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--color-muted-foreground))]" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (!isSearchOpen && e.target.value.trim().length > 0) setIsSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length > 0) setIsSearchOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('search.placeholder') || 'Search tools...'}
                    className="w-full pl-10 pr-12 py-2 text-sm rounded-full border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] hover:border-[hsl(var(--color-primary)/0.5)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] transition-all"
                    aria-label="Search tools"
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center">
                    <span className="text-[10px] text-[hsl(var(--color-muted-foreground))] border border-[hsl(var(--color-border))] rounded px-1.5 py-0.5 bg-[hsl(var(--color-muted))]">⌘K</span>
                  </div>

                  {/* Search Results Dropdown */}
                  {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[60vh] overflow-y-auto z-50">
                      <ul className="py-2" role="listbox">
                        {searchResults.map((result, index) => {
                          const localized = localizedTools[result.tool.id];
                          const toolName = localized?.title || result.tool.id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                          const toolDescription = result.tool.features.slice(0, 3).map(f => {
                            const formatted = f.replace(/-/g, ' ');
                            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                          }).join(' • ');

                          return (
                            <li key={result.tool.id}>
                              <button
                                onClick={() => navigateToTool(result.tool.slug)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`
                                  w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors
                                  ${index === selectedIndex
                                    ? 'bg-[hsl(var(--color-primary))/0.1] text-[hsl(var(--color-primary))]'
                                    : 'hover:bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))]'
                                  }
                                `}
                                role="option"
                                aria-selected={index === selectedIndex}
                              >
                                <div className="text-[hsl(var(--color-primary))]">
                                  {React.createElement(getToolIcon(result.tool.icon), { size: 18 })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate">
                                    {toolName}
                                  </div>
                                  <div className="text-xs text-[hsl(var(--color-muted-foreground))] truncate">
                                    {toolDescription}
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Files Dropdown */}
            <RecentFilesDropdown
              locale={locale}
              translations={{
                title: t('recentFiles.title') || 'Recent Files',
                empty: t('recentFiles.empty') || 'No recent files',
                clearAll: t('recentFiles.clearAll') || 'Clear all',
                processedWith: t('recentFiles.processedWith') || 'Processed with',
              }}
            />



            {/* Language Selector placeholder */}
            <div id="language-selector-slot" />
            
            <ThemeSwitcher />


          </div>
        </div>


      </div>
    </header>
  );
};

export default Header;
