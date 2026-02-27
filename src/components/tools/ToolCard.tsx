'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Tool, ToolCategory } from '@/types/tool';
import { ArrowUpRight } from 'lucide-react';
import { getToolIcon } from '@/config/icons';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

export interface ToolCardProps {
  /** Tool data to display */
  tool: Tool;
  /** Current locale for URL generation */
  locale: string;
  /** Optional additional CSS classes */
  className?: string;
  /** Localized content */
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
 * ToolCard component displays a single PDF tool with icon, name, and description.
 * Includes hover effects and links to the tool page.
 */
export function ToolCard({ tool, locale, className = '', localizedContent }: ToolCardProps) {
  const t = useTranslations();
  const toolUrl = `/${locale}/tools/${tool.slug}`;

  // Get a human-readable name from the tool ID
  // Use localized title if available, otherwise fallback to formatting the ID
  const toolName = localizedContent?.title || tool.id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Generate a crisp, punchy description from features to keep tiles simple
  const description = tool.features
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
      className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--kpdf-ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--kpdf-bg))] rounded-[var(--kpdf-radius-lg)] group ${className}`}
      data-testid="tool-card"
    >
      <div
        className="tool-card h-full p-4 relative"
        data-testid="tool-card-container"
      >
        {/* Favorite button */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton toolId={tool.id} size="sm" />
        </div>

        <div className="flex flex-col h-full gap-3">
          {/* Icon */}
          <div className="flex items-start gap-3">
            <div
              className="tool-card-icon"
              data-testid="tool-card-icon"
              aria-hidden="true"
            >
              <IconComponent className="w-5 h-5" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="tool-card-title mb-1 truncate"
              data-testid="tool-card-name"
            >
              {toolName}
            </h3>
            <p
              className="tool-card-description line-clamp-2"
              data-testid="tool-card-description"
            >
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--kpdf-border))]">
            <span className="tool-card-badge">
              {categoryName}
            </span>
            <ArrowUpRight
              className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ color: 'hsl(var(--kpdf-primary))' }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ToolCard;
