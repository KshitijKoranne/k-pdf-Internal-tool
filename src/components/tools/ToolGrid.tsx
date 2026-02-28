'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Tool, ToolCategory, CATEGORY_INFO } from '@/types/tool';
import { ToolCard } from './ToolCard';

export interface ToolGridProps {
  tools: Tool[];
  locale: string;
  category?: ToolCategory;
  searchQuery?: string;
  showCategoryHeaders?: boolean;
  className?: string;
  localizedToolContent?: Record<string, { title: string; description: string }>;
}

/**
 * ToolGrid — it-tools.tech aesthetic.
 * gap-12px (0.75rem), xl:4 lg:3 md:3 sm:2 cols.
 * Section headings styled as neutral-400 text like it-tools.
 */
export function ToolGrid({
  tools,
  locale,
  category,
  searchQuery,
  showCategoryHeaders = false,
  className = '',
  localizedToolContent,
}: ToolGridProps) {
  const t = useTranslations();

  const categoryTranslationKeys: Record<ToolCategory, string> = {
    'edit-annotate': 'editAnnotate',
    'convert-to-pdf': 'convertToPdf',
    'convert-from-pdf': 'convertFromPdf',
    'organize-manage': 'organizeManage',
    'optimize-repair': 'optimizeRepair',
    'secure-pdf': 'securePdf',
  };

  const filteredTools = useMemo(() => {
    let result = tools;
    if (category) result = result.filter(tool => tool.category === category);
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(tool => {
        if (localizedToolContent?.[tool.id]) {
          const { title, description } = localizedToolContent[tool.id];
          if (title.toLowerCase().includes(query) || description.toLowerCase().includes(query)) return true;
        }
        const toolName = tool.id.replace(/-/g, ' ').toLowerCase();
        const features = tool.features.map(f => f.replace(/-/g, ' ').toLowerCase()).join(' ');
        return toolName.includes(query) || features.includes(query);
      });
    }
    return result;
  }, [tools, category, searchQuery, localizedToolContent]);

  const groupedTools = useMemo(() => {
    if (!showCategoryHeaders) return null;
    const groups: Record<ToolCategory, Tool[]> = {
      'edit-annotate': [],
      'convert-to-pdf': [],
      'convert-from-pdf': [],
      'organize-manage': [],
      'optimize-repair': [],
      'secure-pdf': [],
    };
    for (const tool of filteredTools) groups[tool.category].push(tool);
    return groups;
  }, [filteredTools, showCategoryHeaders]);

  if (filteredTools.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`} data-testid="tool-grid-empty">
        <p style={{ color: 'hsl(var(--kpdf-muted-fg))' }}>No tools found</p>
      </div>
    );
  }

  if (showCategoryHeaders && groupedTools) {
    return (
      <div className={`space-y-2 ${className}`} data-testid="tool-grid">
        {Object.entries(groupedTools).map(([cat, categoryTools]) => {
          if (categoryTools.length === 0) return null;
          const categoryName = t(`home.categories.${categoryTranslationKeys[cat as ToolCategory]}`);
          return (
            <section key={cat} data-testid={`tool-grid-category-${cat}`}>
              <h2 className="kpdf-section-heading">{categoryName}</h2>
              <div className="kpdf-tool-grid">
                {categoryTools.map(tool => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    locale={locale}
                    localizedContent={localizedToolContent?.[tool.id]}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`kpdf-tool-grid ${className}`} data-testid="tool-grid">
      {filteredTools.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          locale={locale}
          localizedContent={localizedToolContent?.[tool.id]}
        />
      ))}
    </div>
  );
}

export default ToolGrid;
