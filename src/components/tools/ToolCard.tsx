'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Tool, ToolCategory } from '@/types/tool';
import { getToolIcon } from '@/config/icons';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

export interface ToolCardProps {
  tool: Tool;
  locale: string;
  className?: string;
  localizedContent?: { title: string; description: string };
}

const categoryTranslationKeys: Record<ToolCategory, string> = {
  'edit-annotate': 'editAnnotate',
  'convert-to-pdf': 'convertToPdf',
  'convert-from-pdf': 'convertFromPdf',
  'organize-manage': 'organizeManage',
  'optimize-repair': 'optimizeRepair',
  'secure-pdf': 'securePdf',
};

/**
 * ToolCard — it-tools.tech aesthetic.
 * 2px border, hover = border turns primary color.
 * Icon: neutral color (not primary). Title: card-fg. Desc: muted.
 */
export function ToolCard({ tool, locale, className = '', localizedContent }: ToolCardProps) {
  const t = useTranslations();
  const toolUrl = `/${locale}/tools/${tool.slug}`;

  const toolName = localizedContent?.title || tool.id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const description = localizedContent?.description || tool.features
    .slice(0, 3)
    .map(f => {
      const formatted = f.replace(/-/g, ' ');
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    })
    .join(' • ');

  const IconComponent = getToolIcon(tool.icon);
  const categoryName = t(`home.categories.${categoryTranslationKeys[tool.category]}`);

  return (
    <Link
      href={toolUrl}
      className={`block decoration-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--kpdf-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--kpdf-bg))] rounded-[var(--kpdf-radius-lg)] group ${className}`}
      data-testid="tool-card"
    >
      <div className="tool-card" data-testid="tool-card-container">
        {/* Top row: icon + favorite */}
        <div className="flex items-center justify-between">
          <div className="tool-card-icon" data-testid="tool-card-icon" aria-hidden="true">
            <IconComponent size={40} />
          </div>
          <FavoriteButton toolId={tool.id} size="sm" />
        </div>

        {/* Title */}
        <div className="tool-card-title" data-testid="tool-card-name">
          {toolName}
        </div>

        {/* Description */}
        <div className="tool-card-description" data-testid="tool-card-description">
          {description}
        </div>

        {/* Category badge */}
        <div>
          <span className="tool-card-badge">{categoryName}</span>
        </div>
      </div>
    </Link>
  );
}

export default ToolCard;
