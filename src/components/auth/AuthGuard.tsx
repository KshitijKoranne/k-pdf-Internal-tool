'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check session storage on mount
    const authStatus = sessionStorage.getItem('k-pdf-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // If not on login page, redirect to login
      if (!pathname.includes('/login')) {
        // preserve locale if possible. It usually starts with /en, /fr
        const pathSegments = pathname.split('/').filter(Boolean);
        const locale = pathSegments[0] || 'en';
        router.push(`/${locale}/login`);
      }
    }
  }, [pathname, router]);

  // If on login page, render children
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  // Still verifying or not authenticated (will redirect soon)
  if (isAuthenticated !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--color-background))]">
        <div className="animate-spin w-8 h-8 border-4 border-[hsl(var(--color-primary))] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}
