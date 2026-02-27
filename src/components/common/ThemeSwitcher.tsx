'use client';

import React, { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';

const THEMES = [
  { id: 'light', name: 'Light', color: '#ffffff' },
  { id: 'dark', name: 'Dark', color: '#0A0A0A' },
  { id: 'ocean', name: 'Ocean', color: '#082f49' },
];

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('k-pdf-theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('k-pdf-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-[hsl(var(--color-muted))] text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))] transition-colors"
        aria-label="Theme switcher"
        title="Change theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[hsl(var(--color-background))] border border-[hsl(var(--color-border))] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            <h3 className="text-xs font-semibold text-[hsl(var(--color-muted-foreground))] px-2 py-1 uppercase tracking-wider mb-1">Select Theme</h3>
            <ul className="flex flex-col gap-1">
              {THEMES.map((theme) => (
                <li key={theme.id}>
                  <button
                    onClick={() => changeTheme(theme.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                      currentTheme === theme.id ? 'bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))] font-medium' : 'text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]'
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                      style={{ backgroundColor: theme.color }}
                    />
                    {theme.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
